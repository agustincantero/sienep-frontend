"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, FilterX, Pencil, Plus, UserCheck, UserX } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import {
  ESTADOS,
  FILTROS_POR_DEFECTO,
  ORDENES,
  aQuery,
  hayFiltrosActivos,
  leerFiltros,
  type FiltrosEstudiantes,
  type OrdenEstudiantes,
} from "@/lib/estudiantes-filtros";
import { listGroups, type Group } from "@/lib/groups";
import { useSession } from "@/lib/session-context";
import {
  deactivateStudent,
  describirProcesosAbiertos,
  getProcesosAbiertos,
  listStudents,
  reactivateStudent,
  type StudentSummary,
} from "@/lib/students";
import { DataTable } from "@/components/ui/DataTable";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";
import { ConfirmDialog } from "./ConfirmDialog";
import { EstadoBadge } from "./EstadoBadge";
import { StudentAvatar } from "./StudentAvatar";

// Últimos filtros usados en la sesión: al volver a /estudiantes sin filtros en la URL (desde la ficha o el
// menú) se restauran. sessionStorage y no localStorage: no tienen por qué sobrevivir a cerrar el navegador.
const CLAVE_FILTROS = "sienep:estudiantes:filtros";

function leerFiltrosGuardados(): string | null {
  try {
    return window.sessionStorage.getItem(CLAVE_FILTROS);
  } catch {
    return null;
  }
}

function guardarFiltros(query: string) {
  try {
    if (query) window.sessionStorage.setItem(CLAVE_FILTROS, query);
    else window.sessionStorage.removeItem(CLAVE_FILTROS);
  } catch {
    // Sin sessionStorage (modo privado, bloqueado): los filtros siguen funcionando, solo no se recuerdan.
  }
}

