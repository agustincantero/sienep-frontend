// Nombre seguido del documento ("Eduardo Varela · 43867154"), para distinguir homónimos; si no hay documento queda solo el nombre.
export function nombreConDocumento(nombre: string, documento?: string | null): string {
  return documento ? `${nombre} · ${documento}` : nombre;
}
