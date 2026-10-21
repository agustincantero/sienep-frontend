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
import { listStudents, type StudentSummary } from "@/lib/students";
import {
  coincidenciasEstudiante,
  MAX_COINCIDENCIAS,
  paginarVariosEstudiantes,
  TAMANIO_PAGINA,
} from "@/lib/buscar-estudiante";
import { useSession } from "@/lib/session-context";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { InstanciasTabla } from "./InstanciasTabla";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const ESTADO_A_VALOR: Record<string, string> = { Activo: "ACTIVO", Inactivo: "INACTIVO" };
// "Estado: Todos": el backend acepta varios estados separados por coma.
const ESTADOS_TODOS = "ACTIVO,INACTIVO";
// Referencia estable para que el efecto de carga no se dispare cuando llegan los estudiantes y no hay nada tipeado en el buscador.
const SIN_ESTUDIANTES: StudentSummary[] = [];

export function InstanciasListView() {
  const router = useRouter();
  const { permisos } = useSession();
  const puedeCrear = permisos.includes("CREAR_INSTANCIA");
  const puedeEditar = permisos.includes("EDITAR_INSTANCIA");
  const puedeDesactivar = permisos.includes("DESACTIVAR_INSTANCIA");
  const puedeReactivar = permisos.includes("REACTIVAR_INSTANCIA");

  const [nomEstudiante, setNomEstudiante] = useState("");
  // Lo que efectivamente se busca: sigue a `nomEstudiante` con 300 ms de demora para no pedir en cada tecla (igual que el buscador de estudiantes).
  const [textoDebounced, setTextoDebounced] = useState("");
  const [nomCategoria, setNomCategoria] = useState("");
  // El listado abre mostrando las activas; "Todos" e "Inactivo" se eligen desde el filtro.
  const [estadoLabel, setEstadoLabel] = useState("Activo");
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
  const [pageSize, setPageSize] = useState(20);
  const [hasNext, setHasNext] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  // Más estudiantes coinciden con el texto que los que se consultan a la vez: no se muestra nada hasta que se acote la búsqueda.
  const [demasiadasCoincidencias, setDemasiadasCoincidencias] = useState(false);
  const [exito, setExito] = useState("");
  // Se incrementa para volver a pedir la página actual después de desactivar o reactivar.
  const [recarga, setRecarga] = useState(0);
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
    const id = setTimeout(() => setTextoDebounced(nomEstudiante), 300);
    return () => clearTimeout(id);
  }, [nomEstudiante]);

  // Los estudiantes solo re-disparan la carga cuando hay texto en el buscador, que es cuando se usan para resolver ids.
  const estudiantesDeBusqueda = textoDebounced.trim() ? estudiantes : SIN_ESTUDIANTES;

  useEffect(() => {
    let cancelado = false;

    const texto = textoDebounced.trim();
    const coincidencias = texto ? coincidenciasEstudiante(estudiantesDeBusqueda, texto) : null;
    const idCategoria = categorias.find((c) => c.nomCategoria === nomCategoria)?.idCategoria;
    const estadoParam = estadoLabel ? ESTADO_A_VALOR[estadoLabel] : undefined;
    // Sin ?estado=, el backend devuelve solo las ACTIVAS; "Estado: Todos" pide los dos estados en una sola consulta, así la paginación (20 por página, total y rango del pie) la resuelve el backend igual que con un estado puntual.
    const estado = estadoParam ?? ESTADOS_TODOS;

    type Resultado = { content: InstanciaComun[]; total: number; size: number; last: boolean; demasiadas: boolean };
    let pedido: Promise<Resultado>;
    if (coincidencias === null || coincidencias.length === 1) {
      const idEstudiante = coincidencias?.[0].idUsuario;
      pedido = listInstancias({ idEstudiante, idCategoria, estado, page }).then((p) => ({
        content: p.content,
        total: p.totalElements,
        size: p.size,
        last: p.last,
        demasiadas: false,
      }));
    } else if (coincidencias.length === 0 || coincidencias.length > MAX_COINCIDENCIAS) {
      const demasiadas = coincidencias.length > MAX_COINCIDENCIAS;
      pedido = Promise.resolve({ content: [], total: 0, size: TAMANIO_PAGINA, last: true, demasiadas });
    } else {
      // El backend filtra de a un idEstudiante: con varias coincidencias se piden por separado y se juntan acá.
      pedido = paginarVariosEstudiantes(
        coincidencias.map((c) => c.idUsuario),
        (idEstudiante, size) => listInstancias({ idEstudiante, idCategoria, estado, size }),
        page,
      ).then((r) => ({
        content: r.content,
        total: r.total,
        size: TAMANIO_PAGINA,
        last: (page + 1) * TAMANIO_PAGINA >= r.total,
        demasiadas: false,
      }));
    }

    pedido
      .then((r) => {
        if (cancelado) return;
        setInstancias(r.content);
        setTotalElements(r.total);
        setPageSize(r.size);
        setHasNext(!r.last);
        setDemasiadasCoincidencias(r.demasiadas);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- las categorías solo se usan para resolver el id, no deben re-disparar el fetch por sí solas
  }, [textoDebounced, nomCategoria, estadoLabel, page, recarga, estudiantesDeBusqueda]);

  const instanciaADesactivar = instancias.find((i) => i.codInstancia === idADesactivar);

  // Tras desactivar o reactivar: con un estado puntual filtrado, la fila ya no corresponde al listado, así que
  // se vuelve a pedir la página (o la anterior, si era la última fila de esta) y la fila sale. En "Todos" la
  // fila sigue correspondiendo: se le actualiza el estado en el lugar, sin moverla.
  function reflejarCambioDeEstado(id: number, nuevoEstado: string) {
    if (!estadoLabel) {
      setInstancias((prev) => prev.map((i) => (i.codInstancia === id ? { ...i, estado: nuevoEstado } : i)));
    } else if (instancias.length === 1 && page > 0) {
      setPage(page - 1);
    } else {
      setRecarga((n) => n + 1);
    }
  }

  function describir(id: number) {
    const instancia = instancias.find((i) => i.codInstancia === id);
    return instancia ? `: ${instancia.nombreEstudiante} (${instancia.nombreCategoria})` : "";
  }

  async function confirmarDesactivar() {
    if (idADesactivar == null) return;
    const id = idADesactivar;
    const descripcion = describir(id);
    setIdADesactivar(null);
    setAccionEnCursoId(id);
    setExito("");
    setError("");
    try {
      await deactivateInstancia(id);
      reflejarCambioDeEstado(id, "INACTIVO");
      setExito(`Instancia desactivada${descripcion}.`);
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo desactivar la instancia."));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  async function handleReactivar(id: number) {
    const descripcion = describir(id);
    setAccionEnCursoId(id);
    setExito("");
    setError("");
    try {
      await reactivateInstancia(id);
      reflejarCambioDeEstado(id, "ACTIVO");
      setExito(`Instancia activada${descripcion}.`);
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
          placeholder="Buscar por nombre, apellido o documento del estudiante"
          searchValue={nomEstudiante}
          onSearchChange={handleEstudianteChange}
          filters={filters}
        />

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
            <span className="loading loading-spinner loading-md" role="status" aria-label="Cargando" />
          </div>
        ) : demasiadasCoincidencias ? (
          <div role="status" className="alert alert-info alert-soft text-sm">
            <span>Hay demasiadas coincidencias ({MAX_COINCIDENCIAS}+ estudiantes). Escribí más del nombre o apellido para acotar la búsqueda.</span>
          </div>
        ) : instancias.length === 0 ? (
          <p className="text-base-content/70 py-6 text-center">No se encontraron instancias.</p>
        ) : (
          <>
            <InstanciasTabla
              filas={instancias}
              basePath="/instancias"
              puedeEditar={puedeEditar}
              puedeClonar={puedeCrear}
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
              page={page}
              pageSize={pageSize}
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
