import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";
import type { Page } from "./students";

// Ficha/fila de Incidencia — GET /incidencias, GET /incidencias/{id}
// (IncidenciaResponseDTO). Mismos campos planos que InstanciaComun (ambas
// heredan de Instancia en el backend) más `lugar`; sin categoría ni
// recordatorioCreado, que son propios de InstanciaComun.
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
};

export function listIncidencias(params: IncidenciaListParams = {}): Promise<Page<Incidencia>> {
  return apiGet<Page<Incidencia>>("/incidencias", params);
}

export function getIncidencia(id: number): Promise<Incidencia> {
  return apiGet<Incidencia>(`/incidencias/${id}`);
}

// El backend reusa un solo DTO (IncidenciaRequestDTO) para alta y edición —
// a diferencia de InstanciaComun, acá idEstudiante SÍ es editable (el
// service lo re-resuelve y re-valida en editar()).
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

// Involucrados — sub-recurso exclusivo de Incidencia (el backend lo monta
// solo bajo /incidencias/{codInstancia}/involucrados, no aplica a
// InstanciaComun), por eso vive acá y no en lib/instancia-comentarios.ts.
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

// El permiso real que exige el backend acá es DESACTIVAR_INCIDENCIA (no uno
// propio de involucrados) — ver InvolucradoController en el backend.
export function removeInvolucrado(codInstancia: number, nomInvolucrado: string): Promise<void> {
  return apiDelete<void>(`/incidencias/${codInstancia}/involucrados/${encodeURIComponent(nomInvolucrado)}`);
}
