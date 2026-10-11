"use client";

import { useEffect } from "react";
import "./globals.css";

// Reemplaza al root layout cuando este falla, por eso define su propio <html> y <body> y fija el theme a mano (no hereda nada).
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es" data-theme="light" className="h-full antialiased">
      <body className="min-h-full flex items-center justify-center bg-base-200 p-4">
        <title>Error · SIENEP</title>
        <div className="card bg-base-100 shadow-lg border border-base-300 max-w-md w-full">
          <div className="card-body items-center text-center gap-2">
            <h1 className="text-xl font-bold">Algo salió mal</h1>
            <p className="text-sm text-base-content/70">
              Ocurrió un error inesperado. Probá de nuevo, si el problema sigue, avisale a un administrador.
            </p>
            {error.digest ? <p className="text-xs text-base-content/50">Código del error: {error.digest}</p> : null}
            <button type="button" className="btn btn-primary btn-sm mt-3" onClick={() => retry()}>
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
