import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    if (err instanceof BackendError && err.status === 404) notFound();
    throw err;
  }

  return <IncidenciaForm mode="editar" codInstancia={Number(id)} incidencia={incidencia} />;
}
