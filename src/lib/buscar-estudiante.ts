import { apiGet } from "./api";
import { listStudents, type Page, type StudentSummary } from "./students";

// Tope de estudiantes que se consultan a la vez cuando el texto coincide con varios; más que eso obliga a acotar la búsqueda.
export const MAX_COINCIDENCIAS = 15;
export const TAMANIO_PAGINA = 20;
// El backend filtra de a un idEstudiante, así que al juntar varias coincidencias se pide un tamaño holgado por estudiante.
const TAMANIO_POR_ESTUDIANTE = 500;

// Sin mayúsculas, tildes ni espacios repetidos: base de todas las búsquedas de texto del front, porque el backend (LIKE por campo) distingue tildes y no acepta "Nombre Apellido".
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Persona mínima para buscar: sirve tanto para estudiantes como para funcionarios.
export type Persona = Pick<StudentSummary, "idUsuario" | "nombre" | "apellido" | "documento">;

// Todas las palabras del texto aparecen en alguno de los campos (sin importar mayúsculas, tildes ni orden), así "ines perez", "Pérez Inés" y "per" encuentran a "Inés Pérez".
export function coincideTexto(texto: string, ...campos: (string | null | undefined)[]): boolean {
  const palabras = normalizar(texto).split(" ").filter(Boolean);
  if (palabras.length === 0) return true;
  const completo = normalizar(campos.filter(Boolean).join(" "));
  return palabras.every((p) => completo.includes(p));
}

// Personas que coinciden con el texto (nombre, apellido o documento); si alguna coincide exacto con "Nombre Apellido", "Apellido Nombre" o el documento, solo esa.
export function coincidenciasPersona<T extends Persona>(personas: T[], texto: string): T[] {
  const consulta = normalizar(texto);
  if (!consulta) return [];

  const exactos = personas.filter((p) => {
    const nombre = normalizar(`${p.nombre} ${p.apellido}`);
    const invertido = normalizar(`${p.apellido} ${p.nombre}`);
    return consulta === nombre || consulta === invertido || consulta === normalizar(p.documento ?? "");
  });
  if (exactos.length > 0) return exactos;

  return personas.filter((p) => coincideTexto(consulta, p.nombre, p.apellido, p.documento));
}

// Se mantiene el nombre original para los listados de instancias e incidencias.
export const coincidenciasEstudiante = coincidenciasPersona<StudentSummary>;

// Tope por pedido al traer todos los registros para filtrar en el cliente (el backend no admite más sin paginar).
export const TOPE_LISTADO = 1000;
const VIGENCIA_MS = 30_000;

// Memoriza el pedido unos segundos (compartido entre buscadores); si falla no se guarda y el próximo intento vuelve a pedir.
function conVigencia<T>(pedir: () => Promise<T>): () => Promise<T> {
  let guardado: { cuando: number; pedido: Promise<T> } | null = null;
  return () => {
    if (guardado && Date.now() - guardado.cuando < VIGENCIA_MS) return guardado.pedido;
    const pedido = pedir();
    const actual = { cuando: Date.now(), pedido };
    guardado = actual;
    pedido.catch(() => {
      if (guardado === actual) guardado = null;
    });
    return pedido;
  };
}

// Todos los estudiantes (hasta TOPE_LISTADO).
export const todosLosEstudiantes = conVigencia(() => listStudents({ size: TOPE_LISTADO }).then((p) => p.content));

// Sin `estado` el backend lista solo los ACTIVOS; los autores de auditoría pueden estar dados de baja, así que se piden ambos estados y se juntan.
const ESTADOS_AUTOR = ["ACTIVO", "INACTIVO"];

// Se deduplica por idUsuario: sin VER_ESTUDIANTE el backend ignora `estado` y fuerza ACTIVO, así que ambas llamadas traerían la misma lista.
function todosLosEstados(ruta: string): Promise<Persona[]> {
  return Promise.all(ESTADOS_AUTOR.map((estado) => apiGet<Page<Persona>>(ruta, { size: TOPE_LISTADO, estado }))).then((paginas) => [
    ...new Map(paginas.flatMap((p) => p.content).map((p) => [p.idUsuario, p])).values(),
  ]);
}

// Estudiantes activos e inactivos (hasta TOPE_LISTADO por estado), para resolver autores de auditoría; sin VER_ESTUDIANTE el backend devuelve solo los ACTIVOS (no da 403).
export const todosLosEstudiantesConInactivos = conVigencia(() => todosLosEstados("/estudiantes"));

// Funcionarios activos e inactivos (hasta TOPE_LISTADO por estado); da 403 si quien consulta no tiene permiso para verlos.
export const todosLosFuncionarios = conVigencia(() => todosLosEstados("/funcionarios"));

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

// Para listados que el backend ya devuelve de más reciente a más antiguo y filtra de a un id: de cada id basta con las primeras (page + 1) * TAMANIO_PAGINA filas para armar la página pedida, y el total es la suma de los totales, así que no hay tope de registros por id.
export async function paginarMezclado<T extends { fechaHora: string }>(
  ids: number[],
  pedir: (id: number, size: number) => Promise<Page<T>>,
  page: number,
  desempate: (fila: T) => number,
): Promise<{ content: T[]; total: number }> {
  const necesarias = (page + 1) * TAMANIO_PAGINA;
  const paginas = await Promise.all(ids.map((id) => pedir(id, necesarias)));
  const mezcladas = paginas
    .flatMap((p) => p.content)
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora) || desempate(b) - desempate(a));
  const desde = page * TAMANIO_PAGINA;
  return {
    content: mezcladas.slice(desde, desde + TAMANIO_PAGINA),
    total: paginas.reduce((suma, p) => suma + p.totalElements, 0),
  };
}
