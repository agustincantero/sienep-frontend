import { NextResponse } from "next/server";
import { clearSessionToken, getSessionToken } from "@/lib/session";

const API_BASE_URL = process.env.API_BASE_URL;

// POST /api/auth/logout -> avisa al backend (best-effort) y borra la cookie.
export async function POST(): Promise<Response> {
  const token = await getSessionToken();

  if (token && API_BASE_URL) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch {
      // Si el backend no responde, igual cerramos la sesión local.
    }
  }

  await clearSessionToken();
  return NextResponse.json({ ok: true });
}
