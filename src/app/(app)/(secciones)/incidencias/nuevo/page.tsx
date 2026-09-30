import type { Metadata } from "next";
import { IncidenciaForm } from "@/components/incidencias/IncidenciaForm";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Nueva incidencia · SIENEP",
};

export default async function NuevaIncidenciaPage() {
  if (!(await tienePermiso("CREAR_INCIDENCIA"))) {
    return <SinPermiso volverHref="/incidencias" volverLabel="Volver a incidencias" />;
  }
  return <IncidenciaForm mode="crear" />;
}
