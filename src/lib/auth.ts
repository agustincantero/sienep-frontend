import { apiPost } from "./api";

// Auth del lado del navegador. Todo pasa por el proxy /api/auth/*: el Route
// Handler llama al backend y maneja la cookie httpOnly. Acá nunca vuelve el token.
type Ok = { ok: true };

// POST /api/auth/login — { email, contrasenia }
export function login(email: string, contrasenia: string): Promise<Ok> {
  return apiPost<Ok>("/auth/login", { email, contrasenia });
}

// POST /api/auth/google — { idToken } (credential de Google Identity Services)
export function loginConGoogle(idToken: string): Promise<Ok> {
  return apiPost<Ok>("/auth/google", { idToken });
}

// POST /api/auth/logout — avisa al backend y borra la cookie de sesión.
export function logout(): Promise<Ok> {
  return apiPost<Ok>("/auth/logout", {});
}
