import type { Metadata } from "next";
import { InstanciaDetalle } from "@/components/instancias/InstanciaDetalle";

export const metadata: Metadata = {
  title: "Detalle de instancia · SIENEP",
};

export default async function DetalleInstanciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InstanciaDetalle codInstancia={Number(id)} />;
}
