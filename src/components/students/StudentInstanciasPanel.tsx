"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { deactivateIncidencia, listIncidencias, reactivateIncidencia } from "@/lib/incidencias";
import { deactivateInstancia, listInstancias, reactivateInstancia } from "@/lib/instancias";
import { claves } from "@/lib/query-keys";
import { useSession } from "@/lib/session-context";
import type { Page } from "@/lib/students";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { InstanciasTabla } from "@/components/instancias/InstanciasTabla";
import { PaginationFooter } from "@/components/ui/PaginationFooter";

type Tipo = "instancias" | "incidencias";

// Lo que cambia entre las dos pestañas; la tabla (InstanciasTabla) es la misma que la de los listados generales.
const CONFIG = {
  instancias: {
    basePath: "/instancias",
    permisoVer: "VER_INSTANCIAS",
    permisoCrear: "CREAR_INSTANCIA",
    permisoEditar: "EDITAR_INSTANCIA",
    permisoDesactivar: "DESACTIVAR_INSTANCIA",
    permisoReactivar: "REACTIVAR_INSTANCIA",
    listar: listInstancias,
    desactivar: deactivateInstancia,
    reactivar: reactivateInstancia,
    singular: "instancia",
    botonCrear: "Nueva instancia",
    titulo: "Instancias",
  },
  incidencias: {
    basePath: "/incidencias",
    permisoVer: "VER_INCIDENCIAS",
    permisoCrear: "CREAR_INCIDENCIA",
    permisoEditar: "EDITAR_INCIDENCIA",
    permisoDesactivar: "DESACTIVAR_INCIDENCIA",
    permisoReactivar: "REACTIVAR_INCIDENCIA",
    listar: listIncidencias,
    desactivar: deactivateIncidencia,
    reactivar: reactivateIncidencia,
    singular: "incidencia",
    botonCrear: "Nueva incidencia",
    titulo: "Incidencias",
  },
} as const;

// Fila común a InstanciaComun e Incidencia (lo que necesitan la tabla y el diálogo de baja).
type Fila = {
  codInstancia: number;
  idNegInstancia: string | null;
  titulo: string;
  nombreEstudiante: string;
  fechaHora: string;
  nombreFuncionario: string;
  estado: string;
};

// Lo que se guarda en la cache: el historial completo ya ordenado y si quedó recortado por MAX_POR_ESTADO.
type Historial = { filas: Fila[]; truncado: boolean };

// Más recientes primero: es lo primero que se busca al revisar el historial de un estudiante.
const ORDEN = "fechaHora,desc";

// El backend no tiene ?estado=TODOS: se piden activas e inactivas por separado, con una página grande cada una (un estudiante tiene pocas), y se juntan acá. Así el orden por fecha es exacto entre las dos, y la paginación se hace en el cliente.
const MAX_POR_ESTADO = 200;
const TAMANIO_PAGINA = 20;

