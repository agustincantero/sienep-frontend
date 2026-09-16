import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Iniciar sesión · SIENEP",
};

// Dynamic porque getCurrentUser lee la cookie: si ya hay sesión válida, directo a /inicio en vez de mostrar el formulario de nuevo.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/inicio");
  return <LoginForm />;
}
