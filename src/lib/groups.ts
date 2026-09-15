import { apiGet } from "./api";

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
export function listGroups(): Promise<Group[]> {
  return apiGet<Group[]>("/grupos");
}
