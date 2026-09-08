import { NextResponse } from "next/server";
import { setSessionToken } from "./session";

const API_BASE_URL = process.env.API_BASE_URL;

// Login (usuario/contraseña o Google): llama al backend y, si sale bien, guarda
// el token en la cookie httpOnly en lugar de devolvérselo al cliente.
export async function proxyLogin(request: Request, backendPath: string): Promise<Response> {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: "Backend no configurado." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body inválido." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${backendPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar con el servidor." },
      { status: 502 },
    );
  }

  const data = (await res.json().catch(() => null)) as
    | { token?: string; message?: string }
    | null;

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Error de autenticación." },
      { status: res.status },
    );
  }

  if (!data?.token) {
    return NextResponse.json(
      { message: "Respuesta inesperada del servidor." },
      { status: 502 },
    );
  }

  await setSessionToken(data.token);
  return NextResponse.json({ ok: true });
}

// Endpoints de auth que no setean cookie (pedir/usar el enlace de recuperación):
// passthrough simple al backend, reenviando status y cuerpo tal cual.
export async function proxyAuthPublico(
  request: Request,
  backendPath: string,
): Promise<Response> {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: "Backend no configurado." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${backendPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar con el servidor." },
      { status: 502 },
    );
  }

  const data = await res.json().catch(() => null);
  return NextResponse.json(data ?? {}, { status: res.status });
}
