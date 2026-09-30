"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Plus, UserCheck, UserX } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { listCategoriasInstancia, type CategoriaInstancia } from "@/lib/categorias-instancia";
import { formatFechaHora } from "@/lib/format";
import {
  deactivateInstancia,
  listInstancias,
  reactivateInstancia,
  type InstanciaComun,
} from "@/lib/instancias";
import { listStudents, type StudentSummary } from "@/lib/students";
import { useSession } from "@/lib/session-context";
import { DataTable } from "@/components/ui/DataTable";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";
import { ConfirmDialog } from "./ConfirmDialog";
import { EstadoBadge } from "./EstadoBadge";

const ESTADO_A_VALOR: Record<string, string> = { Activo: "ACTIVO", Inactivo: "INACTIVO" };

export function InstanciasListView() {
  const router = useRouter();
  const { permisos } = useSession();
  const puedeCrear = permisos.includes("CREAR_INSTANCIA");
  const puedeEditar = permisos.includes("EDITAR_INSTANCIA");
  const puedeDesactivar = permisos.includes("DESACTIVAR_INSTANCIA");
  const puedeReactivar = permisos.includes("REACTIVAR_INSTANCIA");

  const [nomEstudiante, setNomEstudiante] = useState("");
  const [nomCategoria, setNomCategoria] = useState("");
  const [estadoLabel, setEstadoLabel] = useState("");
  const [page, setPage] = useState(0);

  function conResetDePagina<T>(setter: (valor: T) => void) {
    return (valor: T) => {
      setter(valor);
      setPage(0);
    };
  }
  const handleEstudianteChange = conResetDePagina(setNomEstudiante);
  const handleCategoriaChange = conResetDePagina(setNomCategoria);
  const handleEstadoChange = conResetDePagina(setEstadoLabel);

  // Tope alto en vez de paginar el propio combo: a esta escala (una cohorte
  // técnica, no una universidad entera) alcanza para poblar el filtro y el
  // combo de "Nueva instancia" con todos los estudiantes activos de una.
  const [estudiantes, setEstudiantes] = useState<StudentSummary[]>([]);
  // listCategoriasInstancia requiere VER_CATEGORIAS_INSTANCIA, que en el seed
  // actual (proyecto_schema.sql) solo tiene ADMINISTRADOR — Psicopedagogo/
  // Tutor (que sí pueden crear instancias) van a ver este filtro vacío hasta
  // que se corrija del lado del backend. Se documentó en decisiones.md; acá
  // solo hace falta no romper la pantalla si la llamada 403.
  const [categorias, setCategorias] = useState<CategoriaInstancia[]>([]);
  const [instancias, setInstancias] = useState<InstanciaComun[]>([]);
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
    listCategoriasInstancia()
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    let cancelado = false;

    const idEstudiante = estudiantes.find(
      (e) => `${e.nombre} ${e.apellido}` === nomEstudiante,
    )?.idUsuario;
    const idCategoria = categorias.find((c) => c.nomCategoria === nomCategoria)?.idCategoria;

    listInstancias({
      idEstudiante,
      idCategoria,
      estado: estadoLabel ? ESTADO_A_VALOR[estadoLabel] : undefined,
      page,
    })
      .then((res) => {
        if (cancelado) return;
        setInstancias(res.content);
        setTotalElements(res.totalElements);
        setHasNext(!res.last);
        setError("");
      })
      .catch((err) => {
        if (cancelado) return;
        setError(apiErrorMessage(err, "No se pudieron cargar las instancias."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- estudiantes/categorias solo se usan para resolver el id, no deben re-disparar el fetch por sí solos
  }, [nomEstudiante, nomCategoria, estadoLabel, page]);

  const instanciaADesactivar = instancias.find((i) => i.codInstancia === idADesactivar);

  async function confirmarDesactivar() {
    if (idADesactivar == null) return;
    const id = idADesactivar;
    setIdADesactivar(null);
    setAccionEnCursoId(id);
    try {
      await deactivateInstancia(id);
      setInstancias((prev) =>
        prev.map((i) => (i.codInstancia === id ? { ...i, estado: "INACTIVO" } : i)),
      );
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo desactivar la instancia."));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  async function handleReactivar(id: number) {
    setAccionEnCursoId(id);
    try {
      await reactivateInstancia(id);
      setInstancias((prev) =>
        prev.map((i) => (i.codInstancia === id ? { ...i, estado: "ACTIVO" } : i)),
      );
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo reactivar la instancia."));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  // Sin filtro de "Responsable" (funcionario): requeriría un lib/funcionarios.ts
  // propio que todavía no existe (módulo de Funcionarios sin construir) — queda
  // fuera de esta rama, igual criterio que las categorías CRUD y el
  // recordatorio inline (ver decisiones.md). La columna "Responsable" de la
  // tabla sí se muestra: ese dato ya viene en la propia respuesta de /instancias.
  const filters: ToolbarFilter[] = useMemo(
    () => [
      {
        label: "Estudiante",
        emptyLabel: "Todos",
        // "search": no hay filtro de texto libre en el backend (ver más abajo),
        // pero con muchos estudiantes un combo <select> se vuelve inmanejable
        // para buscar uno — se tipea el nombre y se resuelve a idEstudiante
        // igual que antes, solo cambia el control.
        type: "search",
        options: estudiantes.map((e) => `${e.nombre} ${e.apellido}`),
        value: nomEstudiante,
        onChange: handleEstudianteChange,
      },
      {
        label: "Categoría (todas)",
        emptyLabel: "Todas",
        options: categorias.map((c) => c.nomCategoria),
        value: nomCategoria,
        onChange: handleCategoriaChange,
      },
      {
        label: "Estado (todos)",
        emptyLabel: "Todos",
        options: ["Activo", "Inactivo"],
        value: estadoLabel,
        onChange: handleEstadoChange,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- los handlers son estables (conResetDePagina)
    [estudiantes, categorias, nomEstudiante, nomCategoria, estadoLabel],
  );

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[1040px] mx-auto w-full px-4 py-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h1 className="text-xl font-bold mb-0">Instancias</h1>
          {puedeCrear ? (
            <button
              type="button"
              className="btn btn-primary btn-sm gap-1"
              onClick={() => router.push("/instancias/nuevo")}
            >
              <Plus size={14} aria-hidden />
              Nueva instancia
            </button>
          ) : null}
        </div>

        <Toolbar filters={filters} />

        {error ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
            <span>{error}</span>
          </div>
        ) : null}

        {cargando ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : instancias.length === 0 ? (
          <p className="text-base-content/60 py-6 text-center">No se encontraron instancias.</p>
        ) : (
          <>
            <DataTable headers={["Estudiante", "Fecha", "Categoría", "Responsable", "Estado", ""]}>
              {instancias.map((i) => (
                <tr
                  key={i.codInstancia}
                  className="cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                  tabIndex={0}
                  onClick={() => router.push(`/instancias/${i.codInstancia}`)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") router.push(`/instancias/${i.codInstancia}`);
                  }}
                >
                  <td className="font-semibold">{i.nombreEstudiante}</td>
                  <td className="font-mono text-sm">{formatFechaHora(i.fechaHora)}</td>
                  <td>{i.nombreCategoria}</td>
                  <td>{i.nombreFuncionario}</td>
                  <td>
                    <EstadoBadge estado={i.estado} />
                  </td>
                  <td className="whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                    <div className="inline-flex gap-1">
                      <Link href={`/instancias/${i.codInstancia}`} className="btn btn-ghost btn-xs gap-1">
                        <Eye size={13} aria-hidden />
                        Ver detalle
                      </Link>
                      {puedeEditar ? (
                        <Link
                          href={`/instancias/${i.codInstancia}/editar`}
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
              shown={instancias.length}
              total={totalElements}
              noun="instancias"
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
        title="Desactivar instancia"
        message={
          instanciaADesactivar
            ? `¿Desactivar la instancia de ${instanciaADesactivar.nombreEstudiante} (${instanciaADesactivar.nombreCategoria})? Va a dejar de aparecer en las búsquedas activas, pero se conserva.`
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
