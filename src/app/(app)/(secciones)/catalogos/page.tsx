import { redirect } from "next/navigation";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { TABS_CATALOGO, hrefListado } from "@/lib/catalogos-tabs";
import { getCurrentUser } from "@/lib/current-user";

// /catalogos no tiene vista propia: cada catálogo vive en /catalogos/[catalogo]. Se redirige al primero que el usuario puede ver (mismo criterio que el ítem del menú en nav-items.ts).
export default async function CatalogosPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  const permisos = user?.permisos ?? [];
  const visibles = TABS_CATALOGO.filter((t) => permisos.includes(t.permisos.ver));
  if (visibles.length === 0) {
    return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
  }
  // ?tab=: compatibilidad con los links de antes (/catalogos?tab=itrs).
  const { tab } = await searchParams;
  redirect(hrefListado((visibles.find((t) => t.id === tab) ?? visibles[0]).id));
}
