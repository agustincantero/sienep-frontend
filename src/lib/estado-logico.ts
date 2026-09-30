// Instancia/Incidencia/CategoriaInstancia solo transitan entre ACTIVO e INACTIVO (nunca PENDIENTE_DE_ACTIVACION ni ELIMINADO), a diferencia de describeEstado() en lib/students.ts.
export function describeEstadoLogico(estado: string): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  // dotClass usa bg-current (color del texto del badge), no el color del estado: un punto bg-success sobre un badge-success queda verde sobre verde, invisible.
  return estado === "ACTIVO"
    ? { label: "Activo", badgeClass: "badge-success", dotClass: "bg-current" }
    : { label: "Inactivo", badgeClass: "badge-ghost", dotClass: "bg-current opacity-60" };
}
