import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IncidenciaDetalle } from "@/components/incidencias/IncidenciaDetalle";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Detalle de incidencia · SIENEP",
};

export default async function DetalleIncidenciaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desde?: string }>;
}) {
  const { id } = await params;
  // Mismo criterio que ?estudiante= en instancias/nuevo: un id que no es un entero positivo no existe, así que va a la 404 en vez de llegar al backend.
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) notFound();
  // ?desde=estudiante: se llegó desde la pestaña "Instancias e incidencias" de la ficha del estudiante, así que "Volver" lleva de nuevo ahí en vez de al listado general.
  const { desde } = await searchParams;
  if (!(await tienePermiso("VER_INCIDENCIAS"))) {
    return <SinPermiso volverHref="/incidencias" volverLabel="Volver a incidencias" />;
  }
  return <IncidenciaDetalle codInstancia={Number(id)} volverAEstudiante={desde === "estudiante"} />;
}
