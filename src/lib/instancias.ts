import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";
import type { Page } from "./students";

// Ficha/fila de InstanciaComun — GET /instancias, GET /instancias/{id}
// (InstanciaComunResponseDTO). El backend devuelve las asociaciones
// aplanadas (idEstudiante + nombreEstudiante, nunca un objeto anidado),
// mismo criterio que EstudianteResponseDTO — se modela igual acá.
// Sin recordatorioCreado: solo viene poblado cuando se manda
// recordatorioInicial en el alta, y esa integración queda fuera de esta
// rama (ver decisiones.md).
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

// Sin ?estado=, el backend devuelve solo las ACTIVAS (igual que /estudiantes
// sin filtro de estado) — no hace falta replicar ese default acá.
export function listInstancias(params: InstanciaListParams = {}): Promise<Page<InstanciaComun>> {
  return apiGet<Page<InstanciaComun>>("/instancias", params);
}

export function getInstancia(codInstancia: number): Promise<InstanciaComun> {
  return apiGet<InstanciaComun>(`/instancias/${codInstancia}`);
}

// Datos de alta — subconjunto de InstanciaComunRequestDTO: sin
// recordatorioInicial (ver decisiones.md, queda para cuando exista el
// módulo de Recordatorios en el frontend).
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
