import { proxyAuthPublico } from "@/lib/auth-handlers";

// POST /api/auth/forgot-password -> backend POST /auth/forgot-password (antes /auth/olvide-contrasenia).
// No requiere sesión ni setea cookie.
export function POST(request: Request) {
  return proxyAuthPublico(request, "/auth/forgot-password");
}
