import { describeEstadoLogico } from "@/lib/estado-logico";

// Igual que components/students/EstadoBadge.tsx pero sin la rama "Pendiente"
// (con su pulse): Instancia/Incidencia nunca tienen ese estado, así que acá
// no hace falta. Compartido entre Instancias e Incidencias — ver nota de
// "piezas compartidas" en el plan de esta rama.
export function EstadoBadge({ estado }: { estado: string }) {
  const { label, badgeClass, dotClass } = describeEstadoLogico(estado);

  return (
    <span className={`badge badge-sm gap-1.5 ${badgeClass}`}>
      <span className={`size-1.5 rounded-full ${dotClass}`} aria-hidden />
      {label}
    </span>
  );
}
