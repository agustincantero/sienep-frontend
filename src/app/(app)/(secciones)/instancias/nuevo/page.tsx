import type { Metadata } from "next";
import { BackendError, backendJson } from "@/lib/backend";
import { InstanciaForm } from "@/components/instancias/InstanciaForm";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";
import type { InstanciaComun } from "@/lib/instancias";
import { BackButton } from "@/components/layout/BackButton";

export const metadata: Metadata = {
  title: "Nueva instancia · SIENEP",
};

// ?estudiante={id}: se llega desde la ficha del estudiante (pestaña Instancias, RF18). El form abre con ese estudiante fijo y, al guardar, el detalle vuelve a la ficha.
// ?clonar={codInstancia}: se llega desde el botón "Clonar" del listado (RF17). El form abre con los datos de esa instancia precargados, menos la fecha y el ID.
export default async function NuevaInstanciaPage({
  searchParams,
}: {
  searchParams: Promise<{ estudiante?: string; clonar?: string }>;
}) {
  if (!(await tienePermiso("CREAR_INSTANCIA"))) {
    return <SinPermiso volverHref="/instancias" volverLabel="Volver a instancias" />;
  }
  const { estudiante, clonar } = await searchParams;
  const idEstudiante = Number(estudiante);

  let clonDe: InstanciaComun | undefined;
  if (clonar !== undefined) {
    try {
      clonDe = await backendJson<InstanciaComun>(`/instancias/${clonar}`);
    } catch (err) {
      // Un id inválido (400) o inexistente/inactiva (404) se muestra acá, dentro del layout, en vez de romper con un 500.
      return (
        <div className="grow overflow-auto">
          <div className="max-w-[600px] mx-auto w-full px-4 py-5">
            <BackButton href="/instancias" label="Volver a instancias" />
            <div role="alert" className="alert alert-error alert-soft text-sm">
              <span>{err instanceof BackendError ? err.message : "No se pudo cargar la instancia a clonar."}</span>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <InstanciaForm
      mode="crear"
      idEstudianteFijo={Number.isInteger(idEstudiante) && idEstudiante > 0 ? idEstudiante : undefined}
      clonDe={clonDe}
    />
  );
}
