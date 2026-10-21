import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";
import type { InstanciaComun } from "./instancias";
import type { Page } from "./students";

// Valores de TipoRecordatorio del backend, con su texto para pantalla.
export const TIPOS_RECORDATORIO = {
  LLAMADA: "Llamada",
  REUNION: "Reunión",
  TAREA_ADMINISTRATIVA: "Tarea administrativa",
  OTRO: "Otro",
} as const;

export type TipoRecordatorio = keyof typeof TIPOS_RECORDATORIO;

// Estado OPERATIVO (EstadoRecordatorio): lo calcula el backend según la fecha, aparte del estado lógico ACTIVO/INACTIVO.
export type EstadoOperativo = "VENCIDO" | "HOY" | "FUTURO";

// GET /recordatorios, GET /recordatorios/{id} (RecordatorioResponseDTO). Igual que InstanciaComun, las asociaciones llegan aplanadas (codInstancia + tituloInstancia, idResponsable + nombreResponsable). No trae el flag "cumplido": que ya generó su instancia de seguimiento se sabe recién por el 409 de POST /recordatorios/{id}/instancias.
export type Recordatorio = {
  codRecordatorio: number;
  idNegRecordatorio: string | null;
  titulo: string;
  tipo: TipoRecordatorio;
  fechaHora: string;
  codInstancia: number;
  tituloInstancia: string;
  idCategoria: number;
  nombreCategoria: string;
  idResponsable: number;
  nombreResponsable: string;
  idFrecuencia: number | null;
  descripcionFrecuencia: string | null;
  fechaFin: string | null;
  nroOcurrencias: number | null;
  estadoOperativo: EstadoOperativo;
  estado: string;
  createdAt: string;
  updatedAt: string;
};

export type RecordatorioListParams = {
  // A diferencia de /instancias, acá estado es un único valor (sin lista separada por comas). Sin él, el backend devuelve solo los ACTIVOS.
  estado?: string;
  page?: number;
  size?: number;
  // Formato de Spring Data: "campo,asc|desc" (ej. "fechaHora,asc").
  sort?: string;
};

// El backend no filtra por texto, categoría ni estado operativo: esos filtros los aplica el listado en el cliente.
export function listRecordatorios(params: RecordatorioListParams = {}): Promise<Page<Recordatorio>> {
  return apiGet<Page<Recordatorio>>("/recordatorios", params);
}

export function listRecordatoriosDeInstancia(
  codInstancia: number,
  params: RecordatorioListParams = {},
): Promise<Page<Recordatorio>> {
  return apiGet<Page<Recordatorio>>(`/recordatorios/instancia/${codInstancia}`, params);
}

export function getRecordatorio(codRecordatorio: number): Promise<Recordatorio> {
  return apiGet<Recordatorio>(`/recordatorios/${codRecordatorio}`);
}

// RecordatorioRequestDTO, el mismo para alta y edición (el PUT es un reemplazo total). codInstancia no se puede cambiar al editar: el backend responde 409. fechaHora tiene que ser futura también al editar (@Future del DTO), aunque no cambie. Con idFrecuencia, el recordatorio se repite y hace falta fechaFin o nroOcurrencias (1 a 5) para que termine.
export type RecordatorioInput = {
  titulo: string;
  tipo: TipoRecordatorio;
  fechaHora: string;
  codInstancia: number;
  idCategoria: number;
  idResponsable: number;
  idFrecuencia?: number;
  fechaFin?: string;
  nroOcurrencias?: number;
};

export function createRecordatorio(dto: RecordatorioInput): Promise<Recordatorio> {
  return apiPost<Recordatorio>("/recordatorios", dto);
}

export function updateRecordatorio(codRecordatorio: number, dto: RecordatorioInput): Promise<Recordatorio> {
  return apiPut<Recordatorio>(`/recordatorios/${codRecordatorio}`, dto);
}

// Baja lógica (INACTIVO); el backend también borra el evento de Google Calendar.
export function deactivateRecordatorio(codRecordatorio: number): Promise<void> {
  return apiDelete<void>(`/recordatorios/${codRecordatorio}`);
}

export function reactivateRecordatorio(codRecordatorio: number): Promise<Recordatorio> {
  return apiPatch<Recordatorio>(`/recordatorios/${codRecordatorio}/reactivar`);
}

// InstanciaDesdeRecordatorioDTO: la categoría es de INSTANCIA (no de recordatorio). Sin título, el backend usa "Seguimiento: <título del recordatorio>".
export type InstanciaDesdeRecordatorioInput = {
  idCategoria: number;
  titulo?: string;
  canal?: string;
};

// RF27: crea la instancia de seguimiento (mismo estudiante, fecha de ahora) y marca el recordatorio como cumplido. Una segunda vez responde 409.
export function crearInstanciaDesdeRecordatorio(
  codRecordatorio: number,
  dto: InstanciaDesdeRecordatorioInput,
): Promise<InstanciaComun> {
  return apiPost<InstanciaComun>(`/recordatorios/${codRecordatorio}/instancias`, dto);
}

export function describeEstadoOperativo(estado: EstadoOperativo): { label: string; badgeClass: string } {
  switch (estado) {
    case "VENCIDO":
      return { label: "Vencido", badgeClass: "badge-error" };
    case "HOY":
      return { label: "Hoy", badgeClass: "badge-warning" };
    default:
      return { label: "Futuro", badgeClass: "badge-neutral badge-outline" };
  }
}

// Texto de la repetición para el detalle ("Semanal, hasta el 30/11/2026" / "Semanal, 3 veces"); null si no se repite.
export function describirRepeticion(r: Recordatorio, formatFecha: (iso: string) => string): string | null {
  if (r.idFrecuencia == null) return null;
  const frecuencia = r.descripcionFrecuencia ?? "Se repite";
  if (r.fechaFin) return `${frecuencia}, hasta el ${formatFecha(r.fechaFin)}`;
  if (r.nroOcurrencias) return `${frecuencia}, ${r.nroOcurrencias} ${r.nroOcurrencias === 1 ? "vez" : "veces"}`;
  return frecuencia;
}
