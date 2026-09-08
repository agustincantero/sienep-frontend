import { backendJson, BackendError } from "./backend";
import type { UsuarioAutenticado } from "./usuario";

export type { UsuarioAutenticado } from "./usuario";

// Trae el usuario del token vía GET /auth/me (server-side, con el JWT de la
// cookie httpOnly). Devuelve null si no hay sesión válida (401/403); cualquier
// otro error se propaga. Pensado para gatear el route group (app).
export async function getUsuarioActual(): Promise<UsuarioAutenticado | null> {
  try {
    return await backendJson<UsuarioAutenticado>("/auth/me");
  } catch (err) {
    if (err instanceof BackendError && (err.status === 401 || err.status === 403)) {
      return null;
    }
    throw err;
  }
}
