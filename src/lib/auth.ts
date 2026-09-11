import { apiGet, apiPatch, apiPost } from "./api";
import type { AuthenticatedUser, UserType } from "./user";

// Auth del lado del navegador. Todo pasa por el proxy /api/auth/*: el Route
// Handler llama al backend y maneja la cookie httpOnly. Acá nunca vuelve el token.
type Ok = { ok: true };

// POST /api/auth/login — { email, contrasenia }
export function login(email: string, contrasenia: string): Promise<Ok> {
  return apiPost<Ok>("/auth/login", { email, contrasenia });
}

// POST /api/auth/google — { idToken } (credential de Google Identity Services)
export function loginWithGoogle(idToken: string): Promise<Ok> {
  return apiPost<Ok>("/auth/google", { idToken });
}

// POST /api/auth/logout — avisa al backend y borra la cookie de sesión.
export function logout(): Promise<Ok> {
  return apiPost<Ok>("/auth/logout", {});
}

// GET /api/auth/me — del lado del cliente, solo para que LoginForm sepa justo después de un login exitoso si la cuenta quedó PENDIENTE_DE_ACTIVACION y hay que pedir la contraseña nueva ahí mismo (sin pedir de nuevo la temporal, que ya se tipeó para loguearse). El gate del server en (app)/layout.tsx sigue siendo quien lo hace cumplir en cualquier otra entrada a la app.
export function me(): Promise<AuthenticatedUser> {
  return apiGet<AuthenticatedUser>("/auth/me");
}

// POST /api/auth/forgot-password — { email }. Pide el enlace de recuperación. Path renombrado por
// backend (antes /auth/olvide-contrasenia); mismo contrato. El backend responde siempre 200 (no
// revela si el email existe) y sin cuerpo. 429 si se pidió demasiadas veces para el mismo email (3 / 15 min).
export function forgotPassword(email: string): Promise<void> {
  return apiPost<void>("/auth/forgot-password", { email });
}

// POST /api/auth/reset-password — { token, contraseniaNueva }. Aplica la contraseña nueva con el
// token de un solo uso del email. Path renombrado por backend (antes /auth/restablecer-contrasenia);
// mismo contrato. 401 = token inválido, vencido o ya usado.
export function resetPassword(
  token: string,
  contraseniaNueva: string,
): Promise<void> {
  return apiPost<void>("/auth/reset-password", { token, contraseniaNueva });
}

// PATCH /api/{funcionarios|estudiantes}/{id}/contrasenia — cambia la contraseña propia. No vive bajo /auth, pero es parte del flujo de login: la usa la pantalla obligatoria de primer inicio de sesión (estado PENDIENTE_DE_ACTIVACION) para reemplazar la contraseña temporal por una elegida por el usuario. 401 = la contraseña actual no es correcta (ver BUSINESS_401_SUFFIXES en auth-paths.ts).
export function setPassword(
  tipo: UserType,
  idUsuario: number,
  contraseniaActual: string,
  contrasenia: string,
): Promise<void> {
  const recurso = tipo === "FUNCIONARIO" ? "funcionarios" : "estudiantes";
  return apiPatch<void>(`/${recurso}/${idUsuario}/contrasenia`, {
    contraseniaActual,
    contrasenia,
  });
}
