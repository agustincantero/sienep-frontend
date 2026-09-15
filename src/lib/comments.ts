import { apiGet, apiPost } from "./api";
import type { Page } from "./students";

// Mismo shape para ComentarioNormalEstudianteResponseDTO y
// ComentarioConfidencialEstudianteResponseDTO — el backend los expone como
// dos recursos separados (permisos, endpoints y tablas distintas) pero con
// idéntico contrato, así que del lado del cliente alcanza con un solo tipo.
//
// Sin editar() ni eliminar(): un comentario es historia de seguimiento del
// estudiante, no se corrige en el lugar — se corrige citándolo desde uno
// nuevo (ver StudentCommentsPanel). El backend sí expone PUT/DELETE en estos
// dos recursos, pero el frontend deliberadamente no los usa.
export type StudentComment = {
  id: number;
  contenido: string;
  estado: string;
  idEstudiante: number;
  idAutor: number;
  nombreAutor: string;
  createdAt: string;
  updatedAt: string;
};

// GET /comentarios-normales-estudiante?idEstudiante=X — solo trae comentarios
// ACTIVO (el backend ya filtra la baja lógica). Funcionarios necesitan
// idEstudiante; un estudiante autenticado ve los suyos aunque no lo mande.
export function listNormalComments(idEstudiante: number, page = 0): Promise<Page<StudentComment>> {
  return apiGet<Page<StudentComment>>("/comentarios-normales-estudiante", { idEstudiante, page });
}

export function createNormalComment(idEstudiante: number, contenido: string): Promise<StudentComment> {
  return apiPost<StudentComment>("/comentarios-normales-estudiante", { idEstudiante, contenido });
}

// Mismo contrato que arriba, pero /comentarios-confidenciales-estudiante:
// requiere permisos separados (VER/CREAR_COMENTARIO_CONFIDENCIAL_ESTUDIANTE)
// y siempre exige idEstudiante (no hay resolución automática para estudiante
// autenticado, porque un estudiante nunca tiene ese permiso).
export function listConfidentialComments(idEstudiante: number, page = 0): Promise<Page<StudentComment>> {
  return apiGet<Page<StudentComment>>("/comentarios-confidenciales-estudiante", { idEstudiante, page });
}

export function createConfidentialComment(idEstudiante: number, contenido: string): Promise<StudentComment> {
  return apiPost<StudentComment>("/comentarios-confidenciales-estudiante", { idEstudiante, contenido });
}
