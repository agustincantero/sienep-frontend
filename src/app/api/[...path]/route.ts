import { type NextRequest, NextResponse } from "next/server";
import { shouldLogoutOn401 } from "@/lib/auth-paths";
import { getSessionToken, SESSION_COOKIE } from "@/lib/session";

// Proxy autenticado genérico: todo lo que el navegador mande a /api/<x> se
// reenvía a `${API_BASE_URL}/<x>` con el `Authorization: Bearer` sacado de la
// cookie httpOnly. Así el token va en TODAS las peticiones sin que el código
// cliente lo toque. Las rutas /api/auth/* tienen sus propios handlers y no
// pasan por acá (una ruta específica gana sobre el catch-all).
const API_BASE_URL = process.env.API_BASE_URL;

// Headers hop-by-hop + los que rearma fetch: no se reenvían.
const HEADERS_A_QUITAR = [
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-length",
  "content-encoding",
  "accept-encoding",
  "cookie",
];

async function handler(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: "Backend no configurado." }, { status: 500 });
  }

  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const { path } = await ctx.params;
  const backendPath = `/${path.join("/")}`;
  const target = new URL(`${API_BASE_URL}${backendPath}`);
  target.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  for (const h of HEADERS_A_QUITAR) headers.delete(h);
  headers.set("Authorization", `Bearer ${token}`);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > 0) init.body = buf;
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar con el servidor." },
      { status: 502 },
    );
  }

  const resHeaders = new Headers(backendRes.headers);
  resHeaders.delete("content-encoding");
  resHeaders.delete("content-length");
  resHeaders.delete("transfer-encoding");

  const response = new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: resHeaders,
  });

  // Si el backend rechazó el token (vencido, o invalidado por un cambio de contraseña: ver credencialesVigentesDesde), la cookie ya no sirve: la borramos en esta misma respuesta para que el navegador la descarte ya, en vez de arrastrar una cookie muerta hasta la próxima carga de página. Mismo criterio que el cliente en src/lib/api.ts.
  if (backendRes.status === 401 && shouldLogoutOn401(backendPath)) {
    response.cookies.delete(SESSION_COOKIE);
  }

  return response;
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
