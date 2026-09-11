import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión · SIENEP",
};

export default function LoginPage() {
  return (
    <div className="space-y-5">
      <div className="relative mx-auto max-w-sm space-y-1 text-center text-white [text-shadow:0_2px_18px_rgba(3,22,38,0.7)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(3,22,38,0.45),transparent_72%)] blur-xl"
        />
        <h1 className="text-[1.6rem] font-semibold leading-tight tracking-tight text-balance sm:text-[1.8rem]">
          Acceso al sistema de apoyo a estudiantes
        </h1>
        <p className="text-sm text-white/85">
          Ingresá con tu cuenta institucional de UTEC.
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm [text-shadow:0_2px_14px_rgba(3,22,38,0.65)]">
        <Link
          href="/ayuda"
          className="text-white/90 underline underline-offset-4 hover:text-white"
        >
          ¿Necesitás ayuda para ingresar?
        </Link>
      </p>
    </div>
  );
}
