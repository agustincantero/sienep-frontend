import { NextResponse, after } from "next/server";
import { clearSessionToken, getSessionToken } from "@/lib/session";

const API_BASE_URL = process.env.API_BASE_URL;

// POST /api/auth/logout -> borra la cookie y responde de inmediato; el aviso al backend (best-effort) va después de la respuesta con after(), para no colgar el logout esperando a la API remota.
export async function POST(): Promise<Response> {
  const token = await getSessionToken();
  await clearSessionToken();

  if (token && API_BASE_URL) {
    after(async () => {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
      } catch {
        // El backend no respondió; la sesión local ya quedó cerrada igual.
      }
    });
  }

  return NextResponse.json({ ok: true });
}
