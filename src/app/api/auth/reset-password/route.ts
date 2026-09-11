import { proxyAuthPublico } from "@/lib/auth-handlers";

// POST /api/auth/reset-password -> backend POST /auth/reset-password (antes /auth/restablecer-contrasenia).
// No requiere sesión ni setea cookie.
export function POST(request: Request) {
  return proxyAuthPublico(request, "/auth/reset-password");
}
