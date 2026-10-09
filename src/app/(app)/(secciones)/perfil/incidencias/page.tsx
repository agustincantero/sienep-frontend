import type { Metadata } from "next";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { MisIncidencias } from "@/components/perfil/MisRegistros";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Mis incidencias · SIENEP",
};

// Solo estudiantes: GET /incidencias/mis-incidencias es exclusivo del rol ESTUDIANTE. El layout de (app) ya exige sesión.
export default async function MisIncidenciasPage() {
  const user = await getCurrentUser();
  if (user?.tipo !== "ESTUDIANTE") {
    return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
  }
  return <MisIncidencias />;
}
