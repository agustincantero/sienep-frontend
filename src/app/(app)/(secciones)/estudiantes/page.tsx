import type { Metadata } from "next";
import { StudentsListView } from "@/components/students/StudentsListView";
import { leerFiltros } from "@/lib/estudiantes-filtros";

export const metadata: Metadata = {
  title: "Estudiantes · SIENEP",
};

// Los filtros, el orden y la página viajan en la URL (RF08, filtros persistentes): se leen acá para que el listado arranque ya filtrado, sin un primer pedido sin filtros.
export default async function EstudiantesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <StudentsListView filtrosIniciales={leerFiltros(await searchParams)} />;
}
