"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAvisoVisible } from "@/lib/use-aviso-visible";
import { apiErrorMessage } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { coincideTexto, TAMANIO_PAGINA, TOPE_LISTADO } from "@/lib/buscar-estudiante";
import {
  deactivateRecordatorio,
  listRecordatorios,
  reactivateRecordatorio,
  type EstadoOperativo,
  type Recordatorio,
} from "@/lib/recordatorios";
import { useSession } from "@/lib/session-context";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RecordatoriosTabla } from "./RecordatoriosTabla";
import { useIdNegInstancias } from "./useIdNegInstancias";

const ESTADO_A_VALOR: Record<string, string> = { Activo: "ACTIVO", Inactivo: "INACTIVO" };
// "Estado: Todos": /recordatorios acepta un solo estado por consulta, así que se piden los dos y se juntan.
const ESTADOS_TODOS = ["ACTIVO", "INACTIVO"];
// Filtro "Cuándo" del wireframe; "Vencidos y de hoy" junta lo que todavía pide atención.
const CUANDO_A_VALORES: Record<string, EstadoOperativo[]> = {
  "Vencidos y de hoy": ["VENCIDO", "HOY"],
  Vencidos: ["VENCIDO"],
  Hoy: ["HOY"],
  Futuros: ["FUTURO"],
};

// Del más próximo al más lejano; a igual fecha, el último creado primero.
function porFecha(a: Recordatorio, b: Recordatorio) {
  return a.fechaHora.localeCompare(b.fechaHora) || b.codRecordatorio - a.codRecordatorio;
}

