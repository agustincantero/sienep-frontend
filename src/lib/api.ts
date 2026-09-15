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

// Núcleo compartido por todos los verbos: maneja la conexión caída, la sesión
// vencida (401 fuera de las rutas públicas de auth) y el parseo de error.
async function request<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, credentials: "same-origin" });
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

function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

// Arma el query string salteando valores vacíos/undefined, para no mandar
// `?estado=` o `?grupo=` sueltos cuando un filtro no está aplicado.
function withQuery(path: string, params?: Record<string, string | number | undefined>): string {
  if (!params) return path;
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") usp.set(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `${path}?${qs}` : path;
}

export function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  return request<T>(withQuery(path, params), { method: "GET" });
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, jsonInit("POST", body));
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, jsonInit("PUT", body));
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, body === undefined ? { method: "PATCH" } : jsonInit("PATCH", body));
}

export function apiDelete<T = void>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

// Sin Content-Type manual: el navegador arma el boundary de multipart solo
// cuando el body es un FormData.
export function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  return request<T>(path, { method: "POST", body: formData });
}

export function apiPutForm<T>(path: string, formData: FormData): Promise<T> {
  return request<T>(path, { method: "PUT", body: formData });
}
