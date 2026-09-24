import type { Metadata } from "next";
import { StudentForm } from "@/components/students/StudentForm";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Nuevo estudiante · SIENEP",
};

export default async function NuevoEstudiantePage() {
  if (!(await tienePermiso("CREAR_ESTUDIANTE"))) {
    return <SinPermiso volverHref="/estudiantes" volverLabel="Volver a estudiantes" />;
  }
  return <StudentForm mode="crear" />;
}
