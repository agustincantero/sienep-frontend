"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { login, me } from "@/lib/auth";
import type { AuthenticatedUser } from "@/lib/user";
import { AuthCard } from "./AuthCard";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { PasswordInput } from "./PasswordInput";
import { SetPasswordForm } from "./SetPasswordForm";

// Pantalla de login. Conectada a POST /api/auth/login y (vía GoogleLoginButton) a POST /api/auth/google. Esos Route Handlers guardan el JWT en una cookie httpOnly; acá no se maneja ningún token. Al entrar, se navega a /inicio (el layout de (app) valida la sesión contra GET /auth/me) — salvo que GET /auth/me diga que la cuenta quedó PENDIENTE_DE_ACTIVACION (contraseña temporal), en cuyo caso se muestra SetPasswordForm ahí mismo con la contraseña recién tipeada, en vez de navegar y pedírsela de nuevo.
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [porActivar, setPorActivar] = useState<AuthenticatedUser | null>(null);

  function entrar() {
    setCargando(true); // se mantiene deshabilitado durante la navegación
    router.replace("/inicio");
  }

  // Tras un login exitoso (contraseña o Google), fija si hay que activar la cuenta antes de entrar.
  async function despuesDeLoguear() {
    try {
      const user = await me();
      if (user.estado === "PENDIENTE_DE_ACTIVACION") {
        setPorActivar(user);
        setCargando(false);
      } else {
        entrar();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
      setCargando(false);
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(email, contrasenia);
      await despuesDeLoguear();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
      setCargando(false);
    }
  }

  if (porActivar) {
    // Con Google no hay contraseña tipeada (login sin password): SetPasswordForm la pide como fallback.
    return <SetPasswordForm user={porActivar} contraseniaActual={contrasenia || undefined} />;
  }

  return (
    <AuthCard title="Iniciar sesión">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="floating-label">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Correo electrónico"
            className="input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={cargando}
          />
          <span>Correo electrónico</span>
        </label>
        <PasswordInput
          label="Contraseña"
          autoComplete="current-password"
          value={contrasenia}
          onChange={setContrasenia}
          disabled={cargando}
        />
        {error ? (
          <div role="alert" className="alert alert-error alert-soft text-sm">
            <span>{error}</span>
          </div>
        ) : null}
        <button
          type="submit"
          className="btn btn-primary w-full mt-2"
          disabled={cargando}
        >
          {cargando ? <span className="loading loading-spinner loading-sm" /> : null}
          {cargando ? "Ingresando…" : "Iniciar sesión"}
        </button>
        <div className="text-center">
          <Link href="/forgot-password" className="link link-hover text-sm">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="divider text-sm text-base-content/70">o</div>
        <GoogleLoginButton onSuccess={despuesDeLoguear} onError={setError} />
      </form>
    </AuthCard>
  );
}
