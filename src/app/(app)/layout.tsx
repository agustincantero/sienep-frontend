import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser, type AuthenticatedUser } from "@/lib/current-user";
import { SessionProvider } from "@/lib/session-context";
import { SessionUnavailable } from "./SessionUnavailable";
import { SetPasswordScreen } from "./SetPasswordScreen";

// El área autenticada depende de la sesión (cookie) en cada request: nunca se
// prerenderiza. Declararlo evita que `next build` intente y loguee el
// "Dynamic server usage" al chocar con `cookies()`.
export const dynamic = "force-dynamic";

// Portón del área autenticada. Resuelve GET /auth/me en el server:
//  - usuario, estado ACTIVO           -> monta el AppShell (TopBar + Sidebar) y deja el usuario en context
//  - usuario, estado PENDIENTE_DE_ACTIVACION -> SetPasswordScreen en vez del AppShell (respaldo del server: LoginForm ya resuelve el caso normal antes de llegar acá; el backend igual lo hace cumplir en cualquier otro endpoint)
//  - null (401)                       -> a /login
//  - error real                       -> aviso "no se pudo verificar" (backend caído / no desplegado)
// Leer la cookie acá vuelve dinámico todo (app)/**.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user: AuthenticatedUser | null = null;
  let errorSesion = false;

  try {
    user = await getCurrentUser();
  } catch (err) {
    // getCurrentUser ya devuelve null en 401/403; acá caen fallos reales.
    console.error("[auth] no se pudo resolver GET /auth/me:", err);
    errorSesion = true;
  }

  if (errorSesion) return <SessionUnavailable />;
  if (!user) redirect("/login");
  if (user.estado === "PENDIENTE_DE_ACTIVACION") return <SetPasswordScreen user={user} />;

  return (
    <SessionProvider user={user}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
