"use client";

import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Idéntico a components/students/ConfirmDialog.tsx (mismo componente 100%
// genérico) — se crea acá una sola vez y components/incidencias/ lo importa
// desde este archivo en vez de duplicarlo de nuevo: Instancias e Incidencias
// nacen en la misma rama/feature, así que no aplica el criterio de "cada
// feature-top-level duplica lo suyo" que sí separa a esto de Estudiantes.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal" onClose={onCancel}>
      <div className="modal-box">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="py-3 text-sm text-base-content/70">{message}</p>
        <div className="modal-action">
          <button type="button" className="btn" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn ${destructive ? "btn-error" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>Cerrar</button>
      </form>
    </dialog>
  );
}
