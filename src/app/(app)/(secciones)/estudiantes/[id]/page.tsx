import type { Metadata } from "next";
import { StudentProfile } from "@/components/students/StudentProfile";

export const metadata: Metadata = {
  title: "Ficha de estudiante · SIENEP",
};

export default async function FichaEstudiantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentProfile idEstudiante={Number(id)} />;
}
