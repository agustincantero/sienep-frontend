import type { Metadata } from "next";
import { IncidenciasListView } from "@/components/incidencias/IncidenciasListView";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Incidencias · SIENEP",
};

export default async function IncidenciasPage() {
  if (!(await tienePermiso("VER_INCIDENCIAS"))) {
    return <SinPermiso volverHref="/incidencias" volverLabel="Volver a incidencias" />;
  }
  return <IncidenciasListView />;
}
