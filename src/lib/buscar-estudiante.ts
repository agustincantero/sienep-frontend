import type { Page, StudentSummary } from "./students";

// Tope de estudiantes que se consultan a la vez cuando el texto coincide con varios; más que eso obliga a acotar la búsqueda.
export const MAX_COINCIDENCIAS = 15;
export const TAMANIO_PAGINA = 20;
// El backend filtra de a un idEstudiante, así que al juntar varias coincidencias se pide un tamaño holgado por estudiante.
const TAMANIO_POR_ESTUDIANTE = 500;

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Estudiantes cuyo nombre y apellido contienen todas las palabras del texto, sin importar mayúsculas, tildes ni el orden; si alguno coincide exacto, solo ese.
export function coincidenciasEstudiante(estudiantes: StudentSummary[], texto: string): StudentSummary[] {
  const consulta = normalizar(texto);
  const palabras = consulta.split(" ").filter(Boolean);
  if (palabras.length === 0) return [];

  const exactos = estudiantes.filter((e) => normalizar(`${e.nombre} ${e.apellido}`) === consulta);
  if (exactos.length > 0) return exactos;

  return estudiantes.filter((e) => {
    const completo = normalizar(`${e.nombre} ${e.apellido}`);
    return palabras.every((p) => completo.includes(p));
  });
}

type ConFecha = { fechaHora: string; codInstancia: number };

// Junta los registros de varios estudiantes en una sola lista, de la más reciente a la más antigua, y devuelve la página pedida.
export async function paginarVariosEstudiantes<T extends ConFecha>(
  ids: number[],
  pedir: (idEstudiante: number, size: number) => Promise<Page<T>>,
  page: number,
): Promise<{ content: T[]; total: number }> {
  const paginas = await Promise.all(ids.map((id) => pedir(id, TAMANIO_POR_ESTUDIANTE)));
  const todas = paginas
    .flatMap((p) => p.content)
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora) || b.codInstancia - a.codInstancia);
  const desde = page * TAMANIO_PAGINA;
  return { content: todas.slice(desde, desde + TAMANIO_PAGINA), total: todas.length };
}
