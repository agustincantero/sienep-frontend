import { Footer } from "@/components/layout/Footer";
import { Logo } from "@/components/layout/Logo";
import { LoginBackground } from "@/components/auth/LoginBackground";

// Chrome de las pantallas de autenticación (fuera del AppShell de funcionario): sin nav, logo
// grande arriba de la card, fondo con fotos del campus + filtro celeste (LoginBackground,
// decorativo) y footer. El fondo va en su propia capa; el contenido en z-10 encima.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <LoginBackground />
      <div className="relative z-10 flex min-h-dvh flex-col">
        {/* El padding vertical escala de forma continua con la ALTURA del viewport (clamp con dvh), no el ancho: una laptop achicada o con zoom de Windows puede quedar corta de alto con cualquier ancho, y ahí es donde aparecía el scroll. Entre ~320px y ~1120px de alto interpola solo, sin saltos de breakpoint. */}
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-[clamp(1rem,5dvh,3.5rem)]">
          <div className="relative">
            {/* Halo detrás del logo: sin esto se pierde contra fotos claras del fondo (cielo, paredes blancas). Puramente decorativo. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-8 -inset-y-5 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(3,22,38,0.65),transparent_72%)] blur-lg"
            />
            <Logo
              variant="blanco"
              className="h-9 w-auto drop-shadow-[0_2px_10px_rgba(3,22,38,0.65)] sm:h-11"
            />
          </div>
          <div className="w-full max-w-md">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
