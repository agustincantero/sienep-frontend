import type { Metadata } from "next";
import { InstanciasListView } from "@/components/instancias/InstanciasListView";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Instancias · SIENEP",
};

export default async function InstanciasPage() {
  if (!(await tienePermiso("VER_INSTANCIAS"))) {
    return <SinPermiso volverHref="/instancias" volverLabel="Volver a instancias" />;
  }
  return <InstanciasListView />;
}
