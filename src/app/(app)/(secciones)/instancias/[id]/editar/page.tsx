import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BackendError, backendJson } from "@/lib/backend";
import { InstanciaForm } from "@/components/instancias/InstanciaForm";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";
import type { InstanciaComun } from "@/lib/instancias";

export const metadata: Metadata = {
  title: "Editar instancia · SIENEP",
};

// Prefetch server-side, mismo criterio que estudiantes/[id]/editar: el form arranca con los datos ya listos, sin spinner inicial.
export default async function EditarInstanciaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desde?: string }>;
}) {
  const { id } = await params;
  // ?desde=estudiante: viene del detalle abierto desde la ficha del estudiante; al guardar, el form vuelve a ese detalle conservando el parámetro (ver StudentInstanciasPanel).
  const { desde } = await searchParams;

  if (!(await tienePermiso("EDITAR_INSTANCIA"))) {
    return <SinPermiso volverHref="/instancias" volverLabel="Volver a instancias" />;
  }

  let instancia: InstanciaComun;
  try {
    instancia = await backendJson<InstanciaComun>(`/instancias/${id}`);
  } catch (err) {
    // Cualquier error del backend (404 no encontrada, 400 id con formato invalido, etc.) se
    // muestra acá en vez de dejarlo sin capturar: mismo criterio que InstanciaDetalle, que
    // ante un id invalido no rompe con un 500, sino que se queda dentro del layout de la app.
    return (
      <div className="grow overflow-auto">
        <div className="max-w-[600px] mx-auto w-full px-4 py-5">
          <Link href="/instancias" className="btn btn-link no-underline mb-3 gap-1">
            <ArrowLeft size={16} aria-hidden />
            Volver a instancias
          </Link>
          <div role="alert" className="alert alert-error alert-soft text-sm">
            <span>{err instanceof BackendError ? err.message : "No se pudo cargar la instancia."}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <InstanciaForm
      mode="editar"
      codInstancia={Number(id)}
      instancia={instancia}
      volverAEstudiante={desde === "estudiante"}
    />
  );
}
