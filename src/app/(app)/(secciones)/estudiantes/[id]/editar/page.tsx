import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackendError, backendJson } from "@/lib/backend";
import { StudentForm } from "@/components/students/StudentForm";
import type { Student } from "@/lib/students";

export const metadata: Metadata = {
  title: "Editar estudiante · SIENEP",
};

// Se carga server-side (como RestablecerContraseniaPage con el token) para
// que el form arranque con los datos ya listos, sin spinner inicial.
export default async function EditarEstudiantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let estudiante: Student;
  try {
    estudiante = await backendJson<Student>(`/estudiantes/${id}`);
  } catch (err) {
    if (err instanceof BackendError && err.status === 404) notFound();
    throw err;
  }

  return <StudentForm mode="editar" estudianteId={Number(id)} estudiante={estudiante} />;
}
