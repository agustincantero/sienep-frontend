import { AuthHeader } from "@/components/layout/AuthHeader";
import { AuthFooter } from "@/components/layout/AuthFooter";
import { LoginBackground } from "@/components/auth/LoginBackground";

// Chrome de las pantallas de autenticación (fuera del AppShell de funcionario):
// header de portal UTEC, fondo con fotos del campus + filtro celeste, card
// centrada y footer con accesos de servicio. Lo comparten /login, /forgot-password,
// /reset-password, /ayuda y /legal.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <LoginBackground />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <AuthHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
          <div className="w-full max-w-md">{children}</div>
        </main>
        <AuthFooter />
      </div>
    </div>
  );
}
