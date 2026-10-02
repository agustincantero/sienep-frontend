import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";
import type { Page } from "./students";

// Ficha/fila de Incidencia — GET /incidencias, GET /incidencias/{id} (IncidenciaResponseDTO). Mismos campos planos que InstanciaComun más `lugar`; sin categoría, que es propia de InstanciaComun.
export type Incidencia = {
  codInstancia: number;
  idNegInstancia: string | null;
  titulo: string;
  fechaHora: string;
  canal: string | null;
  lugar: string;
  idEstudiante: number;
  nombreEstudiante: string;
  idFuncionario: number;
  nombreFuncionario: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
};

export type IncidenciaListParams = {
  idEstudiante?: number;
  idFuncionario?: number;
  estado?: string;
  page?: number;
  // Formato de Spring Data, mismo criterio que InstanciaListParams.sort.
  sort?: string;
  // Tamaño de página (el backend usa 20 por defecto).
  size?: number;
};

export function listIncidencias(params: IncidenciaListParams = {}): Promise<Page<Incidencia>> {
  return apiGet<Page<Incidencia>>("/incidencias", params);
}

export function getIncidencia(id: number): Promise<Incidencia> {
  return apiGet<Incidencia>(`/incidencias/${id}`);
}

// El backend reusa un solo DTO (IncidenciaRequestDTO) para alta y edición — a diferencia de InstanciaComun, acá idEstudiante SÍ es editable.
export type IncidenciaInput = {
  titulo: string;
  fechaHora: string;
  idEstudiante: number;
  canal?: string;
  lugar: string;
};

export function createIncidencia(dto: IncidenciaInput): Promise<Incidencia> {
  return apiPost<Incidencia>("/incidencias", dto);
}

export function updateIncidencia(id: number, dto: IncidenciaInput): Promise<Incidencia> {
  return apiPut<Incidencia>(`/incidencias/${id}`, dto);
}

// Baja lógica, mismo criterio que deactivateInstancia.
export function deactivateIncidencia(id: number): Promise<void> {
  return apiDelete<void>(`/incidencias/${id}`);
}

export function reactivateIncidencia(id: number): Promise<Incidencia> {
  return apiPatch<Incidencia>(`/incidencias/${id}/reactivar`);
}

// Involucrados — sub-recurso exclusivo de Incidencia (el backend lo monta solo bajo /incidencias/{codInstancia}/involucrados, no aplica a InstanciaComun).
export type Involucrado = {
  codInstancia: number;
  nomInvolucrado: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
};

export function listInvolucrados(codInstancia: number): Promise<Involucrado[]> {
  return apiGet<Involucrado[]>(`/incidencias/${codInstancia}/involucrados`);
}

export function addInvolucrado(codInstancia: number, nomInvolucrado: string): Promise<Involucrado> {
  return apiPost<Involucrado>(`/incidencias/${codInstancia}/involucrados`, { nomInvolucrado });
}

// El permiso real que exige el backend acá es DESACTIVAR_INCIDENCIA (no uno propio de involucrados).
export function removeInvolucrado(codInstancia: number, nomInvolucrado: string): Promise<void> {
  return apiDelete<void>(`/incidencias/${codInstancia}/involucrados/${encodeURIComponent(nomInvolucrado)}`);
}

// GET /incidencias/mis-incidencias — incidencias ACTIVAS del estudiante autenticado (solo ROLE_ESTUDIANTE), mismo criterio que listMisInstancias.
export function listMisIncidencias(params: { page?: number; sort?: string } = {}): Promise<Page<Incidencia>> {
  return apiGet<Page<Incidencia>>("/incidencias/mis-incidencias", params);
}
