// Formatea una fecha ISO sin hora (yyyy-MM-dd, como las que devuelve el
// backend para fechaNacimiento) a dd/mm/aaaa para mostrar en pantalla.
//
// A propósito NO se usa `new Date(fechaIso)`: un ISO date-only se interpreta
// como medianoche UTC, y en un huso horario negativo (ej. UTC-3, Uruguay)
// eso cae en el día anterior. Partir el string a mano evita el problema.
export function formatFecha(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split("-");
  if (!anio || !mes || !dia) return fechaIso;
  return `${dia}/${mes}/${anio}`;
}
