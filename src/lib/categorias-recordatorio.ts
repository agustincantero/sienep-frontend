import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";

// Forma de GET /categorias-recordatorios (CategoriaRecordatorioResponseDTO). Catálogo propio, distinto del de categorías de instancia aunque algunos nombres coincidan.
export type CategoriaRecordatorio = {
  idCategoria: number;
  nomCategoria: string;
  descripcion: string | null;
  estado: string;
};

// Sin ?estado=, el backend devuelve solo las ACTIVAS.
export function listCategoriasRecordatorio(estado?: string): Promise<CategoriaRecordatorio[]> {
  return apiGet<CategoriaRecordatorio[]>("/categorias-recordatorios", { estado });
}

// CategoriaRecordatorioRequestDTO/UpdateDTO: nomCategoria obligatorio (máx. 50), descripcion opcional (máx. 100). El PUT es un reemplazo total: hay que mandar la descripción aunque no cambie.
export type CategoriaRecordatorioInput = {
  nomCategoria: string;
  descripcion?: string;
};

export function createCategoriaRecordatorio(dto: CategoriaRecordatorioInput): Promise<CategoriaRecordatorio> {
  return apiPost<CategoriaRecordatorio>("/categorias-recordatorios", dto);
}

export function updateCategoriaRecordatorio(id: number, dto: CategoriaRecordatorioInput): Promise<CategoriaRecordatorio> {
  return apiPut<CategoriaRecordatorio>(`/categorias-recordatorios/${id}`, dto);
}

// El backend responde 409 si hay recordatorios activos con esta categoría (RF39: "si no están en uso").
export function deactivateCategoriaRecordatorio(id: number): Promise<void> {
  return apiDelete<void>(`/categorias-recordatorios/${id}`);
}

export function reactivateCategoriaRecordatorio(id: number): Promise<CategoriaRecordatorio> {
  return apiPatch<CategoriaRecordatorio>(`/categorias-recordatorios/${id}/reactivar`);
}
