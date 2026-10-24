import type { Metadata } from "next";
import { StudentFormEditar } from "@/components/students/StudentFormEditar";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Editar estudiante · SIENEP",
};

// La page solo chequea el permiso; los datos del estudiante los pide StudentFormEditar (mismo criterio que la ficha).
export default async function EditarEstudiantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await tienePermiso("EDITAR_ESTUDIANTE"))) {
    return <SinPermiso volverHref="/estudiantes" volverLabel="Volver a estudiantes" />;
  }

  return <StudentFormEditar idEstudiante={Number(id)} />;
}
