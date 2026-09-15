"use client";

import { useState } from "react";
import Link from "next/link";
import { apiErrorMessage, ApiError } from "@/lib/api";
import { setPassword } from "@/lib/auth";
import type { AuthenticatedUser } from "@/lib/user";
import { AuthCard } from "./AuthCard";
import { PasswordInput } from "./PasswordInput";

type SetPasswordFormProps = {
  user: AuthenticatedUser;
  // Contraseña temporal ya validada (se acaba de usar para loguearse, en LoginForm). Si se pasa, no se le vuelve a pedir al usuario ni se muestra el escape hatch de "olvidé la temporal" (ya sabemos que la tiene). Si no se pasa (uso desde el gate de (app)/layout.tsx, que no tiene forma de conocerla), se le pide como un campo más.
  contraseniaActual?: string;
};

// Formulario de primer inicio de sesión: se usa en dos lugares — (1) inline en LoginForm, apenas el login resuelve bien y GET /auth/me dice PENDIENTE_DE_ACTIVACION, con la contraseña temporal ya en mano; (2) desde el gate de (app)/layout.tsx como respaldo para cualquier otra entrada a la app con una sesión ya PENDIENTE_DE_ACTIVACION (sesión retomada, bookmark, etc.), donde si hay que pedirla. PATCH /{funcionarios|estudiantes}/{id}/contrasenia exige la contraseña actual y, si sale bien, el backend pasa el estado a ACTIVO; también lo hace cumplir del lado del servidor (403 en cualquier otro endpoint mientras siga PENDIENTE_DE_ACTIVACION), así que esta pantalla no es solo cosmética. El JWT de la sesión actual queda invalidado por el propio cambio de contraseña (credencialesVigentesDesde), así que tras guardar hay que volver a loguearse con la contraseña nueva.
export function SetPasswordForm({ user, contraseniaActual }: SetPasswordFormProps) {
  const pideActual = contraseniaActual === undefined;
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorActual, setErrorActual] = useState("");
  const [errorNueva, setErrorNueva] = useState("");
  const [errorConfirmar, setErrorConfirmar] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [listo, setListo] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorForm("");

    let eNueva = "";
    // Mismas reglas que ResetPasswordForm: el backend valida @NotBlank además de @Size(8,100), y el largo se chequea sobre el string crudo.
    if (!nueva.trim()) eNueva = "La contraseña no puede ser solo espacios.";
    else if (nueva.length < 8) eNueva = "Tiene que tener al menos 8 caracteres.";
    else if (nueva.length > 100) eNueva = "No puede superar los 100 caracteres.";
    const eConfirmar = nueva === confirmar ? "" : "Las contraseñas no coinciden.";

    setErrorActual("");
    setErrorNueva(eNueva);
    setErrorConfirmar(eConfirmar);
    if (eNueva || eConfirmar) return;

    setCargando(true);
    try {
      await setPassword(user.tipo, user.idUsuario, contraseniaActual ?? actual, nueva);
      setListo(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        if (pideActual) setErrorActual("La contraseña temporal no es correcta.");
        else setErrorForm("La contraseña temporal ya no es correcta. Volvé a iniciar sesión.");
      } else {
        setErrorForm(
          apiErrorMessage(err, "No se pudo actualizar la contraseña. Probá de nuevo."),
        );
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthCard
      title="Elegí tu nueva contraseña"
      description="Iniciaste sesión con una contraseña temporal. Para continuar, establecé una contraseña propia."
    >
      {listo ? (
        <div className="space-y-4">
          <div role="status" className="alert alert-success alert-soft text-sm">
            <span>
              Tu contraseña fue actualizada. Iniciá sesión de nuevo con la contraseña nueva.
            </span>
          </div>
          <Link href="/login" className="btn btn-primary w-full">
            Ir al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {pideActual ? (
            <PasswordInput
              label="Contraseña temporal"
              autoComplete="current-password"
              errorId="set-password-actual-error"
              value={actual}
              onChange={(v) => {
                setActual(v);
                if (errorActual) setErrorActual("");
              }}
              error={errorActual}
              disabled={cargando}
            />
          ) : null}
          <PasswordInput
            label="Nueva contraseña"
            autoComplete="new-password"
            errorId="set-password-nueva-error"
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
            errorId="set-password-confirmar-error"
            value={confirmar}
            onChange={(v) => {
              setConfirmar(v);
              if (errorConfirmar) setErrorConfirmar("");
            }}
            error={errorConfirmar}
            disabled={cargando}
          />
          {errorForm ? (
            <div role="alert" className="alert alert-error alert-soft text-sm">
              <span>{errorForm}</span>
            </div>
          ) : null}
          <button type="submit" className="btn btn-primary w-full mt-2" disabled={cargando}>
            {cargando ? <span className="loading loading-spinner loading-sm" /> : null}
            {cargando ? "Guardando…" : "Guardar y continuar"}
          </button>
          {pideActual ? (
            <div className="text-center">
              <Link href="/forgot-password" className="link link-hover text-sm">
                ¿No tenés la contraseña temporal? Restablecela
              </Link>
            </div>
          ) : null}
        </form>
      )}
    </AuthCard>
  );
}
