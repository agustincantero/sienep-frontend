import type { Metadata } from "next";
import { OlvideContraseniaForm } from "@/components/auth/OlvideContraseniaForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña · SIENEP",
};

export default function OlvideContraseniaPage() {
  return <OlvideContraseniaForm />;
}
