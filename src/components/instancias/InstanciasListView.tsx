"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { listCategoriasInstancia, type CategoriaInstancia } from "@/lib/categorias-instancia";
import {
  deactivateInstancia,
  listInstancias,
  reactivateInstancia,
  type InstanciaComun,
} from "@/lib/instancias";
import { listStudents, type Page, type StudentSummary } from "@/lib/students";
import { useSession } from "@/lib/session-context";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { InstanciasTabla } from "./InstanciasTabla";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";
import { ConfirmDialog } from "./ConfirmDialog";

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

  // Tope alto en vez de paginar el propio combo: alcanza para poblar el filtro y el combo de "Nueva instancia" con todos los estudiantes activos de una.
  const [estudiantes, setEstudiantes] = useState<StudentSummary[]>([]);
  // listCategoriasInstancia requiere VER_CATEGORIAS_INSTANCIA, que en el seed actual solo tiene ADMINISTRADOR: Psicopedagogo/Tutor van a ver este filtro vacío hasta que se corrija del lado del backend, acá solo hace falta no romper la pantalla si la llamada 403.
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
    const estadoParam = estadoLabel ? ESTADO_A_VALOR[estadoLabel] : undefined;

    // Sin ?estado=, el backend devuelve solo las ACTIVAS; para que "Estado: Todos" muestre activas e inactivas se piden las dos por separado y se combinan acá (la paginación queda aproximada en ese caso).
    const peticion = estadoParam
      ? listInstancias({ idEstudiante, idCategoria, estado: estadoParam, page })
      : Promise.all([
          listInstancias({ idEstudiante, idCategoria, estado: "ACTIVO", page }),
          listInstancias({ idEstudiante, idCategoria, estado: "INACTIVO", page }),
        ]).then(
          ([activas, inactivas]): Page<InstanciaComun> => ({
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

  // Sin filtro de "Responsable" (funcionario): requeriría un lib/funcionarios.ts propio que todavía no existe. La columna "Responsable" de la tabla sí se muestra, ese dato ya viene en la propia respuesta de /instancias.
  const filters: ToolbarFilter[] = useMemo(
    () => [
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
      <div className="max-w-[1200px] mx-auto w-full px-4 py-5">
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
        ) : instancias.length === 0 ? (
          <p className="text-base-content/60 py-6 text-center">No se encontraron instancias.</p>
        ) : (
          <>
            <InstanciasTabla
              filas={instancias}
              basePath="/instancias"
              puedeEditar={puedeEditar}
              puedeDesactivar={puedeDesactivar}
              puedeReactivar={puedeReactivar}
              accionEnCursoId={accionEnCursoId}
              onDesactivar={setIdADesactivar}
              onReactivar={handleReactivar}
            />

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
