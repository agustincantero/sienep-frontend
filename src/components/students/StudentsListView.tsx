"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { coincideTexto, TAMANIO_PAGINA, TOPE_LISTADO } from "@/lib/buscar-estudiante";
import { listGroups, type Group } from "@/lib/groups";
import { claves } from "@/lib/query-keys";
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
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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

// Resultado ya listo para mostrar: la página pedida al backend, o la porción que se arma acá cuando hay texto.
type Listado = { content: StudentSummary[]; totalElements: number; last: boolean };

// Constante (y no un `[]` nuevo en cada render) para que useMemo no recalcule mientras no llegan los grupos.
const SIN_GRUPOS: Group[] = [];

// RF08: búsqueda y filtros combinables, con orden y paginación. Los filtros, el orden y la página viven en la
// URL (filtrosIniciales viene de la page), así sobreviven a recargar, al "atrás" y a compartir el link.
export function StudentsListView({ filtrosIniciales }: { filtrosIniciales: FiltrosEstudiantes }) {
  const router = useRouter();
  const { permisos } = useSession();
  const puedeBuscar = permisos.includes("BUSCAR_ESTUDIANTE");
  // Con VER_ESTUDIANTE_RESUMIDO solo (ej. Tutor) el listado se ve, pero la ficha completa no: sin este chequeo
  // "Ver ficha" y el click en la fila llevaban a una pantalla de "No tienes permisos".
  const puedeVerFicha = permisos.includes("VER_ESTUDIANTE");
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

  // Catálogo de grupos. Si falla se sigue sin él (los filtros de grupo y carrera quedan vacíos), no se bloquea el listado.
  const gruposQuery = useQuery({ queryKey: claves.grupos, queryFn: () => listGroups() });
  const grupos = gruposQuery.data ?? SIN_GRUPOS;
  // false hasta que termina la carga de grupos (con o sin error): los filtros de grupo y carrera viajan por id,
  // y el id recién se puede resolver con el catálogo cargado.
  const gruposCargados = !gruposQuery.isPending;
  const queryClient = useQueryClient();
  const [exito, setExito] = useState("");
  // Error de una ACCIÓN (baja o alta); el de la carga del listado sale de la query.
  const [errorAccion, setErrorAccion] = useState("");
  const [consultandoBajaId, setConsultandoBajaId] = useState<number | null>(null);
  const [idADesactivar, setIdADesactivar] = useState<number | null>(null);
  // RF06 — procesos abiertos del estudiante a desactivar ("2 instancias agendadas y ..."), o null si no tiene.
  const [procesosABaja, setProcesosABaja] = useState<string | null>(null);

  // Las carreras no tienen catálogo propio en esta pantalla: se derivan de
  // los grupos ya cargados (cada Grupo trae idCarrera/nomCarrera).
  const carreras = useMemo(() => {
    const vistas = new Map<string, number>();
    for (const g of grupos) vistas.set(g.nomCarrera, g.idCarrera);
    return [...vistas.entries()].map(([nomCarrera, idCarrera]) => ({ nomCarrera, idCarrera }));
  }, [grupos]);

  const idGrupo = grupos.find((g) => g.nomGrupo === nomGrupo)?.idGrupo;
  const idCarrera = carreras.find((c) => c.nomCarrera === nomCarrera)?.idCarrera;
  // Con un filtro de grupo o carrera ya elegido (URL o sesión) pero el catálogo todavía en camino, la búsqueda
  // espera: si saliera ahora iría sin el id y listaría estudiantes de otros grupos/carreras.
  const esperandoGrupos = puedeBuscar && !gruposCargados && (nomGrupo !== "" || nomCarrera !== "");

  // El backend no ignora tildes ni acepta "Nombre Apellido": con texto se piden todos los que cumplen los demás filtros y se busca y pagina acá.
  const buscado = puedeBuscar ? textoDebounced.trim() : "";
  const filtrosBackend = {
    grupo: puedeBuscar ? idGrupo : undefined,
    carrera: puedeBuscar ? idCarrera : undefined,
    estado: estadoLabel ? ESTADOS[estadoLabel] : undefined,
    sort: ORDENES[orden].sort,
  };
  const claveLista = claves.estudiantes.lista({ ...filtrosBackend, buscado, page });

  // keepPreviousData: al cambiar un filtro o de página se sigue viendo el listado anterior hasta que llega el nuevo, en vez de volver al spinner.
  const listado = useQuery({
    queryKey: claveLista,
    enabled: listo && !esperandoGrupos,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<Listado> => {
      if (!buscado) return listStudents({ ...filtrosBackend, page });
      const res = await listStudents({ ...filtrosBackend, size: TOPE_LISTADO });
      const coinciden = res.content.filter((e) => coincideTexto(buscado, e.nombre, e.apellido, e.documento));
      const desde = page * TAMANIO_PAGINA;
      return {
        content: coinciden.slice(desde, desde + TAMANIO_PAGINA),
        totalElements: coinciden.length,
        last: desde + TAMANIO_PAGINA >= coinciden.length,
      };
    },
  });
  const cargando = listado.isPending;
  const estudiantes = listado.data?.content ?? [];
  const totalElements = listado.data?.totalElements ?? 0;
  const hasNext = listado.data ? !listado.data.last : false;
  const error = errorAccion || (listado.error ? apiErrorMessage(listado.error, "No se pudieron cargar los estudiantes.") : "");

  // La baja y el alta se reflejan en la fila ya mostrada en vez de volver a pedir el listado: así, con el filtro por defecto (solo activos), el estudiante recién desactivado sigue a la vista con su botón "Activar" por si fue un error.
  function marcarEstado(id: number, estado: string) {
    queryClient.setQueryData<Listado>(claveLista, (prev) =>
      prev ? { ...prev, content: prev.content.map((e) => (e.idUsuario === id ? { ...e, estado } : e)) } : prev,
    );
  }

  const desactivar = useMutation({
    // confirmar=true solo si se le mostraron los procesos abiertos: si aparecieron otros entre la consulta y
    // la confirmación, el backend responde 409 y su mensaje se muestra como error.
    mutationFn: ({ id, confirmar }: { id: number; confirmar: boolean }) => deactivateStudent(id, confirmar),
    onSuccess: (_, { id }) => marcarEstado(id, "INACTIVO"),
    onError: (err) => setErrorAccion(apiErrorMessage(err, "No se pudo desactivar el estudiante.")),
  });

  const reactivar = useMutation({
    mutationFn: (id: number) => reactivateStudent(id),
    onSuccess: (_, id) => {
      marcarEstado(id, "ACTIVO");
      const estudiante = estudiantes.find((e) => e.idUsuario === id);
      setExito(
        estudiante ? `Estudiante activado: ${estudiante.nombre} ${estudiante.apellido}.` : "Estudiante activado.",
      );
    },
    onError: (err) => setErrorAccion(apiErrorMessage(err, "No se pudo reactivar el estudiante.")),
  });

  const accionEnCursoId = desactivar.isPending
    ? desactivar.variables.id
    : reactivar.isPending
      ? reactivar.variables
      : consultandoBajaId;

  const estudianteADesactivar = estudiantes.find((e) => e.idUsuario === idADesactivar);

  // Antes de abrir la confirmación se consultan los procesos abiertos, para avisarlos en el mismo diálogo. Si la
  // consulta falla, el diálogo se abre igual: el backend vuelve a verificar y responde 409 si hacía falta avisar.
  async function iniciarBaja(id: number) {
    setConsultandoBajaId(id);
    setErrorAccion("");
    try {
      const procesos = await queryClient.fetchQuery({
        queryKey: claves.estudiantes.procesosAbiertos(id),
        queryFn: () => getProcesosAbiertos(id),
      });
      setProcesosABaja(describirProcesosAbiertos(procesos));
    } catch {
      setProcesosABaja(null);
    } finally {
      setConsultandoBajaId(null);
    }
    setIdADesactivar(id);
  }

  function confirmarDesactivar() {
    if (idADesactivar == null) return;
    const id = idADesactivar;
    setIdADesactivar(null);
    setExito("");
    desactivar.mutate({ id, confirmar: procesosABaja !== null });
  }

  function handleReactivar(id: number) {
    setExito("");
    reactivar.mutate(id);
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
      <div className="max-w-[1200px] mx-auto w-full px-4 py-5">
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

        {/* Orden: para todos (no es un filtro, no exige BUSCAR_ESTUDIANTE), por eso el Toolbar se muestra igual sin buscador ni filtros. Va en la misma fila que los filtros, al final. */}
        <Toolbar
          placeholder="Buscar por nombre, apellido o documento"
          searchValue={texto}
          onSearchChange={puedeBuscar ? handleTextoChange : undefined}
          filters={filters}
          trailing={
            <label className="floating-label">
              <select
                className="select w-full border-neutral-800/30"
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
          }
        />

        {/* "Limpiar filtros" solo si hay algo distinto del listado por defecto. */}
        {hayFiltrosActivos({ ...filtrosActuales, texto }) ? (
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-ghost btn-sm gap-1"
              onClick={() => aplicarFiltros(FILTROS_POR_DEFECTO)}
            >
              <FilterX size={14} aria-hidden />
              Limpiar filtros
            </button>
          </div>
        ) : null}

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
          // Con error, el banner de arriba ya lo explica: "no se encontraron" sería engañoso.
          error ? null : <p className="text-base-content/60 py-6 text-center">No se encontraron estudiantes.</p>
        ) : (
          <>
            <DataTable headers={["Nombre", "Documento", "Grupo", "Estado", ""]}>
              {estudiantes.map((e) => (
                <tr
                  key={e.idUsuario}
                  className={
                    puedeVerFicha
                      ? "cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                      : undefined
                  }
                  tabIndex={puedeVerFicha ? 0 : undefined}
                  onClick={puedeVerFicha ? () => router.push(`/estudiantes/${e.idUsuario}`) : undefined}
                  onKeyDown={
                    puedeVerFicha
                      ? (ev) => {
                          if (ev.key === "Enter") router.push(`/estudiantes/${e.idUsuario}`);
                        }
                      : undefined
                  }
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
                      {puedeVerFicha ? (
                        <Link href={`/estudiantes/${e.idUsuario}`} className="btn btn-ghost btn-xs gap-1">
                          <Eye size={13} aria-hidden />
                          Ver ficha
                        </Link>
                      ) : null}
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
              pageSize={TAMANIO_PAGINA}
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
