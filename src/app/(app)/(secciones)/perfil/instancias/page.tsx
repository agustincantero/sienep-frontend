import type { Metadata } from "next";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { MisInstancias } from "@/components/perfil/MisRegistros";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Mis instancias · SIENEP",
};

// Solo estudiantes: GET /instancias/mis-instancias es exclusivo del rol ESTUDIANTE. El layout de (app) ya exige sesión.
export default async function MisInstanciasPage() {
  const user = await getCurrentUser();
  if (user?.tipo !== "ESTUDIANTE") {
    return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
  }
  return <MisInstancias />;
}
