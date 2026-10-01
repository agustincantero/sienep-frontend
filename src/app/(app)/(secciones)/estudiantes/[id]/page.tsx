import type { Metadata } from "next";
import { StudentProfile } from "@/components/students/StudentProfile";

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
  const { id } = await params;
  // ?tab=: pestaña con la que abre la ficha (ej. al volver desde el detalle de una instancia). StudentProfile ignora valores que no sean una pestaña válida.
  const { tab } = await searchParams;
  return <StudentProfile idEstudiante={Number(id)} tabInicial={tab} />;
}
