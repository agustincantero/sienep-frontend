import { PantallaCard } from "@/components/layout/PantallaCard";

// Fallback de los loading.tsx: se ve mientras el server resuelve la página (permisos, sesión) antes de que la vista cliente pida sus propios datos.
export function PantallaCargando({ variante }: { variante: "seccion" | "auth" }) {
  return (
    <PantallaCard variante={variante}>
      <span className="loading loading-spinner loading-lg text-primary" role="status" aria-label="Cargando" />
    </PantallaCard>
  );
}
