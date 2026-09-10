import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser, type AuthenticatedUser } from "@/lib/current-user";
import { SessionProvider } from "@/lib/session-context";
import { SessionUnavailable } from "./SessionUnavailable";

// El área autenticada depende de la sesión (cookie) en cada request: nunca se
// prerenderiza. Declararlo evita que `next build` intente y loguee el
// "Dynamic server usage" al chocar con `cookies()`.
export const dynamic = "force-dynamic";

// Portón del área autenticada. Resuelve GET /auth/me en el server:
//  - usuario     -> monta el AppShell (TopBar + Sidebar) y deja el usuario en context
//  - null (401)  -> a /login
//  - error real  -> aviso "no se pudo verificar" (backend caído / no desplegado)
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

  return (
    <SessionProvider user={user}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
