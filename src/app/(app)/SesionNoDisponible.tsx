"use client";

import Link from "next/link";

// Fallback cuando no se puede resolver GET /auth/me por un problema del servidor
// (backend caído, endpoint no desplegado). No es lo mismo que "no hay sesión"
// (eso redirige a /login): acá no sabemos, así que ofrecemos reintentar.
export function SesionNoDisponible() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      <div className="card bg-base-100 border border-base-300 shadow-sm w-full max-w-sm">
        <div className="card-body items-center text-center">
          <h1 className="text-lg font-semibold">No se pudo verificar la sesión</h1>
          <p className="text-sm text-base-content/60">
            Hubo un problema al conectar con el servidor. Probá de nuevo en unos segundos.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
            <Link href="/login" className="btn btn-ghost btn-sm">
              Ir al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
