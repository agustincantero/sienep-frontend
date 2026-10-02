// Filtros, orden y página del listado de estudiantes (RF08), en la forma en que viajan en la URL
// (/estudiantes?q=ana&carrera=LTI&orden=recientes&pagina=2). Sin imports de cliente: lo usa tanto la page
// (Server Component, para arrancar con los filtros de la URL) como StudentsListView.

export type OrdenEstudiantes = "apellido" | "apellido-desc" | "nombre" | "documento" | "recientes";

// sort: formato de Spring Data ("campo,asc|desc") sobre atributos de la entidad Estudiante.
export const ORDENES: Record<OrdenEstudiantes, { label: string; sort: string }> = {
  apellido: { label: "Apellido (A-Z)", sort: "apellido,asc" },
  "apellido-desc": { label: "Apellido (Z-A)", sort: "apellido,desc" },
  nombre: { label: "Nombre (A-Z)", sort: "nombre,asc" },
  documento: { label: "Documento", sort: "documento,asc" },
  recientes: { label: "Más recientes", sort: "estudianteCreatedAt,desc" },
};

export const ORDEN_POR_DEFECTO: OrdenEstudiantes = "apellido";

export const ESTADOS: Record<string, string> = {
  Activo: "ACTIVO",
  Inactivo: "INACTIVO",
  Pendiente: "PENDIENTE_DE_ACTIVACION",
};

export type FiltrosEstudiantes = {
  texto: string;
  // Grupo y carrera viajan por nombre (no por id): la URL queda legible y el listado ya los resuelve a id.
  grupo: string;
  carrera: string;
  // Etiqueta de ESTADOS ("Activo", ...), "" = todos.
  estado: string;
  orden: OrdenEstudiantes;
  pagina: number;
};

export const FILTROS_POR_DEFECTO: FiltrosEstudiantes = {
  texto: "",
  grupo: "",
  carrera: "",
  estado: "",
  orden: ORDEN_POR_DEFECTO,
  pagina: 0,
};

type Fuente = URLSearchParams | Record<string, string | string[] | undefined>;

function valor(fuente: Fuente, clave: string): string {
  const v = fuente instanceof URLSearchParams ? fuente.get(clave) : fuente[clave];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

// Lo que viene en la URL lo escribe cualquiera: lo que no es válido (orden o estado desconocidos, página
// negativa) se ignora y queda el valor por defecto.
export function leerFiltros(fuente: Fuente): FiltrosEstudiantes {
  const orden = valor(fuente, "orden");
  const estado = valor(fuente, "estado");
  const pagina = Number(valor(fuente, "pagina"));
  return {
    texto: valor(fuente, "q"),
    grupo: valor(fuente, "grupo"),
    carrera: valor(fuente, "carrera"),
    estado: estado in ESTADOS ? estado : "",
    orden: orden in ORDENES ? (orden as OrdenEstudiantes) : ORDEN_POR_DEFECTO,
    // En la URL la página va desde 1 (más natural de leer); internamente desde 0, como la API.
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina - 1 : 0,
  };
}

// Query string sin los valores por defecto, para que la URL del listado "limpio" quede como /estudiantes.
export function aQuery(f: FiltrosEstudiantes): string {
  const usp = new URLSearchParams();
  if (f.texto) usp.set("q", f.texto);
  if (f.grupo) usp.set("grupo", f.grupo);
  if (f.carrera) usp.set("carrera", f.carrera);
  if (f.estado) usp.set("estado", f.estado);
  if (f.orden !== ORDEN_POR_DEFECTO) usp.set("orden", f.orden);
  if (f.pagina > 0) usp.set("pagina", String(f.pagina + 1));
  return usp.toString();
}

export function hayFiltrosActivos(f: FiltrosEstudiantes): boolean {
  return aQuery(f) !== "";
}
