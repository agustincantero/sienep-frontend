import { Footer } from "@/components/layout/Footer";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import type { AuthenticatedUser } from "@/lib/user";

// Chrome de SetPasswordForm cuando lo muestra el gate de (app)/layout.tsx en vez del AppShell: mismo fondo primary + Footer que src/app/(auth)/layout.tsx, porque acá se renderiza fuera de ese route group. Cuando SetPasswordForm se usa inline en LoginForm, ese chrome ya lo pone (auth)/layout.tsx y no hace falta duplicarlo.
export function SetPasswordScreen({ user }: { user: AuthenticatedUser }) {
  return (
    <div className="flex min-h-dvh flex-col bg-primary">
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <SetPasswordForm user={user} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
