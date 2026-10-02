"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { loginWithAd } from "@/lib/auth";
import { AuthCard } from "./AuthCard";
import { PasswordInput } from "./PasswordInput";

type UtecLoginFormProps = {
  onSuccess: () => Promise<void>;
  onVolver: () => void;
};

// Login con cuenta UTEC contra Active Directory (POST /api/auth/ad). Los errores se muestran igual que en LoginForm, con el mensaje que manda el backend.
export function UtecLoginForm({ onSuccess, onVolver }: UtecLoginFormProps) {
  const [usuario, setUsuario] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorUsuario, setErrorUsuario] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (usuario.includes("@")) {
      setErrorUsuario("Escribí solo tu usuario, sin @dominio.");
      return;
    }
    setErrorUsuario("");
    setCargando(true);
    try {
      await loginWithAd(usuario, contrasenia);
      await onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
      setCargando(false);
    }
  }

  return (
    <AuthCard title="Iniciar sesión con UTEC" focusOnMount>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="floating-label">
            <input
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Usuario"
              className={`input w-full${errorUsuario ? " input-error" : ""}`}
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value);
                if (errorUsuario) setErrorUsuario("");
              }}
              disabled={cargando}
              aria-invalid={errorUsuario ? true : undefined}
              aria-describedby={errorUsuario ? "utec-usuario-error" : undefined}
            />
            <span>Usuario</span>
          </label>
          {errorUsuario ? (
            <p id="utec-usuario-error" className="mt-1 text-xs text-error">
              {errorUsuario}
            </p>
          ) : null}
        </div>
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
        <button type="submit" className="btn btn-primary w-full mt-2" disabled={cargando}>
          {cargando ? <span className="loading loading-spinner loading-sm" /> : null}
          {cargando ? "Ingresando…" : "Iniciar sesión"}
        </button>
        <div className="text-center">
          <button type="button" onClick={onVolver} disabled={cargando} className="link link-hover text-sm">
            Volver al inicio de sesión
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
