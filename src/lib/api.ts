// Cliente HTTP del NAVEGADOR. Siempre le pega al proxy same-origin `/api/*`,
// nunca al backend directo: el token vive en una cookie httpOnly y los Route
// Handlers de src/app/api/** lo inyectan como `Authorization`. El JS nunca lo ve.

import { shouldLogoutOn401 } from "./auth-paths";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

async function apiRequest<T>(
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor.");
  }

  if (res.status === 401 && shouldLogoutOn401(path)) {
    // La sesión murió (token vencido o invalidado). Recarga completa a propósito: tira toda la memoria del cliente (el usuario viejo en useSession(), estado de pantallas). El router de next/navigation no se puede usar acá (este archivo no es un componente) y además haría una navegación SPA que dejaría ese estado sucio.
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- ver comentario de arriba
      window.location.href = "/login";
    }
    throw new ApiError(401, "Tu sesión expiró. Volvé a iniciar sesión.");
  }

  const raw = await res.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = (data as { message?: string } | null)?.message ?? `Error ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>("GET", path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>("POST", path, body);
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>("PATCH", path, body);
}
