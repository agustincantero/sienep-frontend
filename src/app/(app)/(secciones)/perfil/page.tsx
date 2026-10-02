import type { Metadata } from "next";
import { MiPerfil } from "@/components/perfil/MiPerfil";

export const metadata: Metadata = {
  title: "Mi perfil · SIENEP",
};

// Sin chequeo de permiso: cualquier usuario autenticado (funcionario o estudiante) puede ver su propio perfil. El layout de (app) ya exige sesión.
export default function MiPerfilPage() {
  return <MiPerfil />;
}
