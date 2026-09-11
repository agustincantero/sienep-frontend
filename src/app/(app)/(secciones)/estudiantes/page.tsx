import type { Metadata } from "next";
import { StudentsListView } from "@/components/students/StudentsListView";

export const metadata: Metadata = {
  title: "Estudiantes · SIENEP",
};

export default function EstudiantesPage() {
  return <StudentsListView />;
}
