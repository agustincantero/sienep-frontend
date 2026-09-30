import type { Metadata } from "next";
import { InstanciaForm } from "@/components/instancias/InstanciaForm";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Nueva instancia · SIENEP",
};

export default async function NuevaInstanciaPage() {
  if (!(await tienePermiso("CREAR_INSTANCIA"))) {
    return <SinPermiso volverHref="/instancias" volverLabel="Volver a instancias" />;
  }
  return <InstanciaForm mode="crear" />;
}
