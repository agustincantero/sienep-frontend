import { cache } from "react";
import { backendJson, BackendError } from "./backend";
import type { AuthenticatedUser } from "./user";

export type { AuthenticatedUser } from "./user";

// Trae el usuario del token vía GET /auth/me (server-side, con el JWT de la
// cookie httpOnly). Devuelve null si no hay sesión válida (401/403); cualquier
// otro error se propaga. Pensado para gatear el route group (app).
// Con cache() el layout de (app) y las páginas que chequean permisos comparten
// una sola llamada a /auth/me por request.
export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  try {
    return await backendJson<AuthenticatedUser>("/auth/me");
  } catch (err) {
    if (err instanceof BackendError && (err.status === 401 || err.status === 403)) {
      return null;
    }
    throw err;
  }
});

// Para páginas cuya ruta no alcanza con ocultar el ítem del menú (se puede entrar
// escribiendo la URL). Sin sesión devuelve false: el layout de (app) ya redirige a /login.
export async function tienePermiso(permiso: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.permisos.includes(permiso) ?? false;
}
