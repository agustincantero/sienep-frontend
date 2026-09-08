import { proxyAuthPublico } from "@/lib/auth-handlers";

// POST /api/auth/restablecer-contrasenia -> backend POST /auth/restablecer-contrasenia.
// No requiere sesión ni setea cookie.
export function POST(request: Request) {
  return proxyAuthPublico(request, "/auth/restablecer-contrasenia");
}
