import { getSessionToken } from "./session";

// Acceso al backend Spring desde el SERVER (Server Components, Route Handlers).
// Le pega directo a `API_BASE_URL`, no al proxy /api, con el token de la cookie
// httpOnly. La guía BFF de Next recomienda que los Server Components vayan a la
// fuente y no a un Route Handler propio (evita un salto HTTP extra).
const API_BASE_URL = process.env.API_BASE_URL;

export class BackendError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BackendError";
    this.status = status;
  }
}

type BackendJsonOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export async function backendJson<T>(
  path: string,
  { method = "GET", body, auth = true }: BackendJsonOptions = {},
): Promise<T> {
  if (!API_BASE_URL) throw new BackendError(0, "Falta configurar API_BASE_URL.");

  const headers = new Headers();
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (auth) {
    const token = await getSessionToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as { message?: string } | null;
  if (!res.ok) {
    throw new BackendError(res.status, data?.message ?? `Error ${res.status}`);
  }
  return data as T;
}
