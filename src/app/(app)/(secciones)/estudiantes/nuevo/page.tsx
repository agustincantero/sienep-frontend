import type { Metadata } from "next";
import { StudentForm } from "@/components/students/StudentForm";

export const metadata: Metadata = {
  title: "Nuevo estudiante · SIENEP",
};

export default function NuevoEstudiantePage() {
  return <StudentForm mode="crear" />;
}
