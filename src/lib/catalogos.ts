import { ApiError } from "./api";

// Helpers compartidos por los cinco catálogos (carreras, grupos, ITRs y las dos categorías). Todos exponen el mismo contrato en el backend: GET con ?estado= (ACTIVO por defecto), POST, PUT /{id}, DELETE /{id} (baja lógica) y PATCH /{id}/reactivar.

export type FiltroEstado = "Todos" | "Activo" | "Inactivo";

export const OPCIONES_ESTADO: FiltroEstado[] = ["Activo", "Inactivo"];

// El enum EstadoLogico del backend no tiene un valor "TODOS": igual que en /roles, "Todos" pide ambos estados en paralelo y los junta acá.
export function listarPorEstado<T>(listar: (estado: string) => Promise<T[]>, filtro: FiltroEstado): Promise<T[]> {
  if (filtro === "Activo") return listar("ACTIVO");
  if (filtro === "Inactivo") return listar("INACTIVO");
  return Promise.all([listar("ACTIVO"), listar("INACTIVO")]).then(([activos, inactivos]) => [...activos, ...inactivos]);
}

// Mismo criterio que CategoriaInstanciaService/CategoriaRecordatorioService.crear()/editar(): el backend guarda "Entrevista con familia" como "ENTREVISTA_CON_FAMILIA". Se muestra antes de guardar para que el nombre no aparezca "cambiado" en el listado.
export function normalizarNombreCategoria(nombre: string): string {
  return nombre.trim().toUpperCase().replace(/\s+/g, "_");
}

// Orden alfabético en español (tildes y mayúsculas incluidas): el backend devuelve las filas en orden de inserción.
export function compararTexto(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base" });
}

export function coincide(texto: string, ...campos: (string | null | undefined)[]): boolean {
  const q = texto.trim().toLowerCase();
  if (!q) return true;
  return campos.some((c) => (c ?? "").toLowerCase().includes(q));
}

// 409 por nombre repetido, para marcarlo en el campo y no como banner general. Los services lo dicen con "nombre" en el mensaje ("Ya existe una carrera con ese nombre.", "El nombre de la categoría ya existe"); donde no lo validan antes de guardar (edición de carrera), lo frena el UNIQUE de la tabla y el GlobalExceptionHandler responde un texto genérico de "conflicto con datos existentes". Otros 409 (ej. editar algo que otro usuario desactivó mientras tanto) quedan afuera.
export function esNombreRepetido(err: unknown): boolean {
  if (!(err instanceof ApiError) || err.status !== 409) return false;
  const mensaje = err.message.toLowerCase();
  return mensaje.includes("nombre") || mensaje.includes("datos existentes");
}
