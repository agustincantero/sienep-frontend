"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "./AuthCard";

type RestablecerContraseniaFormProps = {
  // Token de un solo uso que llega por email, leído de ?token= en la page.
  token: string;
};

// Paso 2 de la recuperación: el usuario elige la contraseña nueva.
// Presentacional: el submit real es POST /auth/restablecer-contrasenia con
// { token, contraseniaNueva }. El backend exige contraseniaNueva de 8 a 100.
export function RestablecerContraseniaForm({ token }: RestablecerContraseniaFormProps) {
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (nueva.length < 8) {
      setError("La contraseña tiene que tener al menos 8 caracteres.");
      return;
    }
    if (nueva.length > 100) {
      setError("La contraseña no puede superar los 100 caracteres.");
      return;
    }
    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError("");
    // TODO(datos): POST /auth/restablecer-contrasenia con { token, contraseniaNueva: nueva }.
    setListo(true);
  }

  if (!token) {
    return (
      <AuthCard title="Restablecer contraseña">
        <div role="alert" className="alert alert-error text-sm">
          El enlace no es válido o está incompleto. Solicitá uno nuevo desde{" "}
          <Link href="/forgot-password" className="link">
            recuperar contraseña
          </Link>
          .
        </div>
      </AuthCard>
    );
  }

  if (listo) {
    return (
      <AuthCard title="Restablecer contraseña">
        <div className="space-y-4">
          <div role="alert" className="alert alert-success text-sm">
            Tu contraseña fue actualizada.
          </div>
          <Link href="/login" className="btn btn-primary w-full">
            Ir al inicio de sesión
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Restablecer contraseña"
      description="Ingresá tu nueva contraseña. Este enlace vence a los 30 minutos o al usarlo por primera vez."
    >
      {error ? (
        <div role="alert" className="alert alert-error text-sm mb-3">
          {error}
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="floating-label">
          <span>Nueva contraseña</span>
          <input
            type="password"
            required
            minLength={8}
            maxLength={100}
            autoComplete="new-password"
            placeholder="Nueva contraseña"
            className="input w-full"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />
        </label>
        <label className="floating-label">
          <span>Confirmar contraseña</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirmar contraseña"
            className="input w-full"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary w-full mt-2">
          Guardar nueva contraseña
        </button>
      </form>
    </AuthCard>
  );
}