// RF08: búsqueda y filtros combinables, con orden y paginación. Los filtros, el orden y la página viven en la
// URL (filtrosIniciales viene de la page), así sobreviven a recargar, al "atrás" y a compartir el link.
export function StudentsListView({ filtrosIniciales }: { filtrosIniciales: FiltrosEstudiantes }) {
  const router = useRouter();
  const { permisos } = useSession();
  const puedeBuscar = permisos.includes("BUSCAR_ESTUDIANTE");
  const puedeCrear = permisos.includes("CREAR_ESTUDIANTE");
  const puedeEditar = permisos.includes("EDITAR_ESTUDIANTE");
  const puedeDesactivar = permisos.includes("DESACTIVAR_ESTUDIANTE");
  const puedeReactivar = permisos.includes("REACTIVAR_ESTUDIANTE");

  const [texto, setTexto] = useState(filtrosIniciales.texto);
  // Lo que efectivamente se busca: sigue a `texto` con 300 ms de demora (evita un pedido por tecla). Se setea
  // directo, sin demora, al restaurar o limpiar los filtros.
  const [textoDebounced, setTextoDebounced] = useState(filtrosIniciales.texto);
  const [nomGrupo, setNomGrupo] = useState(filtrosIniciales.grupo);
  const [nomCarrera, setNomCarrera] = useState(filtrosIniciales.carrera);
  const [estadoLabel, setEstadoLabel] = useState(filtrosIniciales.estado);
  const [orden, setOrden] = useState<OrdenEstudiantes>(filtrosIniciales.orden);
  const [page, setPage] = useState(filtrosIniciales.pagina);
  // false hasta decidir si hay filtros guardados para restaurar: así la primera búsqueda ya sale con ellos,
  // en vez de buscar sin filtros y repetir.
  const [listo, setListo] = useState(false);
  const restauracionHecha = useRef(false);

  // Cualquier cambio de búsqueda/filtro vuelve a la primera página — se
  // resuelve acá mismo (evento del usuario) en vez de con un efecto aparte.
  function conResetDePagina<T>(setter: (valor: T) => void) {
    return (valor: T) => {
      setter(valor);
      setPage(0);
    };
  }
  const handleTextoChange = conResetDePagina(setTexto);
  const handleGrupoChange = conResetDePagina(setNomGrupo);
  const handleCarreraChange = conResetDePagina(setNomCarrera);
  const handleEstadoChange = conResetDePagina(setEstadoLabel);
  const handleOrdenChange = conResetDePagina(setOrden);

  function aplicarFiltros(f: FiltrosEstudiantes) {
    setTexto(f.texto);
    setTextoDebounced(f.texto);
    setNomGrupo(f.grupo);
    setNomCarrera(f.carrera);
    setEstadoLabel(f.estado);
    setOrden(f.orden);
    setPage(f.pagina);
  }

  useEffect(() => {
    const id = setTimeout(() => setTextoDebounced(texto), 300);
    return () => clearTimeout(id);
  }, [texto]);

  // Si la URL no trae filtros, se restauran los últimos usados en la sesión. Corre una sola vez, al montar.
  useEffect(() => {
    if (restauracionHecha.current) return;
    restauracionHecha.current = true;
    const guardados = hayFiltrosActivos(filtrosIniciales) ? null : leerFiltrosGuardados();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de un sistema externo (sessionStorage), no se puede derivar en el render sin romper la hidratación
    if (guardados) aplicarFiltros(leerFiltros(new URLSearchParams(guardados)));
    setListo(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, []);

  const filtrosActuales: FiltrosEstudiantes = {
    texto: textoDebounced,
    grupo: nomGrupo,
    carrera: nomCarrera,
    estado: estadoLabel,
    orden,
    pagina: page,
  };
  const queryActual = aQuery(filtrosActuales);

  // URL y sesión siguen a los filtros aplicados. replaceState (no router.replace): solo actualiza la URL, sin
  // pedirle nada al servidor ni sumar una entrada al historial por cada tecla.
  useEffect(() => {
    if (!listo) return;
    const url = queryActual ? `/estudiantes?${queryActual}` : "/estudiantes";
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", url);
    }
    guardarFiltros(queryActual);
  }, [listo, queryActual]);

  const [grupos, setGrupos] = useState<Group[]>([]);
  const [estudiantes, setEstudiantes] = useState<StudentSummary[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [accionEnCursoId, setAccionEnCursoId] = useState<number | null>(null);
  const [idADesactivar, setIdADesactivar] = useState<number | null>(null);
  // RF06 — procesos abiertos del estudiante a desactivar ("2 instancias agendadas y ..."), o null si no tiene.
  const [procesosABaja, setProcesosABaja] = useState<string | null>(null);

  useEffect(() => {
    listGroups()
      .then(setGrupos)
      .catch(() => setGrupos([]));
  }, []);

  // Las carreras no tienen catálogo propio en esta pantalla: se derivan de
  // los grupos ya cargados (cada Grupo trae idCarrera/nomCarrera).
  const carreras = useMemo(() => {
    const vistas = new Map<string, number>();
    for (const g of grupos) vistas.set(g.nomCarrera, g.idCarrera);
    return [...vistas.entries()].map(([nomCarrera, idCarrera]) => ({ nomCarrera, idCarrera }));
  }, [grupos]);

  useEffect(() => {
    if (!listo) return;
    let cancelado = false;

    const idGrupo = grupos.find((g) => g.nomGrupo === nomGrupo)?.idGrupo;
    const idCarrera = carreras.find((c) => c.nomCarrera === nomCarrera)?.idCarrera;

    listStudents({
      texto: puedeBuscar ? textoDebounced || undefined : undefined,
      grupo: puedeBuscar ? idGrupo : undefined,
      carrera: puedeBuscar ? idCarrera : undefined,
      estado: estadoLabel ? ESTADOS[estadoLabel] : undefined,
      sort: ORDENES[orden].sort,
      page,
    })
      .then((res) => {
        if (cancelado) return;
        setEstudiantes(res.content);
        setTotalElements(res.totalElements);
        setHasNext(!res.last);
        setError("");
      })
      .catch((err) => {
        if (cancelado) return;
        setError(apiErrorMessage(err, "No se pudieron cargar los estudiantes."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- grupos/carreras solo se usan para resolver el id, no deben re-disparar el fetch por sí solos
  }, [listo, textoDebounced, nomGrupo, nomCarrera, estadoLabel, orden, page, puedeBuscar]);

  const estudianteADesactivar = estudiantes.find((e) => e.idUsuario === idADesactivar);

  // Antes de abrir la confirmación se consultan los procesos abiertos, para avisarlos en el mismo diálogo. Si la
  // consulta falla, el diálogo se abre igual: el backend vuelve a verificar y responde 409 si hacía falta avisar.
  async function iniciarBaja(id: number) {
    setAccionEnCursoId(id);
    setError("");
    try {
      setProcesosABaja(describirProcesosAbiertos(await getProcesosAbiertos(id)));
    } catch {
      setProcesosABaja(null);
    } finally {
      setAccionEnCursoId(null);
    }
    setIdADesactivar(id);
  }

  async function confirmarDesactivar() {
    if (idADesactivar == null) return;
    const id = idADesactivar;
    const confirmar = procesosABaja !== null;
    setIdADesactivar(null);
    setAccionEnCursoId(id);
    setExito("");
    try {
      // confirmar=true solo si se le mostraron los procesos abiertos: si aparecieron otros entre la consulta y
      // la confirmación, el backend responde 409 y su mensaje se muestra como error.
      await deactivateStudent(id, confirmar);
      setEstudiantes((prev) => prev.map((e) => (e.idUsuario === id ? { ...e, estado: "INACTIVO" } : e)));
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo desactivar el estudiante."));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  async function handleReactivar(id: number) {
    const estudiante = estudiantes.find((e) => e.idUsuario === id);
    setAccionEnCursoId(id);
    setExito("");
    try {
      await reactivateStudent(id);
      setEstudiantes((prev) => prev.map((e) => (e.idUsuario === id ? { ...e, estado: "ACTIVO" } : e)));
      setExito(
        estudiante
          ? `Estudiante activado: ${estudiante.nombre} ${estudiante.apellido}.`
          : "Estudiante activado.",
      );
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo reactivar el estudiante."));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  const filters: ToolbarFilter[] = puedeBuscar
    ? [
        {
          label: "Grupo",
          emptyLabel: "Todos",
          options: grupos.map((g) => g.nomGrupo),
          value: nomGrupo,
          onChange: handleGrupoChange,
        },
        {
          label: "Carrera",
          emptyLabel: "Todas",
          options: carreras.map((c) => c.nomCarrera),
          value: nomCarrera,
          onChange: handleCarreraChange,
        },
        {
          label: "Estado",
          emptyLabel: "Todos",
          options: Object.keys(ESTADOS),
          value: estadoLabel,
          onChange: handleEstadoChange,
        },
      ]
    : [];

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[980px] mx-auto w-full px-4 py-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h1 className="text-xl font-bold mb-0">Estudiantes</h1>
          {puedeCrear ? (
            <button
              type="button"
              className="btn btn-primary btn-sm gap-1"
              onClick={() => router.push("/estudiantes/nuevo")}
            >
              <Plus size={14} aria-hidden />
              Nuevo estudiante
            </button>
          ) : null}
        </div>

        {puedeBuscar ? (
          <Toolbar
            placeholder="Buscar por nombre, apellido o documento"
            searchValue={texto}
            onSearchChange={handleTextoChange}
            filters={filters}
          />
        ) : null}

        {/* Orden: para todos (no es un filtro, no exige BUSCAR_ESTUDIANTE). "Limpiar filtros" solo si hay algo distinto del listado por defecto. */}
        <div className="flex items-end justify-between gap-2 mb-3 flex-wrap">
          {hayFiltrosActivos({ ...filtrosActuales, texto }) ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm gap-1"
              onClick={() => aplicarFiltros(FILTROS_POR_DEFECTO)}
            >
              <FilterX size={14} aria-hidden />
              Limpiar filtros
            </button>
          ) : (
            <span />
          )}
          <label className="floating-label w-48">
            <select
              className="select select-sm w-full border-neutral-800/30"
              value={orden}
              onChange={(e) => handleOrdenChange(e.target.value as OrdenEstudiantes)}
            >
              {(Object.keys(ORDENES) as OrdenEstudiantes[]).map((clave) => (
                <option key={clave} value={clave}>
                  {ORDENES[clave].label}
                </option>
              ))}
            </select>
            <span>Ordenar por</span>
          </label>
        </div>

        {exito ? (
          <div role="status" className="alert alert-success alert-soft text-sm mb-3">
            <span>{exito}</span>
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
            <span>{error}</span>
          </div>
        ) : null}

        {cargando ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : estudiantes.length === 0 ? (
          <p className="text-base-content/60 py-6 text-center">No se encontraron estudiantes.</p>
        ) : (
          <>
            <DataTable headers={["Nombre", "Documento", "Grupo", "Estado", ""]}>
              {estudiantes.map((e) => (
                <tr
                  key={e.idUsuario}
                  className="cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                  tabIndex={0}
                  onClick={() => router.push(`/estudiantes/${e.idUsuario}`)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") router.push(`/estudiantes/${e.idUsuario}`);
                  }}
                >
                  <td className="font-semibold">
                    <div className="flex items-center gap-2">
                      <StudentAvatar
                        nombre={e.nombre}
                        apellido={e.apellido}
                        urlFoto={e.urlFoto}
                      />
                      {e.nombre} {e.apellido}
                    </div>
                  </td>
                  <td>{e.documento}</td>
                  <td>{e.grupos.join(", ") || "—"}</td>
                  <td>
                    <EstadoBadge estado={e.estado} />
                  </td>
                  {/* stopPropagation: sin esto, cualquier click acá también dispara la
                      navegación de la fila hacia la ficha. */}
                  {/* Alineado a la izquierda a propósito: filas con distinta cantidad de
                      acciones (ej. un Pendiente no tiene Desactivar) igual mantienen
                      "Ver ficha"/"Editar" en la misma columna en vez de correrse. */}
                  <td className="whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                    <div className="inline-flex gap-1">
                      <Link href={`/estudiantes/${e.idUsuario}`} className="btn btn-ghost btn-xs gap-1">
                        <Eye size={13} aria-hidden />
                        Ver ficha
                      </Link>
                      {puedeEditar ? (
                        <Link href={`/estudiantes/${e.idUsuario}/editar`} className="btn btn-ghost btn-xs gap-1">
                          <Pencil size={13} aria-hidden />
                          Editar
                        </Link>
                      ) : null}
                      {e.estado === "ACTIVO" && puedeDesactivar ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs gap-1 text-error"
                          disabled={accionEnCursoId === e.idUsuario}
                          onClick={() => iniciarBaja(e.idUsuario)}
                        >
                          <UserX size={13} aria-hidden />
                          Desactivar
                        </button>
                      ) : null}
                      {e.estado === "INACTIVO" && puedeReactivar ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs gap-1"
                          disabled={accionEnCursoId === e.idUsuario}
                          onClick={() => handleReactivar(e.idUsuario)}
                        >
                          <UserCheck size={13} aria-hidden />
                          Activar
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>

            <PaginationFooter
              shown={estudiantes.length}
              total={totalElements}
              noun="estudiantes"
              page={page}
              pageSize={20}
              hasPrevious={page > 0}
              hasNext={hasNext}
              onPrevious={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={idADesactivar != null}
        title="Desactivar estudiante"
        message={
          estudianteADesactivar
            ? `¿Desactivar a ${estudianteADesactivar.nombre} ${estudianteADesactivar.apellido}? Va a dejar de aparecer en las búsquedas activas, pero su historial se conserva.`
            : ""
        }
        aviso={
          procesosABaja
            ? `Tiene ${procesosABaja}. No se cancelan con la baja: quedan en su historial. Revisalos si hace falta antes de continuar.`
            : null
        }
        confirmLabel="Desactivar"
        destructive
        onConfirm={confirmarDesactivar}
        onCancel={() => setIdADesactivar(null)}
      />
    </div>
  );
}
