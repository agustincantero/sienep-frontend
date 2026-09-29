import type { Metadata } from "next";
import { IncidenciasListView } from "@/components/incidencias/IncidenciasListView";

export const metadata: Metadata = {
  title: "Incidencias · SIENEP",
};

export default function IncidenciasPage() {
  return <IncidenciasListView />;
}
