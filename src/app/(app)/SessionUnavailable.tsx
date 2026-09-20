"use client";

import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";

// Fallback cuando no se puede resolver GET /auth/me por un problema del servidor
// (backend caído, endpoint no desplegado). No es lo mismo que "no hay sesión"
// (eso redirige a /login): acá no sabemos, así que ofrecemos reintentar.
export function SessionUnavailable() {
  return (
    <AuthLayout>
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body items-center text-center gap-2">
          <h1 className="text-2xl font-light">No se pudo verificar la sesión</h1>
          <p className="text-sm text-base-content/70">
            Hubo un problema al conectar con el servidor. Probá de nuevo en unos segundos.
          </p>
          <button
            type="button"
            className="btn btn-primary w-full mt-3"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
          <Link href="/login" className="link link-hover text-sm">
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
