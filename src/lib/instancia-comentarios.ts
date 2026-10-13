import { apiDelete, apiGet, apiPost, apiPut } from "./api";
import type { Page } from "./students";

// Comentarios sobre una Instancia (normal o confidencial) — el backend los expone sobre /instancias/{codInstancia}/comentarios-*, y funciona igual para InstanciaComun e Incidencia. Vive en su propio archivo porque lo usan las dos fichas.
export type ComentarioInstancia = {
  codInstancia: number;
  // null en un comentario ELIMINADO: el backend lo sigue listando como marca en el seguimiento, sin su texto.
  contenido: string | null;
  idAutor: number;
  nombreAutor: string;
  estado: string;
  // true si el contenido se modificó después de creado (solo lo informan los comentarios normales).
  editado?: boolean;
  createdAt: string;
  // Fecha de la última edición o, si está ELIMINADO, de la eliminación.
  updatedAt: string;
};

export type ComentarioNormalInstancia = ComentarioInstancia & { idComentario: number };
export type ComentarioConfidencialInstancia = ComentarioInstancia & { idComConfidencial: number };

export function listComentariosNormales(
  codInstancia: number,
  page = 0,
): Promise<Page<ComentarioNormalInstancia>> {
  return apiGet<Page<ComentarioNormalInstancia>>(
    `/instancias/${codInstancia}/comentarios-normales`,
    { page },
  );
}

export function crearComentarioNormal(
  codInstancia: number,
  contenido: string,
): Promise<ComentarioNormalInstancia> {
  return apiPost<ComentarioNormalInstancia>(`/instancias/${codInstancia}/comentarios-normales`, {
    contenido,
  });
}

export function editarComentarioNormal(
  codInstancia: number,
  idComentario: number,
  contenido: string,
): Promise<ComentarioNormalInstancia> {
  return apiPut<ComentarioNormalInstancia>(
    `/instancias/${codInstancia}/comentarios-normales/${idComentario}`,
    { contenido },
  );
}

// Baja lógica: el comentario pasa a ELIMINADO y se sigue listando, sin su texto, como marca de que existió.
export function eliminarComentarioNormal(codInstancia: number, idComentario: number): Promise<void> {
  return apiDelete(`/instancias/${codInstancia}/comentarios-normales/${idComentario}`);
}

export function listComentariosConfidenciales(
  codInstancia: number,
  page = 0,
): Promise<Page<ComentarioConfidencialInstancia>> {
  return apiGet<Page<ComentarioConfidencialInstancia>>(
    `/instancias/${codInstancia}/comentarios-confidenciales`,
    { page },
  );
}

export function crearComentarioConfidencial(
  codInstancia: number,
  contenido: string,
): Promise<ComentarioConfidencialInstancia> {
  return apiPost<ComentarioConfidencialInstancia>(
    `/instancias/${codInstancia}/comentarios-confidenciales`,
    { contenido },
  );
}
