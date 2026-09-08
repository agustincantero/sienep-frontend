import { proxyLogin } from "@/lib/auth-handlers";

// POST /api/auth/google -> backend POST /auth/google. Guarda el JWT en cookie httpOnly.
export function POST(request: Request) {
  return proxyLogin(request, "/auth/google");
}
