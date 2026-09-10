import { apiPost } from "./api";

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

// POST /api/auth/olvide-contrasenia — { email }. Pide el enlace de recuperación.
// El backend responde siempre 200 (no revela si el email existe) y sin cuerpo.
// 429 si se pidió demasiadas veces para el mismo email (3 / 15 min).
export function forgotPassword(email: string): Promise<void> {
  return apiPost<void>("/auth/olvide-contrasenia", { email });
}

// POST /api/auth/restablecer-contrasenia — { token, contraseniaNueva }. Aplica la
// contraseña nueva con el token de un solo uso del email. 401 = token inválido,
// vencido o ya usado.
export function resetPassword(
  token: string,
  contraseniaNueva: string,
): Promise<void> {
  return apiPost<void>("/auth/restablecer-contrasenia", { token, contraseniaNueva });
}
