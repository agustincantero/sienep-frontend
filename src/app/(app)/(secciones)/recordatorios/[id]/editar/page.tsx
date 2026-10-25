import type { Metadata } from "next";
import { BackendError, backendJson } from "@/lib/backend";
import { RecordatorioForm } from "@/components/recordatorios/RecordatorioForm";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { BackButton } from "@/components/layout/BackButton";
import { tienePermiso } from "@/lib/current-user";
import type { Recordatorio } from "@/lib/recordatorios";

export const metadata: Metadata = {
  title: "Editar recordatorio · SIENEP",
};

// Prefetch server-side, mismo criterio que instancias/[id]/editar: el form arranca con los datos ya listos, sin spinner inicial.
export default async function EditarRecordatorioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desde?: string }>;
}) {
  const { id } = await params;
  // ?desde=instancia: viene del detalle abierto desde la instancia; al guardar, el form vuelve a ese detalle conservando el parámetro.
  const { desde } = await searchParams;

  if (!(await tienePermiso("EDITAR_RECORDATORIO"))) {
    return <SinPermiso volverHref="/recordatorios" volverLabel="Volver a recordatorios" />;
  }

  let recordatorio: Recordatorio;
  try {
    recordatorio = await backendJson<Recordatorio>(`/recordatorios/${id}`);
  } catch (err) {
    // 404 (no existe o está inactivo), 400 (id con formato inválido), etc.: se muestra dentro del layout en vez de romper con un 500.
    return (
      <div className="grow overflow-auto">
        <div className="max-w-[720px] mx-auto w-full px-4 py-5">
          <BackButton href="/recordatorios" label="Volver a recordatorios" />
          <div role="alert" className="alert alert-error alert-soft text-sm">
            <span>{err instanceof BackendError ? err.message : "No se pudo cargar el recordatorio."}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RecordatorioForm
      mode="editar"
      codRecordatorio={Number(id)}
      recordatorio={recordatorio}
      volverAInstancia={desde === "instancia"}
    />
  );
}
