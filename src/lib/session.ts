import { cookies } from "next/headers";

// Cookie de sesión: httpOnly, no accesible desde JavaScript. El JWT del backend
// vive acá; los Route Handlers de src/app/api/** lo leen y lo mandan al backend
// como `Authorization: Bearer`. El navegador nunca ve el token.
const SESSION_COOKIE = "sienep_session";
const MAX_AGE_FALLBACK = 60 * 60 * 5; // 5 h, igual que el JWT del backend

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: segundosHastaExpiracion(token) ?? MAX_AGE_FALLBACK,
  });
}

export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// Lee el claim `exp` del JWT (sin verificar la firma: eso es tarea del backend)
// para que la cookie caduque junto con el token.
function segundosHastaExpiracion(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
    };
    if (typeof json.exp !== "number") return null;
    const segundos = json.exp - Math.floor(Date.now() / 1000);
    return segundos > 0 ? segundos : null;
  } catch {
    return null;
  }
}
