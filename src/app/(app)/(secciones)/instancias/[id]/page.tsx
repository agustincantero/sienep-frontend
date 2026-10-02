import type { Metadata } from "next";
import { InstanciaDetalle } from "@/components/instancias/InstanciaDetalle";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Detalle de instancia · SIENEP",
};

export default async function DetalleInstanciaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desde?: string }>;
}) {
  const { id } = await params;
  // ?desde=estudiante: se llegó desde la pestaña "Instancias e incidencias" de la ficha del estudiante, así que "Volver" lleva de nuevo ahí en vez de al listado general.
  const { desde } = await searchParams;
  if (!(await tienePermiso("VER_INSTANCIAS"))) {
    return <SinPermiso volverHref="/instancias" volverLabel="Volver a instancias" />;
  }
  return <InstanciaDetalle codInstancia={Number(id)} volverAEstudiante={desde === "estudiante"} />;
}
