import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";

// ADMINISTRADOR y ESTUDIANTE son roles base del sistema (RolService.ROLES_PROTEGIDOS en el backend): ni editar ni desactivar están permitidos, el backend responde 403 igual si se intenta. ESTUDIANTE está protegido porque CustomUsuarioDetailsService/LoginUsuarioDetailsService asumen ese nombre exacto para armar las authorities de cualquier estudiante autenticado.
export const ROLES_PROTEGIDOS = new Set(["ADMINISTRADOR", "ESTUDIANTE"]);

export function esRolProtegido(nombre: string): boolean {
  return ROLES_PROTEGIDOS.has(nombre.toUpperCase());
}

// Mismo criterio que RolService.crear()/editar() en el backend: sin este mapeo previo, un nombre tipeado "Coordinador General" se guarda igual como "COORDINADOR_GENERAL", pero mostrarlo así desde antes de guardar evita la sorpresa de ver el nombre "cambiado" después de crear el rol.
export function normalizarNombreRol(nombre: string): string {
  return nombre.trim().toUpperCase().replace(/\s+/g, "_");
}

export type PermisoDeRol = {
  idPermiso: number;
  nombre: string;
};

// GET /roles y GET /roles/{id} (RolResponseDTO). `descripcion` viene null en los roles sembrados sin descripción (rol_descripcion es nullable en el schema).
export type Rol = {
  idRol: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
  permisos: PermisoDeRol[];
};

export type RolListParams = {
  estado?: string;
};

// Sin ?estado=, el backend devuelve solo los ACTIVOS.
export function listRoles(params: RolListParams = {}): Promise<Rol[]> {
  return apiGet<Rol[]>("/roles", params);
}

export function getRole(id: number): Promise<Rol> {
  return apiGet<Rol>(`/roles/${id}`);
}

// RolRequestDTO: nombre requerido (máx. 50), descripcion opcional (máx. 100), permisosIds opcional.
export type RolCreateInput = {
  nombre: string;
  descripcion?: string;
  permisosIds?: number[];
};

// RolUpdateDTO: mismos campos, pero acá enviar `permisosIds: []` es explícito "sacale todos los permisos al rol" (el backend lo distingue de `undefined`, que no toca los permisos existentes).
export type RolUpdateInput = {
  nombre: string;
  descripcion?: string;
  permisosIds?: number[];
};

export function createRole(dto: RolCreateInput): Promise<Rol> {
  return apiPost<Rol>("/roles", dto);
}

export function updateRole(id: number, dto: RolUpdateInput): Promise<Rol> {
  return apiPut<Rol>(`/roles/${id}`, dto);
}

// Baja lógica: el backend nunca borra el rol, solo cambia el estado a INACTIVO.
export function deactivateRole(id: number): Promise<void> {
  return apiDelete<void>(`/roles/${id}`);
}

export function reactivateRole(id: number): Promise<Rol> {
  return apiPatch<Rol>(`/roles/${id}/reactivar`);
}
