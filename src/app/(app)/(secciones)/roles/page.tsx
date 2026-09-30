import type { Metadata } from "next";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { RolesListView } from "@/components/roles/RolesListView";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Roles · SIENEP",
};

export default async function RolesPage() {
  if (!(await tienePermiso("VER_ROLES"))) {
    return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
  }
  return <RolesListView />;
}
