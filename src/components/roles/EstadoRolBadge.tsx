// Roles solo tiene ACTIVO/INACTIVO vía API (nunca PENDIENTE_DE_ACTIVACION ni ELIMINADO, ver RolService): un badge propio y no el EstadoBadge de estudiantes, que sí contempla "Pendiente".
export function EstadoRolBadge({ estado }: { estado: string }) {
  const activo = estado === "ACTIVO";
  return (
    <span className={`badge badge-sm gap-1.5 ${activo ? "badge-success" : "badge-ghost"}`}>
      <span className={`size-1.5 rounded-full bg-current ${activo ? "" : "opacity-60"}`} aria-hidden />
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}
