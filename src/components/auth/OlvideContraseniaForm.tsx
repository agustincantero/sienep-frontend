"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "./AuthCard";

// Paso 1 de la recuperación de contraseña: el usuario pide el enlace por email.
// Presentacional: el submit real es POST /auth/olvide-contrasenia con { email }.
// La respuesta es siempre genérica (no revela si el email existe).
export function OlvideContraseniaForm() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO(datos): POST /auth/olvide-contrasenia con { email }.
    setEnviado(true);
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      description="Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña."
    >
      {enviado ? (
        <div className="space-y-4">
          <div role="alert" className="alert alert-success text-sm">
            Si el correo está registrado, te enviamos un enlace para restablecer la contraseña.
          </div>
          <Link href="/login" className="link link-hover text-sm">
            Volver al inicio de sesión
          </Link>
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
            />
          </label>
          <div className="flex items-center justify-between pt-2">
            <Link href="/login" className="link link-hover text-sm">
              Volver al inicio de sesión
            </Link>
            <button type="submit" className="btn btn-primary">
              Enviar enlace
            </button>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
