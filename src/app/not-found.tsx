import Link from "next/link";
import { Footer } from "@/components/layout/Footer";

// 404 de toda la app: se muestra para cualquier URL que no matchee una ruta, y
// cuando algún segmento llama notFound(). Renderiza dentro del root layout, así
// que hereda data-theme, fuentes y daisyUI. Mismo chrome que las pantallas de
// auth (ver src/app/(auth)/layout.tsx).
//
// El botón siempre va a /inicio: si hay sesión, es el dashboard; si no, el
// layout de (app) redirige solo a /login.
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body items-center text-center gap-2">
              <p className="text-6xl font-light text-primary leading-none">404</p>
              <h1 className="text-2xl font-light">Página no encontrada</h1>
              <p className="text-sm text-base-content/60">
                La dirección que abriste no existe o se movió.
              </p>
              <Link href="/inicio" className="btn btn-primary mt-3">
                Ir al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
