import type { Metadata } from "next";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { MisComentarios } from "@/components/perfil/MisComentarios";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Mis comentarios · SIENEP",
};

// Solo estudiantes: para un funcionario, GET /comentarios-normales-estudiante sin idEstudiante responde 400. El layout de (app) ya exige sesión.
export default async function MisComentariosPage() {
  const user = await getCurrentUser();
  if (user?.tipo !== "ESTUDIANTE") {
    return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
  }
  return <MisComentarios />;
}
