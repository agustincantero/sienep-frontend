import type { Metadata } from "next";
import { CatalogosView } from "@/components/catalogos/CatalogosView";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { TABS_CATALOGO } from "@/lib/catalogos-tabs";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Catálogos · SIENEP",
};

export default async function CatalogosPage({ searchParams }: { searchParams: Promise<{ tab?: string; exito?: string }> }) {
  // Mismo criterio que el ítem del menú (nav-items.ts): alcanza con poder ver uno de los cinco catálogos; las pestañas sin permiso no se muestran.
  const user = await getCurrentUser();
  const permisos = user?.permisos ?? [];
  if (!TABS_CATALOGO.some((t) => permisos.includes(t.permisos.ver))) {
    return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
  }
  // ?tab=: pestaña con la que abre la pantalla (CatalogosView ignora valores que no sean una pestaña visible para el usuario). ?exito=: mensaje que deja el formulario de alta/edición al guardar.
  const { tab, exito } = await searchParams;
  return <CatalogosView tabInicial={tab} exitoInicial={exito} />;
}
