import type { Metadata } from "next";
import Link from "next/link";
import AuthLayout from "./(auth)/layout";

export const metadata: Metadata = {
  title: "Página no encontrada · SIENEP",
};

// 404 de toda la app: se muestra para cualquier URL que no matchee una ruta, y cuando algún segmento llama notFound(). Renderiza dentro del root layout, así que hereda data-theme, fuentes y daisyUI. Reusa AuthLayout (fondo con fotos del campus + logo + footer) para que sea de verdad el mismo chrome que las pantallas de auth, no una copia que se desactualiza cuando ese chrome cambia.
//
// El botón siempre va a /: si hay sesión, es el dashboard (vive en (app)/page.tsx); si no, el layout de (app) redirige solo a /login.
export default function NotFound() {
  return (
    <AuthLayout>
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body items-center text-center gap-2">
          <h1 className="text-6xl font-light leading-none">404</h1>
          <h2 className="text-2xl font-light">Página no encontrada</h2>
          <p className="text-sm text-base-content/70">
            La dirección que abriste no existe o se movió.
          </p>
          <Link href="/" className="btn btn-primary mt-3">
            Ir al inicio
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
