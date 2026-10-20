import { describeEstadoOperativo, type EstadoOperativo } from "@/lib/recordatorios";

// Columna "Cuándo" del wireframe: vencido / hoy / futuro, según la fecha. Va aparte del EstadoBadge (activo/inactivo), que es el estado lógico.
export function EstadoOperativoBadge({ estado }: { estado: EstadoOperativo }) {
  const { label, badgeClass } = describeEstadoOperativo(estado);
  return <span className={`badge badge-sm ${badgeClass}`}>{label}</span>;
}
