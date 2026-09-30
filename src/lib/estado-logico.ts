// Instancia/Incidencia/CategoriaInstancia solo transitan entre ACTIVO e
// INACTIVO (nunca PENDIENTE_DE_ACTIVACION ni ELIMINADO) — a diferencia de
// describeEstado() en lib/students.ts, que sí contempla un tercer estado
// "Pendiente". Se separa en su propio archivo en vez de reusar el de
// Estudiantes para no acoplar este dominio a uno ajeno ni forzar ahí una
// rama que nunca aplica.
export function describeEstadoLogico(estado: string): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  // dotClass usa bg-current (color del texto del badge), no el color del
  // estado: un punto bg-success sobre un badge-success (fondo verde sólido,
  // texto blanco) queda verde sobre verde, invisible. Mismo criterio que
  // describeEstado() en lib/students.ts.
  return estado === "ACTIVO"
    ? { label: "Activo", badgeClass: "badge-success", dotClass: "bg-current" }
    : { label: "Inactivo", badgeClass: "badge-ghost", dotClass: "bg-current opacity-60" };
}
