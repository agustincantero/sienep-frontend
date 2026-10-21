import type { Metadata } from "next";
import { RecordatorioDetalle } from "@/components/recordatorios/RecordatorioDetalle";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Detalle de recordatorio · SIENEP",
};

export default async function DetalleRecordatorioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desde?: string }>;
}) {
  const { id } = await params;
  // ?desde=instancia: se llegó desde el detalle de la instancia, así que "Volver" lleva de nuevo ahí en vez de al listado general.
  const { desde } = await searchParams;
  if (!(await tienePermiso("VER_RECORDATORIOS"))) {
    return <SinPermiso volverHref="/recordatorios" volverLabel="Volver a recordatorios" />;
  }
  return <RecordatorioDetalle codRecordatorio={Number(id)} volverAInstancia={desde === "instancia"} />;
}
