"use client";

import { useState } from "react";
import Link from "next/link";
import { apiErrorMessage, ApiError } from "@/lib/api";
import { forgotPassword } from "@/lib/auth";
import { AuthCard } from "./AuthCard";

// Paso 1 de la recuperación de contraseña: el usuario pide el enlace por email.
// POST /api/auth/forgot-password con { email }. La respuesta del backend es siempre genérica (no revela si el email existe), así que ante un 200 mostramos el mismo mensaje sin importar el caso.
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await forgotPassword(email);
      setEnviado(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        // El backend limita a 3 pedidos por email cada 15 minutos.
        setError(
          "Pediste el enlace demasiadas veces. Esperá unos minutos antes de volver a intentar.",
        );
      } else {
        setError(apiErrorMessage(err, "No se pudo enviar el enlace. Probá de nuevo."));
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      description="Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña."
    >
      {enviado ? (
        <div className="space-y-4">
          <div role="status" className="alert alert-success alert-soft text-sm">
            <span>
              Si el correo está registrado, te enviamos un enlace para restablecer la contraseña.
            </span>
          </div>
          <div className="text-center">
            <Link href="/login" className="link link-hover text-sm">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      ) : (
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
            {cargando ? "Enviando…" : "Enviar enlace"}
          </button>
          <div className="text-center">
            <Link href="/login" className="link link-hover text-sm">
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
