"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { listGroups, type Group } from "@/lib/groups";
import { useSession } from "@/lib/session-context";
import {
  deactivateStudent,
  describeEstado,
  listStudents,
  reactivateStudent,
  type StudentSummary,
} from "@/lib/students";
import { DataTable } from "@/components/ui/DataTable";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";
import { ConfirmDialog } from "./ConfirmDialog";

const ESTADO_A_VALOR: Record<string, string> = {
  Activo: "ACTIVO",
  Inactivo: "INACTIVO",
  Pendiente: "PENDIENTE_DE_ACTIVACION",
};

// Espera a que el usuario termine de tipear antes de pegarle a la API —
// evita un request por tecla en el buscador.
function useDebounced<T>(valor: T, ms: number): T {
  const [debounced, setDebounced] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return debounced;
}

export function StudentsListView() {
  const router = useRouter();
  const { permisos } = useSession();
  const puedeBuscar = permisos.includes("BUSCAR_ESTUDIANTE");
  const puedeCrear = permisos.includes("CREAR_ESTUDIANTE");
  const puedeEditar = permisos.includes("EDITAR_ESTUDIANTE");
  const puedeDesactivar = permisos.includes("DESACTIVAR_ESTUDIANTE");
  const puedeReactivar = permisos.includes("REACTIVAR_ESTUDIANTE");

  const [texto, setTexto] = useState("");
  const [nomGrupo, setNomGrupo] = useState("");
  const [nomCarrera, setNomCarrera] = useState("");
  const [estadoLabel, setEstadoLabel] = useState("");
  const [page, setPage] = useState(0);

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

  const [grupos, setGrupos] = useState<Group[]>([]);
  const [estudiantes, setEstudiantes] = useState<StudentSummary[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [accionEnCursoId, setAccionEnCursoId] = useState<number | null>(null);
  const [idADesactivar, setIdADesactivar] = useState<number | null>(null);

  const textoDebounced = useDebounced(texto, 300);

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
    let cancelado = false;

    const idGrupo = grupos.find((g) => g.nomGrupo === nomGrupo)?.idGrupo;
    const idCarrera = carreras.find((c) => c.nomCarrera === nomCarrera)?.idCarrera;

    listStudents({
      texto: puedeBuscar ? textoDebounced || undefined : undefined,
      grupo: puedeBuscar ? idGrupo : undefined,
      carrera: puedeBuscar ? idCarrera : undefined,
      estado: estadoLabel ? ESTADO_A_VALOR[estadoLabel] : undefined,
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
  }, [textoDebounced, nomGrupo, nomCarrera, estadoLabel, page, puedeBuscar]);

  const estudianteADesactivar = estudiantes.find((e) => e.idUsuario === idADesactivar);

  async function confirmarDesactivar() {
    if (idADesactivar == null) return;
    const id = idADesactivar;
    setIdADesactivar(null);
    setAccionEnCursoId(id);
    try {
      await deactivateStudent(id);
      setEstudiantes((prev) => prev.map((e) => (e.idUsuario === id ? { ...e, estado: "INACTIVO" } : e)));
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo desactivar el estudiante."));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  async function handleReactivar(id: number) {
    setAccionEnCursoId(id);
    try {
      await reactivateStudent(id);
      setEstudiantes((prev) => prev.map((e) => (e.idUsuario === id ? { ...e, estado: "ACTIVO" } : e)));
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo reactivar el estudiante."));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  const filters: ToolbarFilter[] = puedeBuscar
    ? [
        {
          label: "Grupo (todos)",
          options: grupos.map((g) => g.nomGrupo),
          value: nomGrupo,
          onChange: handleGrupoChange,
        },
        {
          label: "Carrera (todas)",
          options: carreras.map((c) => c.nomCarrera),
          value: nomCarrera,
          onChange: handleCarreraChange,
        },
        {
          label: "Estado (todos)",
          options: ["Activo", "Inactivo", "Pendiente"],
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
            <DataTable headers={["Estudiante", "Documento", "Grupo", "Estado", ""]}>
              {estudiantes.map((e) => (
                <tr
                  key={e.idUsuario}
                  className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                  tabIndex={0}
                  onClick={() => router.push(`/estudiantes/${e.idUsuario}`)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") router.push(`/estudiantes/${e.idUsuario}`);
                  }}
                >
                  <td className="font-semibold">
                    {e.nombre} {e.apellido}
                  </td>
                  <td>{e.documento}</td>
                  <td>{e.grupos.join(", ") || "—"}</td>
                  <td>
                    <span className={`badge badge-sm ${describeEstado(e.estado).badgeClass}`}>
                      {describeEstado(e.estado).label}
                    </span>
                  </td>
                  {/* stopPropagation: sin esto, cualquier click acá también dispara la
                      navegación de la fila hacia la ficha. */}
                  {/* Alineado a la izquierda a propósito: filas con distinta cantidad de
                      acciones (ej. un Pendiente no tiene Desactivar) igual mantienen
                      "Ver ficha"/"Editar" en la misma columna en vez de correrse. */}
                  <td className="whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                    <div className="inline-flex gap-1">
                      <Link href={`/estudiantes/${e.idUsuario}`} className="btn btn-ghost btn-xs">
                        Ver ficha
                      </Link>
                      {puedeEditar ? (
                        <Link href={`/estudiantes/${e.idUsuario}/editar`} className="btn btn-ghost btn-xs">
                          Editar
                        </Link>
                      ) : null}
                      {e.estado === "ACTIVO" && puedeDesactivar ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          disabled={accionEnCursoId === e.idUsuario}
                          onClick={() => setIdADesactivar(e.idUsuario)}
                        >
                          Desactivar
                        </button>
                      ) : null}
                      {e.estado === "INACTIVO" && puedeReactivar ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          disabled={accionEnCursoId === e.idUsuario}
                          onClick={() => handleReactivar(e.idUsuario)}
                        >
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
        confirmLabel="Desactivar"
        destructive
        onConfirm={confirmarDesactivar}
        onCancel={() => setIdADesactivar(null)}
      />
    </div>
  );
}
