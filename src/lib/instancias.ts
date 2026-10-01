import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";
import type { Page } from "./students";

// Ficha/fila de InstanciaComun — GET /instancias, GET /instancias/{id} (InstanciaComunResponseDTO). El backend devuelve las asociaciones aplanadas (idEstudiante + nombreEstudiante, nunca un objeto anidado), mismo criterio que EstudianteResponseDTO.
export type InstanciaComun = {
  codInstancia: number;
  idNegInstancia: string | null;
  titulo: string;
  fechaHora: string;
  canal: string | null;
  idEstudiante: number;
  nombreEstudiante: string;
  idFuncionario: number;
  nombreFuncionario: string;
  idCategoria: number;
  nombreCategoria: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
};

export type InstanciaListParams = {
  idEstudiante?: number;
  idFuncionario?: number;
  idCategoria?: number;
  estado?: string;
  page?: number;
};

// Sin ?estado=, el backend devuelve solo las ACTIVAS (igual que /estudiantes sin filtro de estado).
export function listInstancias(params: InstanciaListParams = {}): Promise<Page<InstanciaComun>> {
  return apiGet<Page<InstanciaComun>>("/instancias", params);
}

export function getInstancia(codInstancia: number): Promise<InstanciaComun> {
  return apiGet<InstanciaComun>(`/instancias/${codInstancia}`);
}

// Datos de alta — subconjunto de InstanciaComunRequestDTO: sin recordatorioInicial (no hay módulo de Recordatorios en el frontend todavía).
export type InstanciaComunCreateInput = {
  titulo: string;
  fechaHora: string;
  idEstudiante: number;
  canal?: string;
  idCategoria: number;
};

// InstanciaComunUpdateDTO no acepta idEstudiante: el estudiante de una
// instancia es inmutable después de creada.
export type InstanciaComunUpdateInput = Omit<InstanciaComunCreateInput, "idEstudiante">;

export function createInstancia(dto: InstanciaComunCreateInput): Promise<InstanciaComun> {
  return apiPost<InstanciaComun>("/instancias", dto);
}

export function updateInstancia(
  codInstancia: number,
  dto: InstanciaComunUpdateInput,
): Promise<InstanciaComun> {
  return apiPut<InstanciaComun>(`/instancias/${codInstancia}`, dto);
}

// Baja lógica: el backend nunca borra la instancia, solo cambia el estado a
// INACTIVO (mismo criterio que deactivateStudent en lib/students.ts).
export function deactivateInstancia(codInstancia: number): Promise<void> {
  return apiDelete<void>(`/instancias/${codInstancia}`);
}

export function reactivateInstancia(codInstancia: number): Promise<InstanciaComun> {
  return apiPatch<InstanciaComun>(`/instancias/${codInstancia}/reactivar`);
}

// GET /instancias/mis-instancias — instancias ACTIVAS del estudiante autenticado (solo ROLE_ESTUDIANTE). El estudiante no tiene VER_INSTANCIAS, así que no puede abrir GET /instancias/{id}: este listado es todo lo que ve de ellas.
export function listMisInstancias(params: { page?: number; sort?: string } = {}): Promise<Page<InstanciaComun>> {
  return apiGet<Page<InstanciaComun>>("/instancias/mis-instancias", params);
}
