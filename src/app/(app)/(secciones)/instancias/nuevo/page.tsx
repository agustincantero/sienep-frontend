import type { Metadata } from "next";
import { InstanciaForm } from "@/components/instancias/InstanciaForm";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Nueva instancia · SIENEP",
};

// ?estudiante={id}: se llega desde la ficha del estudiante (pestaña Instancias, RF18). El form abre con ese estudiante fijo y, al guardar, el detalle vuelve a la ficha.
export default async function NuevaInstanciaPage({
  searchParams,
}: {
  searchParams: Promise<{ estudiante?: string }>;
}) {
  if (!(await tienePermiso("CREAR_INSTANCIA"))) {
    return <SinPermiso volverHref="/instancias" volverLabel="Volver a instancias" />;
  }
  const { estudiante } = await searchParams;
  const idEstudiante = Number(estudiante);
  return (
    <InstanciaForm
      mode="crear"
      idEstudianteFijo={Number.isInteger(idEstudiante) && idEstudiante > 0 ? idEstudiante : undefined}
    />
  );
}
