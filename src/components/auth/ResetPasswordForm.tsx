"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiErrorMessage, ApiError } from "@/lib/api";
import { resetPassword } from "@/lib/auth";
import { AuthCard } from "./AuthCard";
import { PasswordInput } from "./PasswordInput";

type ResetPasswordFormProps = {
  // Token de un solo uso que llega por email, leído de ?token= en la page.
  token: string;
};

// Paso 2 de la recuperación: el usuario elige la contraseña nueva.
// POST /api/auth/restablecer-contrasenia con { token, contraseniaNueva }. El backend exige contraseniaNueva de 8 a 100 y responde 401 si el token está vencido, ya se usó o es inválido. El largo y la coincidencia se validan en JS y el mensaje va debajo del campo que falló (errores de campo); un 401 lleva al mismo panel de "enlace inválido" que cuando no hay token.
export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorNueva, setErrorNueva] = useState("");
  const [errorConfirmar, setErrorConfirmar] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [enlaceInvalido, setEnlaceInvalido] = useState(false);
  const [listo, setListo] = useState(false);

  // Cuando el flujo terminó (contraseña cambiada, o el enlace resultó inválido) el token ya no sirve: lo sacamos de la URL para no dejarlo en el historial del navegador ni en la barra de direcciones. NO se hace al montar para que un refresh mientras se completa el formulario no pierda un token que todavía es válido. history.replaceState (no el router de Next) para no re-ejecutar la page en el server, que se quedaría sin `?token=`.
  useEffect(() => {
    if ((listo || enlaceInvalido) && window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [listo, enlaceInvalido]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorForm("");

    let eNueva = "";
    // El backend valida @NotBlank además de @Size(8,100): una contraseña de solo espacios mide >= 8 pero igual la rechaza con 400. El largo se chequea sobre el string crudo (los espacios cuentan, igual que @Size).
    if (!nueva.trim()) eNueva = "La contraseña no puede ser solo espacios.";
    else if (nueva.length < 8) eNueva = "Tiene que tener al menos 8 caracteres.";
    else if (nueva.length > 100) eNueva = "No puede superar los 100 caracteres.";
    const eConfirmar = nueva === confirmar ? "" : "Las contraseñas no coinciden.";

    setErrorNueva(eNueva);
    setErrorConfirmar(eConfirmar);
    if (eNueva || eConfirmar) return;

    setCargando(true);
    try {
      await resetPassword(token, nueva);
      setListo(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Token vencido / ya usado: mismo callejón que llegar sin token.
        setEnlaceInvalido(true);
      } else {
        setErrorForm(
          apiErrorMessage(err, "No se pudo restablecer la contraseña. Probá de nuevo."),
        );
      }
    } finally {
      setCargando(false);
    }
  }

  if (!token || enlaceInvalido) {
    return (
      <AuthCard title="Restablecer contraseña">
        <div role="status" className="alert alert-info alert-soft text-sm">
          <span>
            Este enlace no es válido o ya se usó. Pedí uno nuevo desde{" "}
            <Link href="/forgot-password" className="link">
              recuperar contraseña
            </Link>
            .
          </span>
        </div>
      </AuthCard>
    );
  }

  if (listo) {
    return (
      <AuthCard title="Restablecer contraseña">
        <div className="space-y-4">
          <div role="status" className="alert alert-success alert-soft text-sm">
            <span>Tu contraseña fue actualizada.</span>
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
      {errorForm ? (
        <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
          <span>{errorForm}</span>
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          label="Nueva contraseña"
          autoComplete="new-password"
          errorId="reset-nueva-error"
          value={nueva}
          onChange={(v) => {
            setNueva(v);
            if (errorNueva) setErrorNueva("");
          }}
          error={errorNueva}
          disabled={cargando}
        />
        <PasswordInput
          label="Confirmar contraseña"
          autoComplete="new-password"
          errorId="reset-confirmar-error"
          value={confirmar}
          onChange={(v) => {
            setConfirmar(v);
            if (errorConfirmar) setErrorConfirmar("");
          }}
          error={errorConfirmar}
          disabled={cargando}
        />
        <button
          type="submit"
          className="btn btn-primary w-full mt-2"
          disabled={cargando}
        >
          {cargando ? <span className="loading loading-spinner loading-sm" /> : null}
          {cargando ? "Guardando…" : "Guardar nueva contraseña"}
        </button>
      </form>
    </AuthCard>
  );
}
