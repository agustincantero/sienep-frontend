import { apiGet, apiPost } from "./api";
import type { Page } from "./students";

// Comentarios sobre una Instancia (normal o confidencial) — el backend los expone sobre /instancias/{codInstancia}/comentarios-*, y funciona igual para InstanciaComun e Incidencia. Vive en su propio archivo porque lo usan las dos fichas.
export type ComentarioInstancia = {
  codInstancia: number;
  contenido: string;
  idAutor: number;
  nombreAutor: string;
  estado: string;
  createdAt: string;
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