export function RecordatoriosListView() {
  const router = useRouter();
  const { permisos } = useSession();
  const puedeCrear = permisos.includes("CREAR_RECORDATORIO");
  const puedeEditar = permisos.includes("EDITAR_RECORDATORIO");
  const puedeDesactivar = permisos.includes("DESACTIVAR_RECORDATORIO");
  const puedeReactivar = permisos.includes("REACTIVAR_RECORDATORIO");

  const [texto, setTexto] = useState("");
  const [nomCategoria, setNomCategoria] = useState("");
  const [cuandoLabel, setCuandoLabel] = useState("");
  // El listado abre mostrando los activos; "Todos" e "Inactivo" se eligen desde el filtro.
  const [estadoLabel, setEstadoLabel] = useState("Activo");
  const [page, setPage] = useState(0);

  function conResetDePagina<T>(setter: (valor: T) => void) {
    return (valor: T) => {
      setter(valor);
      setPage(0);
    };
  }
  const handleTextoChange = conResetDePagina(setTexto);
  const handleCategoriaChange = conResetDePagina(setNomCategoria);
  const handleCuandoChange = conResetDePagina(setCuandoLabel);
  const handleEstadoChange = conResetDePagina(setEstadoLabel);

  // Todos los recordatorios del estado elegido (hasta TOPE_LISTADO por estado): el backend no filtra por texto, categoría ni "cuándo", así que se filtra y pagina acá.
  // Cambiar de estado vuelve a mostrar el spinner, para no mostrar mientras tanto filas del estado anterior.
  const {
    data: recordatorios,
    setData: setRecordatorios,
    cargando,
    errorCarga,
  } = useApi(
    () => {
      const estadoParam = ESTADO_A_VALOR[estadoLabel];
      const estados = estadoParam ? [estadoParam] : ESTADOS_TODOS;
      return Promise.all(estados.map((estado) => listRecordatorios({ estado, size: TOPE_LISTADO, sort: "fechaHora,asc" }))).then((paginas) =>
        paginas.flatMap((p) => p.content).sort(porFecha),
      );
    },
    [estadoLabel],
    { inicial: [] as Recordatorio[], mensajeError: "No se pudieron cargar los recordatorios.", spinnerAlCambiar: true },
  );
  const idNegInstancias = useIdNegInstancias();
  // Error de una baja o reactivación; el de carga es errorCarga.
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const avisoExitoRef = useAvisoVisible<HTMLDivElement>(exito);
  const avisoErrorRef = useAvisoVisible<HTMLDivElement>(errorCarga || error);
  const [accionEnCursoId, setAccionEnCursoId] = useState<number | null>(null);
  const [idADesactivar, setIdADesactivar] = useState<number | null>(null);


  // Las categorías salen de los propios recordatorios: GET /categorias-recordatorios pide VER_CATEGORIAS_RECORDATORIO, que los roles de seguimiento no tienen.
  const categorias = useMemo(
    () => [...new Set(recordatorios.map((r) => r.nombreCategoria))].sort((a, b) => a.localeCompare(b, "es")),
    [recordatorios],
  );

  const filtrados = useMemo(() => {
    const cuando = CUANDO_A_VALORES[cuandoLabel];
    return recordatorios.filter(
      (r) =>
        (!nomCategoria || r.nombreCategoria === nomCategoria) &&
        (!cuando || cuando.includes(r.estadoOperativo)) &&
        coincideTexto(texto, r.titulo, r.idNegRecordatorio, idNegInstancias.get(r.codInstancia), r.tituloInstancia, r.nombreResponsable),
    );
  }, [recordatorios, texto, nomCategoria, cuandoLabel, idNegInstancias]);

  // Si un filtro o una baja deja la página actual vacía, se muestra la última que tiene filas.
  const ultimaPagina = Math.max(0, Math.ceil(filtrados.length / TAMANIO_PAGINA) - 1);
  const paginaActual = Math.min(page, ultimaPagina);
  const visibles = filtrados.slice(paginaActual * TAMANIO_PAGINA, (paginaActual + 1) * TAMANIO_PAGINA);

  const recordatorioADesactivar = recordatorios.find((r) => r.codRecordatorio === idADesactivar);

  // Con un estado puntual filtrado, la fila ya no corresponde al listado y sale; en "Todos" se le actualiza el estado en el lugar.
  function reflejarCambioDeEstado(id: number, nuevoEstado: string) {
    setRecordatorios((prev) =>
      estadoLabel
        ? prev.filter((r) => r.codRecordatorio !== id)
        : prev.map((r) => (r.codRecordatorio === id ? { ...r, estado: nuevoEstado } : r)),
    );
  }

  function describir(id: number) {
    const r = recordatorios.find((x) => x.codRecordatorio === id);
    return r ? `: ${r.titulo}` : "";
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
      await deactivateRecordatorio(id);
      reflejarCambioDeEstado(id, "INACTIVO");
      setExito(`Recordatorio desactivado${descripcion}.`);
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo desactivar el recordatorio."));
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
      await reactivateRecordatorio(id);
      reflejarCambioDeEstado(id, "ACTIVO");
      setExito(`Recordatorio activado${descripcion}.`);
    } catch (err) {
      // 422 si mientras estuvo inactivo se dio de baja su instancia, su categoría o su responsable: el mensaje del backend dice cuál.
      setError(apiErrorMessage(err, "No se pudo reactivar el recordatorio."));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  const filters: ToolbarFilter[] = useMemo(
    () => [
      {
        label: "Categoría",
        emptyLabel: "Todas",
        options: categorias,
        value: nomCategoria,
        onChange: handleCategoriaChange,
      },
      {
        label: "Cuándo",
        emptyLabel: "Todos",
        options: Object.keys(CUANDO_A_VALORES),
        value: cuandoLabel,
        onChange: handleCuandoChange,
      },
      {
        label: "Estado",
        emptyLabel: "Todos",
        options: ["Activo", "Inactivo"],
        value: estadoLabel,
        onChange: handleEstadoChange,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- los handlers son estables (conResetDePagina)
    [categorias, nomCategoria, cuandoLabel, estadoLabel],
  );

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[1200px] mx-auto w-full px-4 py-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h1 className="text-xl font-bold mb-0">Recordatorios</h1>
          {puedeCrear ? (
            <button
              type="button"
              className="btn btn-primary btn-sm gap-1"
              onClick={() => router.push("/recordatorios/nuevo")}
            >
              <Plus size={14} aria-hidden />
              Nuevo recordatorio
            </button>
          ) : null}
        </div>

        <Toolbar
          placeholder="Buscar por título, instancia o responsable"
          searchValue={texto}
          onSearchChange={handleTextoChange}
          filters={filters}
        />

        {exito ? (
          <div ref={avisoExitoRef} role="status" className="alert alert-success alert-soft text-sm mb-3">
            <span>{exito}</span>
          </div>
        ) : null}

        {errorCarga || error ? (
          <div ref={avisoErrorRef} role="alert" className="alert alert-error alert-soft text-sm mb-3">
            <span>{errorCarga || error}</span>
          </div>
        ) : null}

        {cargando ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-md" role="status" aria-label="Cargando" />
          </div>
        ) : filtrados.length === 0 ? (
          <p role="status" className="text-base-content/70 py-6 text-center">No se encontraron recordatorios.</p>
        ) : (
          <>
            <RecordatoriosTabla
              filas={visibles}
              idNegInstancias={idNegInstancias}
              puedeEditar={puedeEditar}
              puedeDesactivar={puedeDesactivar}
              puedeReactivar={puedeReactivar}
              accionEnCursoId={accionEnCursoId}
              onDesactivar={setIdADesactivar}
              onReactivar={handleReactivar}
            />

            <PaginationFooter
              shown={visibles.length}
              total={filtrados.length}
              noun="recordatorios"
              page={paginaActual}
              pageSize={TAMANIO_PAGINA}
              hasPrevious={paginaActual > 0}
              hasNext={paginaActual < ultimaPagina}
              onPrevious={() => setPage(Math.max(0, paginaActual - 1))}
              onNext={() => setPage(paginaActual + 1)}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={idADesactivar != null}
        title="Desactivar recordatorio"
        message={
          recordatorioADesactivar
            ? `¿Desactivar "${recordatorioADesactivar.titulo}"? Se quita de Google Calendar y deja de aparecer entre los activos, pero se conserva.`
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
