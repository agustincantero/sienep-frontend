import type { Metadata } from "next";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { RolForm } from "@/components/roles/RolForm";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Nuevo rol · SIENEP",
};

export default async function NuevoRolPage() {
  if (!(await tienePermiso("CREAR_ROL"))) {
    return <SinPermiso volverHref="/roles" volverLabel="Volver a roles" />;
  }
  return <RolForm mode="crear" />;
}