// Pestañas "Instancias" e "Incidencias" de la ficha del estudiante: mismas columnas y acciones que los listados generales (InstanciasTabla), filtradas por el estudiante. Muestra el historial completo, activas e inactivas; las inactivas no se pueden abrir (GET /{id} da 404 para ellas, ver InstanciasTabla). Los links llevan ?desde=estudiante para que "Volver" regrese a esta pestaña.
export function StudentInstanciasPanel({
  idEstudiante,
  tipo,
  estadoEstudiante,
}: {
  idEstudiante: number;
  tipo: Tipo;
  estadoEstudiante: string;
}) {
  const config = CONFIG[tipo];
  const { permisos } = useSession();
  const puedeVer = permisos.includes(config.permisoVer);

  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [errorAccion, setErrorAccion] = useState("");
  const [idADesactivar, setIdADesactivar] = useState<number | null>(null);

  // Historial completo (activas + inactivas), ya ordenado. Si cambia el estudiante cambia la clave, y la respuesta vieja no pisa la nueva.
  const claveHistorial = claves.estudiantes.historial(idEstudiante, tipo);
  const historial = useQuery({
    queryKey: claveHistorial,
    enabled: puedeVer,
    queryFn: async (): Promise<Historial> => {
      const pedir = (estado: string): Promise<Page<Fila>> =>
        config.listar({ idEstudiante, estado, size: MAX_POR_ESTADO, sort: ORDEN });
      const [activas, inactivas] = await Promise.all([pedir("ACTIVO"), pedir("INACTIVO")]);
      return {
        filas: [...activas.content, ...inactivas.content].sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)),
        // true si el estudiante tiene más de MAX_POR_ESTADO en algún estado y no se trajeron todas.
        truncado: !activas.last || !inactivas.last,
      };
    },
  });
  // null mientras carga la primera vez.
  const todas = historial.data?.filas ?? null;
  const truncado = historial.data?.truncado ?? false;
  const cargando = historial.isPending;
  const error = errorAccion || (historial.error ? apiErrorMessage(historial.error, `No se pudieron cargar las ${tipo} del estudiante.`) : "");

  // Baja/alta lógica igual que en los listados generales: se actualiza el estado de la fila en el lugar.
  function cambiarEstado(id: number, estado: string) {
    queryClient.setQueryData<Historial>(claveHistorial, (prev) =>
      prev ? { ...prev, filas: prev.filas.map((f) => (f.codInstancia === id ? { ...f, estado } : f)) } : prev,
    );
  }

  const desactivar = useMutation({
    mutationFn: (id: number) => config.desactivar(id),
    onSuccess: (_, id) => cambiarEstado(id, "INACTIVO"),
    onError: (err) => setErrorAccion(apiErrorMessage(err, `No se pudo desactivar la ${config.singular}.`)),
  });

  const reactivar = useMutation({
    // El resultado no se usa: se descarta para que las dos variantes (instancia/incidencia) tengan el mismo tipo.
    mutationFn: async (id: number) => {
      await config.reactivar(id);
    },
    onSuccess: (_, id) => cambiarEstado(id, "ACTIVO"),
    onError: (err) => setErrorAccion(apiErrorMessage(err, `No se pudo reactivar la ${config.singular}.`)),
  });

  const accionEnCursoId = desactivar.isPending ? desactivar.variables : reactivar.isPending ? reactivar.variables : null;

  function confirmarDesactivar() {
    if (idADesactivar == null) return;
    const id = idADesactivar;
    setIdADesactivar(null);
    setErrorAccion("");
    desactivar.mutate(id);
  }

  function handleReactivar(id: number) {
    setErrorAccion("");
    reactivar.mutate(id);
  }

  if (!puedeVer) {
    return <p className="text-base-content/60 text-sm">No tenés permiso para ver las {tipo} de este estudiante.</p>;
  }

  const total = todas?.length ?? 0;
  const filas = (todas ?? []).slice(page * TAMANIO_PAGINA, (page + 1) * TAMANIO_PAGINA);
  const aDesactivar = filas.find((f) => f.codInstancia === idADesactivar);

  // Mismo estilo que la primera versión de esta pestaña: card de daisyUI con el título y la cantidad arriba (card-body) y la tabla a todo el ancho de la card. Las columnas son las de InstanciasTabla, iguales a los listados generales.
  return (
    <div>
      <section className="card card-border bg-base-100">
        <div className="card-body p-4 pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="card-title text-base">
              {config.titulo}
              {todas ? <span className="badge badge-ghost badge-sm">{total}</span> : null}
            </h2>
            {/* RF18 — crear una instancia (o incidencia) desde la ficha. Solo para un estudiante ACTIVO: el backend (InstanciaComunService.crear / IncidenciaService.crear) rechaza cualquier otro estado. */}
            {estadoEstudiante === "ACTIVO" && permisos.includes(config.permisoCrear) ? (
              <Link href={`${config.basePath}/nuevo?estudiante=${idEstudiante}`} className="btn btn-primary btn-sm gap-1">
                <Plus size={14} aria-hidden />
                {config.botonCrear}
              </Link>
            ) : null}
          </div>
          {error ? (
            <div role="alert" className="alert alert-error alert-soft text-sm">
              <span>{error}</span>
            </div>
          ) : null}
          {cargando ? (
            <div className="flex justify-center py-6">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : filas.length === 0 && !error ? (
            <p className="text-base-content/60 text-sm py-2">Este estudiante no tiene {tipo} registradas.</p>
          ) : null}
          {truncado ? (
            <p className="text-sm text-base-content/60">
              Se muestran las {MAX_POR_ESTADO} más recientes de cada estado. Para ver las anteriores, usá el listado general.
            </p>
          ) : null}
        </div>

        {!cargando && filas.length > 0 ? (
          <>
            <InstanciasTabla
              filas={filas}
              basePath={config.basePath}
              query="?desde=estudiante"
              puedeEditar={permisos.includes(config.permisoEditar)}
              puedeDesactivar={permisos.includes(config.permisoDesactivar)}
              puedeReactivar={permisos.includes(config.permisoReactivar)}
              accionEnCursoId={accionEnCursoId}
              onDesactivar={setIdADesactivar}
              onReactivar={handleReactivar}
            />
            <div className="px-4 pb-3">
              <PaginationFooter
                shown={filas.length}
                total={total}
                noun={tipo}
                page={page}
                pageSize={TAMANIO_PAGINA}
                hasPrevious={page > 0}
                hasNext={(page + 1) * TAMANIO_PAGINA < total}
                onPrevious={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => p + 1)}
              />
            </div>
          </>
        ) : null}
      </section>

      <ConfirmDialog
        open={idADesactivar != null}
        title={`Desactivar ${config.singular}`}
        message={
          aDesactivar
            ? `¿Desactivar "${aDesactivar.titulo}"? Va a dejar de aparecer en las búsquedas activas, pero se conserva.`
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
