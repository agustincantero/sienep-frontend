import { PantallaCard } from "@/components/layout/PantallaCard";

// Fallback de los loading.tsx: se ve mientras el server resuelve la página (permisos, sesión) antes de que la vista cliente pida sus propios datos.
export function PantallaCargando({ variante }: { variante: "seccion" | "auth" }) {
  // En las secciones va solo el spinner, igual que el de los detalles (mismo contenedor y tamaño) para que no salte de lugar al pasar de uno a otro.
  if (variante === "seccion") {
    return (
      <div className="grow overflow-auto flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" role="status" aria-label="Cargando" />
      </div>
    );
  }

  return (
    <PantallaCard variante={variante}>
      <span className="loading loading-spinner loading-lg text-primary" role="status" aria-label="Cargando" />
    </PantallaCard>
  );
}
