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

  const esAuth = variante === "auth";

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
      <div className={esAuth ? "flex flex-col gap-4 w-full mt-3" : "flex flex-col items-center gap-3 mt-3"}>
        <button type="button" className={esAuth ? "btn btn-primary w-full" : "btn btn-primary btn-sm"} onClick={() => retry()}>
          Reintentar
        </button>
        <Link href={esAuth ? "/login" : "/"} className="link link-hover text-sm text-center">
          {esAuth ? "Ir al inicio de sesión" : "Volver al inicio"}
        </Link>
      </div>
    </>
  );

  return <PantallaCard variante={variante}>{contenido}</PantallaCard>;
}
