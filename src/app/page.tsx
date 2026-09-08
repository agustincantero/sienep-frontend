import { redirect } from "next/navigation";

// `/` todavía no tiene contenido propio: hasta que haya sesión + dashboard,
// la raíz manda al login. Cuando exista auth, acá va la bifurcación
// "con sesión -> dashboard / sin sesión -> /login".
export default function RootPage() {
  redirect("/login");
}
