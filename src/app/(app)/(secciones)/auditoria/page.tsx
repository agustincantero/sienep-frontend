import type { Metadata } from "next";
import { AuditListView } from "@/components/audit/AuditListView";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Auditoría · SIENEP",
};

export default async function AuditoriaPage() {
  if (!(await tienePermiso("VER_AUDITORIA"))) {
    return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
  }
  return <AuditListView />;
}
