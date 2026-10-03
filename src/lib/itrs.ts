import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";

// Forma de GET /itrs (ItrResponseDTO). El backend solo manda los NOMBRES de
// las carreras asociadas, no sus id — para resolver el id hay que cruzar
// contra el catálogo de carreras (acá, el que ya se deriva de /grupos, mismo
// criterio que StudentsListView).
export type Itr = {
  idItr: number;
  nomItr: string;
  estado: string;
  carreras: string[];
};

// Sin ?estado=, el backend devuelve solo los ACTIVOS.
export function listItrs(estado?: string): Promise<Itr[]> {
  return apiGet<Itr[]>("/itrs", { estado });
}

// ItrRequestDTO (mismo DTO para alta y edición): nomItr obligatorio (máx. 80) y carrerasIds obligatorio. En la edición la lista REEMPLAZA las asociaciones: una carrera que no venga queda desvinculada, así que mandar [] le saca todas las carreras al ITR.
export type ItrInput = {
  nomItr: string;
  carrerasIds: number[];
};

export function createItr(dto: ItrInput): Promise<Itr> {
  return apiPost<Itr>("/itrs", dto);
}

export function updateItr(id: number, dto: ItrInput): Promise<Itr> {
  return apiPut<Itr>(`/itrs/${id}`, dto);
}

export function deactivateItr(id: number): Promise<void> {
  return apiDelete<void>(`/itrs/${id}`);
}

export function reactivateItr(id: number): Promise<void> {
  return apiPatch<void>(`/itrs/${id}/reactivar`);
}
