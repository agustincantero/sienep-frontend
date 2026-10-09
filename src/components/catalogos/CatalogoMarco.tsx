"use client";

import { OPCIONES_ESTADO, type FiltroEstado } from "@/lib/catalogos";
import { DataTable, type DataTableHeader } from "@/components/ui/DataTable";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";
import { ConfirmDialog } from "@/components/instancias/ConfirmDialog";

type CatalogoMarcoProps = {
  buscadorPlaceholder: string;
  texto: string;
  onTextoChange: (value: string) => void;
  filtroEstado: FiltroEstado;
  onFiltroEstadoChange: (value: FiltroEstado) => void;
  // Filtros propios de la pestaña (ej. Carrera en Grupos), antes del de Estado.
  filtrosExtra?: ToolbarFilter[];
  cargando: boolean;
  // Falló el GET del listado: queda fijo, no se borra solo.
  errorCarga: string;
  // Resultado de una acción (baja, reactivación, alta/edición al volver): se borra a los 3 s (useCatalogo).
  error: string;
  exito: string;
  vacio: string;
  cantidad: number;
  headers: DataTableHeader[];
  confirmacion: {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  };
  children: React.ReactNode;
};

// Esqueleto común de cada pestaña de Catálogos: buscador y filtros, avisos, tabla y confirmación de baja. Cada pestaña solo aporta sus columnas. El alta y la edición son páginas aparte (/catalogos/[catalogo]/nuevo y /[id]/editar).
export function CatalogoMarco({
  buscadorPlaceholder,
  texto,
  onTextoChange,
  filtroEstado,
  onFiltroEstadoChange,
  filtrosExtra = [],
  cargando,
  errorCarga,
  error,
  exito,
  vacio,
  cantidad,
  headers,
  confirmacion,
  children,
}: CatalogoMarcoProps) {
  const filtros: ToolbarFilter[] = [
    ...filtrosExtra,
    {
      label: "Estado",
      emptyLabel: "Todos",
      options: OPCIONES_ESTADO,
      value: filtroEstado === "Todos" ? "" : filtroEstado,
      onChange: (v) => onFiltroEstadoChange((v || "Todos") as FiltroEstado),
    },
  ];

  return (
    <>
      <Toolbar placeholder={buscadorPlaceholder} searchValue={texto} onSearchChange={onTextoChange} filters={filtros} />

      {exito ? (
        <div role="status" className="alert alert-success alert-soft text-sm mb-3">
          <span className="min-w-0 wrap-anywhere">{exito}</span>
        </div>
      ) : null}

      {errorCarga || error ? (
        <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
          <span className="min-w-0 wrap-anywhere">{errorCarga || error}</span>
        </div>
      ) : null}

      {cargando ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-md" role="status" aria-label="Cargando" />
        </div>
      ) : errorCarga ? null : cantidad === 0 ? (
        <p className="text-base-content/60 py-6 text-center">{vacio}</p>
      ) : (
        <DataTable headers={headers}>{children}</DataTable>
      )}

      <ConfirmDialog
        open={confirmacion.open}
        title={confirmacion.title}
        message={confirmacion.message}
        confirmLabel="Desactivar"
        destructive
        onConfirm={confirmacion.onConfirm}
        onCancel={confirmacion.onCancel}
      />
    </>
  );
}
