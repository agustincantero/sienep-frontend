import type { Metadata } from "next";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { MisInformes } from "@/components/perfil/MisInformes";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Mis informes · SIENEP",
};

// Solo estudiantes: GET /informes-adjuntos/mios exige el rol ESTUDIANTE (a un funcionario le responde 403). El layout de (app) ya exige sesión.
export default async function MisInformesPage() {
  const user = await getCurrentUser();
  if (user?.tipo !== "ESTUDIANTE") {
    return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
  }
  return <MisInformes />;
}
