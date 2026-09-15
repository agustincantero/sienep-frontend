import { describeEstado } from "@/lib/students";

// Badge + punto de color, reutilizado en la fila de la tabla y en la ficha.
// El punto de "Pendiente" pulsa sutilmente para llamar la atención sobre una
// cuenta que todavía no se activó (RF06 — no es lo mismo que "desactivado").
export function EstadoBadge({ estado }: { estado: string }) {
  const { label, badgeClass, dotClass } = describeEstado(estado);
  const pendiente = badgeClass === "badge-warning";

  return (
    <span className={`badge badge-sm gap-1.5 ${badgeClass}`}>
      <span className={`size-1.5 rounded-full ${dotClass} ${pendiente ? "animate-pulse" : ""}`} aria-hidden />
      {label}
    </span>
  );
}
