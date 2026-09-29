import type { Metadata } from "next";
import { IncidenciaDetalle } from "@/components/incidencias/IncidenciaDetalle";

export const metadata: Metadata = {
  title: "Detalle de incidencia · SIENEP",
};

export default async function DetalleIncidenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <IncidenciaDetalle codInstancia={Number(id)} />;
}
