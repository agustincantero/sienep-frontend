import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import type { AuthenticatedUser } from "@/lib/user";
import AuthLayout from "../(auth)/layout";

// SetPasswordForm cuando lo muestra el gate de (app)/layout.tsx en vez del AppShell. Reusa AuthLayout para verse igual que cuando el formulario aparece inline en LoginForm, ya que acá se renderiza fuera del route group (auth).
export function SetPasswordScreen({ user }: { user: AuthenticatedUser }) {
  return (
    <AuthLayout>
      <SetPasswordForm user={user} />
    </AuthLayout>
  );
}
