import type { Metadata } from "next";
import { IncidenciaDetalle } from "@/components/incidencias/IncidenciaDetalle";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Detalle de incidencia · SIENEP",
};

export default async function DetalleIncidenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await tienePermiso("VER_INCIDENCIAS"))) {
    return <SinPermiso volverHref="/incidencias" volverLabel="Volver a incidencias" />;
  }
  return <IncidenciaDetalle codInstancia={Number(id)} />;
}
