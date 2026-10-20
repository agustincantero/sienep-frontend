import type { Metadata } from "next";
import { BackendError, backendJson } from "@/lib/backend";
import { RecordatorioForm } from "@/components/recordatorios/RecordatorioForm";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { BackButton } from "@/components/layout/BackButton";
import { tienePermiso } from "@/lib/current-user";
import type { InstanciaComun } from "@/lib/instancias";

export const metadata: Metadata = {
  title: "Nuevo recordatorio · SIENEP",
};

// ?instancia={codInstancia}: se llega desde el detalle de la instancia. El form abre con esa instancia fija y, al guardar, el detalle del recordatorio vuelve a ella.
export default async function NuevoRecordatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ instancia?: string }>;
}) {
  if (!(await tienePermiso("CREAR_RECORDATORIO"))) {
    return <SinPermiso volverHref="/recordatorios" volverLabel="Volver a recordatorios" />;
  }
  const { instancia } = await searchParams;

  let instanciaFija: InstanciaComun | undefined;
  if (instancia !== undefined) {
    try {
      instanciaFija = await backendJson<InstanciaComun>(`/instancias/${instancia}`);
    } catch (err) {
      // Un id inválido (400) o inexistente/inactiva (404) se muestra acá, dentro del layout, en vez de romper con un 500.
      return (
        <div className="grow overflow-auto">
          <div className="max-w-[600px] mx-auto w-full px-4 py-5">
            <BackButton href="/recordatorios" label="Volver a recordatorios" />
            <div role="alert" className="alert alert-error alert-soft text-sm">
              <span>{err instanceof BackendError ? err.message : "No se pudo cargar la instancia."}</span>
            </div>
          </div>
        </div>
      );
    }
  }

  return <RecordatorioForm mode="crear" instanciaFija={instanciaFija} />;
}
