import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackendError, backendJson } from "@/lib/backend";
import { CatalogoForm } from "@/components/catalogos/CatalogoForm";
import { BackButton } from "@/components/layout/BackButton";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { buscarCatalogo, hrefListado } from "@/lib/catalogos-tabs";
import { tienePermiso } from "@/lib/current-user";

type Params = { params: Promise<{ catalogo: string; id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const definicion = buscarCatalogo((await params).catalogo);
  return { title: `${definicion?.editarLabel ?? "Catálogos"} · SIENEP` };
}

function Aviso({ volverHref, mensaje }: { volverHref: string; mensaje: string }) {
  return (
    <div className="grow overflow-auto">
      <div className="max-w-[600px] mx-auto w-full px-4 py-5">
        <BackButton href={volverHref} label="Volver a catálogos" />
        <div role="alert" className="alert alert-error alert-soft text-sm">
          <span>{mensaje}</span>
        </div>
      </div>
    </div>
  );
}

// Prefetch server-side, mismo criterio que roles/[id]/editar: el form arranca con los datos ya listos, sin spinner inicial.
export default async function EditarItemCatalogoPage({ params }: Params) {
  const { catalogo, id } = await params;
  const definicion = buscarCatalogo(catalogo);
  if (!definicion) notFound();
  const volverHref = hrefListado(definicion.id);

  if (!(await tienePermiso(definicion.permisos.editar))) {
    return <SinPermiso volverHref={volverHref} volverLabel="Volver a catálogos" />;
  }

  let item: { estado: string };
  try {
    item = await backendJson<{ estado: string }>(`${definicion.endpoint}/${id}`);
  } catch (err) {
    // 404 no encontrado, 400 id con formato inválido, etc.: dentro del layout en vez de romper con un 500.
    return <Aviso volverHref={volverHref} mensaje={err instanceof BackendError ? err.message : "No se pudo cargar el registro."} />;
  }

  // Los cinco services responden 409 al editar algo inactivo: se corta acá en vez de mostrar un formulario que nunca va a poder guardar (el listado ya oculta "Editar" en esas filas; esto cubre la URL directa).
  if (item.estado !== "ACTIVO") {
    return <Aviso volverHref={volverHref} mensaje="Este registro está inactivo. Activalo desde el listado para poder editarlo." />;
  }

  return <CatalogoForm catalogo={definicion.id} item={item} />;
}
