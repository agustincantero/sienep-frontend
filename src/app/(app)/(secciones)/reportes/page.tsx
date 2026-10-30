import type { Metadata } from "next";
import { ReportesView } from "@/components/reportes/ReportesView";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";
import { leerFiltrosReportes } from "@/lib/reportes-filtros";

export const metadata: Metadata = {
  title: "Reportes · SIENEP",
};

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await tienePermiso("VER_REPORTES"))) {
    return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
  }
  const filtros = leerFiltrosReportes(await searchParams);
  const puedeExportar = await tienePermiso("EXPORTAR_REPORTES");
  return <ReportesView filtrosIniciales={filtros} puedeExportar={puedeExportar} />;
}
