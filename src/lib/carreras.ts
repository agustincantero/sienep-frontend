import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";

export type ItrDeCarrera = {
  idItr: number;
  nomItr: string;
};

// Forma de GET /carreras (CarreraResponseDTO). `itrs` trae solo los ITR activos con vínculo activo (CarreraMapper.mapItrsActivos): la relación se administra desde el ITR, acá es de solo lectura.
export type Carrera = {
  idCarrera: number;
  nomCarrera: string;
  estado: string;
  itrs: ItrDeCarrera[] | null;
};

// Sin ?estado=, el backend devuelve solo las ACTIVAS.
export function listCarreras(estado?: string): Promise<Carrera[]> {
  return apiGet<Carrera[]>("/carreras", { estado });
}

// CarreraRequestDTO: nomCarrera obligatorio, máx. 80. Es el único campo editable.
export type CarreraInput = {
  nomCarrera: string;
};

export function createCarrera(dto: CarreraInput): Promise<Carrera> {
  return apiPost<Carrera>("/carreras", dto);
}

export function updateCarrera(id: number, dto: CarreraInput): Promise<Carrera> {
  return apiPut<Carrera>(`/carreras/${id}`, dto);
}

export function deactivateCarrera(id: number): Promise<void> {
  return apiDelete<void>(`/carreras/${id}`);
}

export function reactivateCarrera(id: number): Promise<void> {
  return apiPatch<void>(`/carreras/${id}/reactivar`);
}
