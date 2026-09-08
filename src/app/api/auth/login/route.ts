import { proxyLogin } from "@/lib/auth-handlers";

// POST /api/auth/login -> backend POST /auth/login. Guarda el JWT en cookie httpOnly.
export function POST(request: Request) {
  return proxyLogin(request, "/auth/login");
}
