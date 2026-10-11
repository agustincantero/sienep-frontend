"use client";

import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  // Advertencia opcional, destacada debajo del mensaje (ej. procesos abiertos antes de una baja).
  aviso?: string | null;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Reemplaza window.confirm(): permite marcar la acción como destructiva (botón rojo) y mantiene el lenguaje visual de la app, cosa que el confirm nativo del navegador no puede.
export function ConfirmDialog({
  open,
  title,
  message,
  aviso,
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
        <p className="py-3 text-sm text-base-content/70 wrap-anywhere">{message}</p>
        {aviso ? (
          <div role="alert" className="alert alert-warning alert-soft text-sm">
            <span>{aviso}</span>
          </div>
        ) : null}
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
