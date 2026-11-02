import type { Metadata } from "next";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { StudentsListView } from "@/components/students/StudentsListView";
import { tienePermiso } from "@/lib/current-user";
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
  // Con VER_ESTUDIANTE_RESUMIDO solo (ej. Tutor) el listado se ve, aunque la ficha completa no.
  if (!(await tienePermiso("VER_ESTUDIANTE")) && !(await tienePermiso("VER_ESTUDIANTE_RESUMIDO"))) {
    return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
  }
  return <StudentsListView filtrosIniciales={leerFiltros(await searchParams)} />;
}
