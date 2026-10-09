import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";

// Forma de GET /categorias-instancias (CategoriaInstanciaResponseDTO). Sin createdAt/updatedAt: el backend no los incluye en este DTO aunque la entidad los tenga.
export type CategoriaInstancia = {
  idCategoria: number;
  nomCategoria: string;
  descripcion: string | null;
  estado: string;
};

// Por defecto solo las ACTIVAS: es lo que necesitan los combos de InstanciaForm y el filtro del listado de instancias. Requiere VER_CATEGORIAS_INSTANCIA, que en el seed actual es exclusivo de ADMINISTRADOR, así que Psicopedagogo/Tutor (que sí pueden crear instancias) van a ver esos combos vacíos hasta que se corrija el rol_permisos del backend.
export function listCategoriasInstancia(estado = "ACTIVO"): Promise<CategoriaInstancia[]> {
  return apiGet<CategoriaInstancia[]>("/categorias-instancias", { estado });
}

// CategoriaInstanciaRequestDTO/UpdateDTO: nomCategoria obligatorio (máx. 50), descripcion opcional (máx. 100). El PUT es un reemplazo total: hay que mandar la descripción aunque no cambie.
export type CategoriaInstanciaInput = {
  nomCategoria: string;
  descripcion?: string;
};

export function createCategoriaInstancia(dto: CategoriaInstanciaInput): Promise<CategoriaInstancia> {
  return apiPost<CategoriaInstancia>("/categorias-instancias", dto);
}

export function updateCategoriaInstancia(id: number, dto: CategoriaInstanciaInput): Promise<CategoriaInstancia> {
  return apiPut<CategoriaInstancia>(`/categorias-instancias/${id}`, dto);
}

// El backend responde 409 si hay instancias activas con esta categoría (RF36: "si no están en uso").
export function deactivateCategoriaInstancia(id: number): Promise<void> {
  return apiDelete<void>(`/categorias-instancias/${id}`);
}

export function reactivateCategoriaInstancia(id: number): Promise<CategoriaInstancia> {
  return apiPatch<CategoriaInstancia>(`/categorias-instancias/${id}/reactivar`);
}
