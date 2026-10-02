import type { Metadata } from "next";
import { IncidenciaForm } from "@/components/incidencias/IncidenciaForm";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Nueva incidencia · SIENEP",
};

// ?estudiante={id}: se llega desde la ficha del estudiante (pestaña Incidencias). Mismo criterio que instancias/nuevo: el form abre con ese estudiante fijo y, al guardar, el detalle vuelve a la ficha.
export default async function NuevaIncidenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ estudiante?: string }>;
}) {
  if (!(await tienePermiso("CREAR_INCIDENCIA"))) {
    return <SinPermiso volverHref="/incidencias" volverLabel="Volver a incidencias" />;
  }
  const { estudiante } = await searchParams;
  const idEstudiante = Number(estudiante);
  return (
    <IncidenciaForm
      mode="crear"
      idEstudianteFijo={Number.isInteger(idEstudiante) && idEstudiante > 0 ? idEstudiante : undefined}
    />
  );
}
