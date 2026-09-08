import { proxyAuthPublico } from "@/lib/auth-handlers";

// POST /api/auth/olvide-contrasenia -> backend POST /auth/olvide-contrasenia.
// No requiere sesión ni setea cookie.
export function POST(request: Request) {
  return proxyAuthPublico(request, "/auth/olvide-contrasenia");
}
