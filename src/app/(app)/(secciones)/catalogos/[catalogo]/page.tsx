import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogosView } from "@/components/catalogos/CatalogosView";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { buscarCatalogo } from "@/lib/catalogos-tabs";
import { tienePermiso } from "@/lib/current-user";

type Props = {
  params: Promise<{ catalogo: string }>;
  searchParams: Promise<{ exito?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const definicion = buscarCatalogo((await params).catalogo);
  return { title: `${definicion ? `${definicion.label} · ` : ""}Catálogos · SIENEP` };
}

export default async function CatalogoPage({ params, searchParams }: Props) {
  const definicion = buscarCatalogo((await params).catalogo);
  if (!definicion) notFound();

  if (!(await tienePermiso(definicion.permisos.ver))) {
    // /catalogos redirige al primer catálogo que sí puede ver (o muestra SinPermiso si no puede ver ninguno).
    return <SinPermiso volverHref="/catalogos" volverLabel="Volver a catálogos" />;
  }
  // ?exito=: mensaje que deja el formulario de alta/edición al guardar.
  const { exito } = await searchParams;
  return <CatalogosView catalogo={definicion.id} exitoInicial={exito} />;
}
