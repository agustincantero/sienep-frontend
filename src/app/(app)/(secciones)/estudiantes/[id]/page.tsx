import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { StudentProfile } from "@/components/students/StudentProfile";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Ficha de estudiante · SIENEP",
};

export default async function FichaEstudiantePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  if (!(await tienePermiso("VER_ESTUDIANTE"))) {
    return <SinPermiso volverHref="/estudiantes" volverLabel="Volver a estudiantes" />;
  }
  const { id } = await params;
  // Mismo criterio que ?estudiante= en instancias/nuevo: un id que no es un entero positivo no existe, así que va a la 404 en vez de llegar al backend.
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) notFound();
  // ?tab=: pestaña con la que abre la ficha (ej. al volver desde el detalle de una instancia). StudentProfile ignora valores que no sean una pestaña válida.
  const { tab } = await searchParams;
  return <StudentProfile idEstudiante={Number(id)} tabInicial={tab} />;
}
