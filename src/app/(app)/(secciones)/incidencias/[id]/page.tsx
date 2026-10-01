import type { Metadata } from "next";
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
  // ?desde=estudiante: se llegó desde la pestaña "Instancias e incidencias" de la ficha del estudiante, así que "Volver" lleva de nuevo ahí en vez de al listado general.
  const { desde } = await searchParams;
  if (!(await tienePermiso("VER_INCIDENCIAS"))) {
    return <SinPermiso volverHref="/incidencias" volverLabel="Volver a incidencias" />;
  }
  return <IncidenciaDetalle codInstancia={Number(id)} volverAEstudiante={desde === "estudiante"} />;
}
