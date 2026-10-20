import type { Metadata } from "next";
import { RecordatoriosListView } from "@/components/recordatorios/RecordatoriosListView";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Recordatorios · SIENEP",
};

export default async function RecordatoriosPage() {
  if (!(await tienePermiso("VER_RECORDATORIOS"))) {
    return <SinPermiso volverHref="/recordatorios" volverLabel="Volver a recordatorios" />;
  }
  return <RecordatoriosListView />;
}
