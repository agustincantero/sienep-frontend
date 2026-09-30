import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BackendError, backendJson } from "@/lib/backend";
import { IncidenciaForm } from "@/components/incidencias/IncidenciaForm";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";
import type { Incidencia } from "@/lib/incidencias";

export const metadata: Metadata = {
  title: "Editar incidencia · SIENEP",
};

export default async function EditarIncidenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await tienePermiso("EDITAR_INCIDENCIA"))) {
    return <SinPermiso volverHref="/incidencias" volverLabel="Volver a incidencias" />;
  }

  let incidencia: Incidencia;
  try {
    incidencia = await backendJson<Incidencia>(`/incidencias/${id}`);
  } catch (err) {
    // Cualquier error del backend (404 no encontrada, 400 id con formato invalido, etc.) se
    // muestra acá en vez de dejarlo sin capturar: mismo criterio que IncidenciaDetalle, que
    // ante un id invalido no rompe con un 500, sino que se queda dentro del layout de la app.
    return (
      <div className="grow overflow-auto">
        <div className="max-w-[600px] mx-auto w-full px-4 py-5">
          <Link href="/incidencias" className="btn btn-link no-underline mb-3 gap-1">
            <ArrowLeft size={16} aria-hidden />
            Volver a incidencias
          </Link>
          <div role="alert" className="alert alert-error alert-soft text-sm">
            <span>{err instanceof BackendError ? err.message : "No se pudo cargar la incidencia."}</span>
          </div>
        </div>
      </div>
    );
  }

  return <IncidenciaForm mode="editar" codInstancia={Number(id)} incidencia={incidencia} />;
}
