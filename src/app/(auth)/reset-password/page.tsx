import type { Metadata } from "next";
import { RestablecerContraseniaForm } from "@/components/auth/RestablecerContraseniaForm";

export const metadata: Metadata = {
  title: "Restablecer contraseña · SIENEP",
};

// El token de recuperación llega como ?token= en el enlace del email.
// Se lee acá (server) y se pasa como prop al form (client), sin useSearchParams.
export default async function RestablecerContraseniaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <RestablecerContraseniaForm token={token ?? ""} />;
}
