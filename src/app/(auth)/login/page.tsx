import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión · SIENEP",
};

export default function LoginPage() {
  return <LoginForm />;
}
