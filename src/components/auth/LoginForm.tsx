"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { login } from "@/lib/auth";
import { AuthCard } from "./AuthCard";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { PasswordInput } from "./PasswordInput";

// Pantalla de login. Conectada a POST /api/auth/login y (vía GoogleLoginButton) a POST /api/auth/google. Esos Route Handlers guardan el JWT en una cookie httpOnly; acá no se maneja ningún token. Al entrar, se navega a /inicio (el layout de (app) valida la sesión contra GET /auth/me).
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  function entrar() {
    setCargando(true); // se mantiene deshabilitado durante la navegación
    router.replace("/inicio");
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(email, contrasenia);
      entrar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
      setCargando(false);
    }
  }

  return (
    <AuthCard title="Iniciar sesión">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="floating-label">
          <span>Correo electrónico</span>
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
        <GoogleLoginButton onSuccess={entrar} onError={setError} />
      </form>
    </AuthCard>
  );
}
