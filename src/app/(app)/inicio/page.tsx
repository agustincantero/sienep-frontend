import type { Metadata } from "next";
import { InicioDashboard } from "./InicioDashboard";

export const metadata: Metadata = {
  title: "Inicio · SIENEP",
};

// Destino post-login. El contenido (accesos de funcionario vs estudiante) lo
// decide InicioDashboard según el `tipo` del usuario en sesión.
export default function InicioPage() {
  return <InicioDashboard />;
}
