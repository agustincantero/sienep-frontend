import type { Metadata } from "next";
import { InstanciasListView } from "@/components/instancias/InstanciasListView";

export const metadata: Metadata = {
  title: "Instancias · SIENEP",
};

export default function InstanciasPage() {
  return <InstanciasListView />;
}
