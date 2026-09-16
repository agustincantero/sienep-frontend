import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

// `/` todavía no tiene contenido propio: bifurca según la sesión (GET /auth/me en el server) — con sesión válida a /inicio, sin sesión (o si el backend no responde) a /login. Dynamic porque getCurrentUser lee la cookie.
export const dynamic = "force-dynamic";

export default async function RootPage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  redirect(user ? "/inicio" : "/login");
}
