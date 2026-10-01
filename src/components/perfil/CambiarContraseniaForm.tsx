"use client";

import { useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { ApiError, apiErrorMessage } from "@/lib/api";
import { logout, setPassword } from "@/lib/auth";
import type { AuthenticatedUser } from "@/lib/user";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SeccionCard } from "./SeccionCard";

// Cambio de contraseña desde "Mi perfil" (funcionario o estudiante), contra el mismo PATCH /{funcionarios|estudiantes}/{id}/contrasenia que usa SetPasswordForm en el primer inicio de sesión. El backend actualiza credencialesVigentesDesde, así que el JWT actual deja de valer apenas se guarda: por eso, al terminar, se cierra la sesión y se pide entrar de nuevo en vez de seguir navegando con un token muerto.
export function CambiarContraseniaForm({ user }: { user: AuthenticatedUser }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errorActual, setErrorActual] = useState("");
  const [errorNueva, setErrorNueva] = useState("");
  const [errorConfirmar, setErrorConfirmar] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const avisoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listo) avisoRef.current?.focus();
  }, [listo]);

  // Aviso en vivo mientras se escribe la repetición: solo se marca cuando ya se desvió de la nueva (dejó de ser un prefijo) o cuando ya es igual de larga y distinta, para no mostrar un error en cada tecla.
  const noCoincide =
    confirmar.length > 0 &&
    (confirmar.length >= nueva.length ? confirmar !== nueva : !nueva.startsWith(confirmar));

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setErrorForm("");

    // Mismas reglas que SetPasswordForm/ResetPasswordForm: el backend valida @NotBlank además de @Size(8,100), y el largo se chequea sobre el string crudo.
    const eActual = actual ? "" : "Ingresá tu contraseña actual.";
    let eNueva = "";
    if (!nueva.trim()) eNueva = "La contraseña no puede ser solo espacios.";
    else if (nueva.length < 8) eNueva = "Tiene que tener al menos 8 caracteres.";
    else if (nueva.length > 100) eNueva = "No puede superar los 100 caracteres.";
    else if (nueva === actual) eNueva = "Tiene que ser distinta de la actual.";
    const eConfirmar = nueva === confirmar ? "" : "Las contraseñas no coinciden.";

    setErrorActual(eActual);
    setErrorNueva(eNueva);
    setErrorConfirmar(eConfirmar);
    if (eActual || eNueva || eConfirmar) return;

    setGuardando(true);
    try {
      await setPassword(user.tipo, user.idUsuario, actual, nueva);
      setListo(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setErrorActual("La contraseña actual no es correcta.");
      } else {
        setErrorForm(apiErrorMessage(err, "No se pudo actualizar la contraseña. Probá de nuevo."));
      }
    } finally {
      setGuardando(false);
    }
  }

  // Borra la cookie con el token ya invalidado y recarga entera (no el router SPA), mismo criterio que el logout de AppShell.
  async function irAlLogin() {
    setSaliendo(true);
    try {
      await logout();
    } finally {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa a propósito, ver comentario de arriba
      window.location.href = "/login";
    }
  }

  return (
    <SeccionCard icon={KeyRound} titulo="Cambiar contraseña">

      {listo ? (
        <div className="space-y-3">
          <div
            ref={avisoRef}
            tabIndex={-1}
            role="status"
            className="alert alert-success alert-soft text-sm focus:outline-none"
          >
            <span>Tu contraseña fue actualizada. Por seguridad, iniciá sesión de nuevo con la contraseña nueva.</span>
          </div>
          <div className="flex justify-end">
            <button type="button" className="btn btn-primary" onClick={irAlLogin} disabled={saliendo}>
              {saliendo ? <span className="loading loading-spinner loading-sm" /> : null}
              Ir al inicio de sesión
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <PasswordInput
            label="Contraseña actual"
            autoComplete="current-password"
            errorId="perfil-contrasenia-actual-error"
            value={actual}
            onChange={(v) => {
              setActual(v);
              if (errorActual) setErrorActual("");
            }}
            disabled={guardando}
            error={errorActual}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PasswordInput
              label="Contraseña nueva"
              autoComplete="new-password"
              errorId="perfil-contrasenia-nueva-error"
              value={nueva}
              onChange={(v) => {
                setNueva(v);
                if (errorNueva) setErrorNueva("");
              }}
              disabled={guardando}
              error={errorNueva}
              hint="Entre 8 y 100 caracteres."
            />
            <PasswordInput
              label="Repetir contraseña nueva"
              autoComplete="new-password"
              errorId="perfil-contrasenia-confirmar-error"
              value={confirmar}
              onChange={(v) => {
                setConfirmar(v);
                if (errorConfirmar) setErrorConfirmar("");
              }}
              disabled={guardando}
              error={errorConfirmar || (noCoincide ? "Las contraseñas no coinciden." : "")}
            />
          </div>
          {errorForm ? (
            <div role="alert" className="alert alert-error alert-soft text-sm">
              <span>{errorForm}</span>
            </div>
          ) : null}
          <p className="text-sm text-base-content/60">
            Al guardar se cierra tu sesión en todos los dispositivos y vas a tener que entrar de nuevo.
          </p>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? <span className="loading loading-spinner loading-sm" /> : null}
              Cambiar contraseña
            </button>
          </div>
        </form>
      )}
    </SeccionCard>
  );
}
