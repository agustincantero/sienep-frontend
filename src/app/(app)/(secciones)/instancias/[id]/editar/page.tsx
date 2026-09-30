import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await tienePermiso("EDITAR_INSTANCIA"))) {
    return <SinPermiso volverHref="/instancias" volverLabel="Volver a instancias" />;
  }

  let instancia: InstanciaComun;
  try {
    instancia = await backendJson<InstanciaComun>(`/instancias/${id}`);
  } catch (err) {
    if (err instanceof BackendError && err.status === 404) notFound();
    throw err;
  }

  return <InstanciaForm mode="editar" codInstancia={Number(id)} instancia={instancia} />;
}
