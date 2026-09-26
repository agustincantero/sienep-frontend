import { proxyLogin } from "@/lib/auth-handlers";

// POST /api/auth/ad -> backend POST /auth/ad (cuenta UTEC contra Active Directory). Guarda el JWT en cookie httpOnly.
export function POST(request: Request) {
  return proxyLogin(request, "/auth/ad");
}
