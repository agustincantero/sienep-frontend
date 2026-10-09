import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";

// Forma de GET /grupos. Claves del JSON del backend, sin traducir.
export type Group = {
  idGrupo: number;
  nomGrupo: string;
  generacion: number;
  estado: string;
  idCarrera: number;
  nomCarrera: string;
};

// Sin ?estado=, el backend devuelve solo los ACTIVOS — es lo que queremos
// para los checkboxes de asignación y el filtro del listado.
export function listGroups(estado?: string): Promise<Group[]> {
  return apiGet<Group[]>("/grupos", { estado });
}

// GrupoRequestDTO: nomGrupo obligatorio (máx. 60), idCarrera y generacion obligatorios. La generación tiene que ser mayor a 1900 y no posterior al año en curso (GrupoService.validarGeneracion).
export type GroupCreateInput = {
  nomGrupo: string;
  idCarrera: number;
  generacion: number;
};

// GrupoUpdateDTO: la carrera no se puede cambiar una vez creado el grupo.
export type GroupUpdateInput = {
  nomGrupo: string;
  generacion: number;
};

export function createGroup(dto: GroupCreateInput): Promise<Group> {
  return apiPost<Group>("/grupos", dto);
}

export function updateGroup(id: number, dto: GroupUpdateInput): Promise<Group> {
  return apiPut<Group>(`/grupos/${id}`, dto);
}

export function deactivateGroup(id: number): Promise<void> {
  return apiDelete<void>(`/grupos/${id}`);
}

export function reactivateGroup(id: number): Promise<void> {
  return apiPatch<void>(`/grupos/${id}/reactivar`);
}
