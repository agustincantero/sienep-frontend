"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Plus, UserCheck, UserX } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { formatFechaHora } from "@/lib/format";
import {
  deactivateIncidencia,
  listIncidencias,
  reactivateIncidencia,
  type Incidencia,
} from "@/lib/incidencias";
import { listStudents, type Page, type StudentSummary } from "@/lib/students";
import { useSession } from "@/lib/session-context";
import { DataTable } from "@/components/ui/DataTable";
import { EstadoBadge } from "@/components/instancias/EstadoBadge";
import { ConfirmDialog } from "@/components/instancias/ConfirmDialog";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";

const ESTADO_A_VALOR: Record<string, string> = { Activo: "ACTIVO", Inactivo: "INACTIVO" };

// Mismo patrón que InstanciasListView — sin filtro de Categoría (las
// incidencias no tienen) ni de Responsable (mismo motivo que en instancias:
// no hay lib/funcionarios.ts todavía, ver decisiones.md).
export function IncidenciasListView() {
  const router = useRouter();
  const { permisos } = useSession();
  const puedeCrear = permisos.includes("CREAR_INCIDENCIA");
  const puedeEditar = permisos.includes("EDITAR_INCIDENCIA");
  const puedeDesactivar = permisos.includes("DESACTIVAR_INCIDENCIA");
  const puedeReactivar = permisos.includes("REACTIVAR_INCIDENCIA");

  const [nomEstudiante, setNomEstudiante] = useState("");
  const [estadoLabel, setEstadoLabel] = useState("");
  const [page, setPage] = useState(0);

  function conResetDePagina<T>(setter: (valor: T) => void) {
    return (valor: T) => {
      setter(valor);
      setPage(0);
    };
  }
  const handleEstudianteChange = conResetDePagina(setNomEstudiante);
  const handleEstadoChange = conResetDePagina(setEstadoLabel);

  const [estudiantes, setEstudiantes] = useState<StudentSummary[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [accionEnCursoId, setAccionEnCursoId] = useState<number | null>(null);
  const [idADesactivar, setIdADesactivar] = useState<number | null>(null);

  useEffect(() => {
    listStudents({ size: 1000 })
      .then((res) => setEstudiantes(res.content))
      .catch(() => setEstudiantes([]));
  }, []);

  useEffect(() => {
    let cancelado = false;
    const idEstudiante = estudiantes.find(
      (e) => `${e.nombre} ${e.apellido}` === nomEstudiante,
    )?.idUsuario;
    const estadoParam = estadoLabel ? ESTADO_A_VALOR[estadoLabel] : undefined;

    // Sin ?estado=, el backend devuelve solo las ACTIVAS (no "todas" — no hay
    // un valor de estado que signifique eso). Para que el filtro "Estado:
    // Todos" muestre activas E inactivas, se piden las dos por separado y se
    // combinan acá. La paginación queda aproximada en ese caso (cada mitad
    // pagina de forma independiente), aceptable a esta escala.
    const peticion = estadoParam
      ? listIncidencias({ idEstudiante, estado: estadoParam, page })
      : Promise.all([
          listIncidencias({ idEstudiante, estado: "ACTIVO", page }),
          listIncidencias({ idEstudiante, estado: "INACTIVO", page }),
        ]).then(
          ([activas, inactivas]): Page<Incidencia> => ({
            content: [...activas.content, ...inactivas.content],
            totalElements: activas.totalElements + inactivas.totalElements,
            totalPages: Math.max(activas.totalPages, inactivas.totalPages),
            number: page,
            size: activas.size,
            first: activas.first && inactivas.first,
            last: activas.last && inactivas.last,
          }),
        );

    peticion
      .then((res) => {
        if (cancelado) return;
        setIncidencias(res.content);
        setTotalElements(res.totalElements);
        setHasNext(!res.last);
        setError("");
      })
      .catch((err) => {
        if (cancelado) return;
        setError(apiErrorMessage(err, "No se pudieron cargar las incidencias."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- estudiantes solo se usa para resolver el id
  }, [nomEstudiante, estadoLabel, page]);

  const incidenciaADesactivar = incidencias.find((i) => i.codInstancia === idADesactivar);

  async function confirmarDesactivar() {
    if (idADesactivar == null) return;
    const id = idADesactivar;
    setIdADesactivar(null);
    setAccionEnCursoId(id);
    try {
      await deactivateIncidencia(id);
      setIncidencias((prev) =>
        prev.map((i) => (i.codInstancia === id ? { ...i, estado: "INACTIVO" } : i)),
      );
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo desactivar la incidencia."));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  async function handleReactivar(id: number) {
    setAccionEnCursoId(id);
    try {
      await reactivateIncidencia(id);
      setIncidencias((prev) =>
        prev.map((i) => (i.codInstancia === id ? { ...i, estado: "ACTIVO" } : i)),
      );
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo reactivar la incidencia."));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  const filters: ToolbarFilter[] = useMemo(
    () => [
      {
        label: "Estado (todos)",
        emptyLabel: "Todos",
        options: ["Activo", "Inactivo"],
        value: estadoLabel,
        onChange: handleEstadoChange,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- los handlers son estables (conResetDePagina)
    [estudiantes, nomEstudiante, estadoLabel],
  );

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[1040px] mx-auto w-full px-4 py-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h1 className="text-xl font-bold mb-0">Incidencias</h1>
          {puedeCrear ? (
            <button
              type="button"
              className="btn btn-primary btn-sm gap-1"
              onClick={() => router.push("/incidencias/nuevo")}
            >
              <Plus size={14} aria-hidden />
              Nueva incidencia
            </button>
          ) : null}
        </div>

        <Toolbar
          placeholder="Buscar por estudiante"
          searchValue={nomEstudiante}
          onSearchChange={handleEstudianteChange}
          searchOptions={estudiantes.map((e) => `${e.nombre} ${e.apellido}`)}
          filters={filters}
        />

        {error ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
            <span>{error}</span>
          </div>
        ) : null}

        {cargando ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : incidencias.length === 0 ? (
          <p className="text-base-content/60 py-6 text-center">No se encontraron incidencias.</p>
        ) : (
          <>
            <DataTable
              headers={[
                { label: "Identificador", align: "center" },
                "Estudiante",
                "Fecha",
                "Título",
                "Responsable",
                "Estado",
                "",
              ]}
            >
              {incidencias.map((i) => (
                <tr
                  key={i.codInstancia}
                  className="cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                  tabIndex={0}
                  onClick={() => router.push(`/incidencias/${i.codInstancia}`)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") router.push(`/incidencias/${i.codInstancia}`);
                  }}
                >
                  <td className="font-mono text-sm text-center whitespace-nowrap">{i.idNegInstancia}</td>
                  <td className="font-semibold whitespace-nowrap">{i.nombreEstudiante}</td>
                  <td className="font-mono text-sm whitespace-nowrap">{formatFechaHora(i.fechaHora)}</td>
                  {/* max-w + truncate: un titulo largo (sin espacios para cortar bien)
                      hacia crecer la fila entera envolviendo letra por letra. El
                      texto completo sigue disponible al pasar el mouse (title=). */}
                  <td className="max-w-[180px] truncate" title={i.titulo}>
                    {i.titulo}
                  </td>
                  <td className="whitespace-nowrap">{i.nombreFuncionario}</td>
                  <td>
                    <EstadoBadge estado={i.estado} />
                  </td>
                  <td className="whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                    <div className="inline-flex gap-1">
                      <Link href={`/incidencias/${i.codInstancia}`} className="btn btn-ghost btn-xs gap-1">
                        <Eye size={13} aria-hidden />
                        Ver detalle
                      </Link>
                      {puedeEditar ? (
                        <Link
                          href={`/incidencias/${i.codInstancia}/editar`}
                          className="btn btn-ghost btn-xs gap-1"
                        >
                          <Pencil size={13} aria-hidden />
                          Editar
                        </Link>
                      ) : null}
                      {i.estado === "ACTIVO" && puedeDesactivar ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs gap-1 text-error"
                          disabled={accionEnCursoId === i.codInstancia}
                          onClick={() => setIdADesactivar(i.codInstancia)}
                        >
                          <UserX size={13} aria-hidden />
                          Desactivar
                        </button>
                      ) : null}
                      {i.estado === "INACTIVO" && puedeReactivar ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs gap-1"
                          disabled={accionEnCursoId === i.codInstancia}
                          onClick={() => handleReactivar(i.codInstancia)}
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
              shown={incidencias.length}
              total={totalElements}
              noun="incidencias"
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
        title="Desactivar incidencia"
        message={
          incidenciaADesactivar
            ? `¿Desactivar "${incidenciaADesactivar.titulo}" de ${incidenciaADesactivar.nombreEstudiante}? Va a dejar de aparecer en las búsquedas activas, pero se conserva.`
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
