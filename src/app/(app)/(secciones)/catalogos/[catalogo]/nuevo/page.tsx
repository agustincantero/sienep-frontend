import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogoForm } from "@/components/catalogos/CatalogoForm";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { buscarCatalogo, hrefListado } from "@/lib/catalogos-tabs";
import { tienePermiso } from "@/lib/current-user";

type Params = { params: Promise<{ catalogo: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const definicion = buscarCatalogo((await params).catalogo);
  return { title: `${definicion?.nuevoLabel ?? "Catálogos"} · SIENEP` };
}

export default async function NuevoItemCatalogoPage({ params }: Params) {
  const definicion = buscarCatalogo((await params).catalogo);
  if (!definicion) notFound();

  if (!(await tienePermiso(definicion.permisos.crear))) {
    return <SinPermiso volverHref={hrefListado(definicion.id)} volverLabel="Volver a catálogos" />;
  }
  return <CatalogoForm catalogo={definicion.id} />;
}
