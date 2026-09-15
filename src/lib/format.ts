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

// Formatea un LocalDateTime ISO del backend (ej. "2026-09-15T14:30:00", hora
// del servidor, sin offset) a "dd/mm/aaaa hh:mm". Mismo motivo que
// formatFecha para no usar `new Date()`: acá no hay date-only así que no hay
// riesgo de "cae en el día anterior", pero si en algún momento el backend
// empieza a mandar offset (ej. "...Z"), `new Date()` sí lo reinterpretaría a
// la hora local del navegador — partir el string a mano evita ese problema.
export function formatFechaHora(fechaIso: string): string {
  const [fecha, hora] = fechaIso.split("T");
  if (!fecha || !hora) return fechaIso;
  return `${formatFecha(fecha)} ${hora.slice(0, 5)}`;
}

// Iniciales para el avatar de respaldo (estudiante sin foto subida).
export function iniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}
