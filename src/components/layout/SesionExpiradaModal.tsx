"use client";

import { useEffect, useId, useRef } from "react";
import { SESION_EXPIRADA } from "@/lib/api";

// Se abre cuando un pedido al proxy devuelve 401 con la página ya cargada (ver src/lib/api.ts). No se puede cerrar: la sesión está muerta y cualquier acción fallaría.
export function SesionExpiradaModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const descripcionId = useId();

  useEffect(() => {
    function abrir(e: Event) {
      e.preventDefault();
      if (!dialogRef.current?.open) dialogRef.current?.showModal();
    }
    window.addEventListener(SESION_EXPIRADA, abrir);
    return () => window.removeEventListener(SESION_EXPIRADA, abrir);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={tituloId}
      aria-describedby={descripcionId}
      className="modal"
      onCancel={(e) => e.preventDefault()}
      onClose={(e) => e.currentTarget.showModal()}
    >
      <div className="modal-box">
        <h2 id={tituloId} className="text-lg font-bold">
          Tu sesión expiró
        </h2>
        <p id={descripcionId} className="py-4 text-base-content/70">
          Por seguridad, cerramos tu sesión. Volvé a iniciar sesión para continuar.
        </p>
        <div className="modal-action">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              // Recarga completa a propósito: descarta el estado en memoria, mismo criterio que en src/lib/api.ts.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- ver comentario de arriba
              window.location.href = "/login";
            }}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </dialog>
  );
}
