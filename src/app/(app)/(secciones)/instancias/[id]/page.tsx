import type { Metadata } from "next";
import { InstanciaDetalle } from "@/components/instancias/InstanciaDetalle";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Detalle de instancia · SIENEP",
};

export default async function DetalleInstanciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await tienePermiso("VER_INSTANCIAS"))) {
    return <SinPermiso volverHref="/instancias" volverLabel="Volver a instancias" />;
  }
  return <InstanciaDetalle codInstancia={Number(id)} />;
}
