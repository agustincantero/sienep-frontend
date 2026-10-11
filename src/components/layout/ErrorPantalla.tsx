"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { PantallaCard } from "@/components/layout/PantallaCard";

type ErrorPantallaProps = {
  error: Error & { digest?: string };
  retry: () => void;
  // "seccion" va dentro del chrome autenticado (Sidebar/TopBar siguen visibles); "auth" va dentro del layout de auth
  variante: "seccion" | "auth";
};

// Fallback de los error.tsx: los errores de Server Components llegan con mensaje genérico en producción, por eso solo se muestra el digest (para cruzarlo con los logs del server) y no el mensaje.
export function ErrorPantalla({ error, retry, variante }: ErrorPantallaProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const contenido = (
    <>
      <TriangleAlert size={32} aria-hidden className="text-error" />
      <h1 className="text-xl font-bold">Algo salió mal</h1>
      <p className="text-sm text-base-content/70">
        Ocurrió un error inesperado. Probá de nuevo; si el problema sigue, avisale a un administrador.
      </p>
      {error.digest ? (
        <p className="text-xs text-base-content/50">Código del error: {error.digest}</p>
      ) : null}
      <div className="flex gap-2 mt-3">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => retry()}>
          Reintentar
        </button>
        {variante === "auth" ? (
          <Link href="/login" className="btn btn-ghost btn-sm">
            Ir al inicio de sesión
          </Link>
        ) : null}
      </div>
    </>
  );

  return <PantallaCard variante={variante}>{contenido}</PantallaCard>;
}
