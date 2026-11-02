// Filtros, orden y página del listado de funcionarios, en la forma en que viajan en la URL
// (/funcionarios?q=ana&estado=Activo&rol=DOCENTE&orden=nombre&pagina=2). Mismo patrón que estudiantes-filtros.ts. Sin imports
// de cliente: lo usa tanto la page (Server Component) como FuncionariosListView.
import type { Funcionario } from "./funcionarios";

export type OrdenFuncionarios = "apellido" | "apellido-desc" | "nombre" | "documento" | "recientes";

function comparar(a: string, b: string): number {
    return a.localeCompare(b, "es", { sensitivity: "base" });
}

// "Más recientes", igual que en estudiantes: por fecha de alta, la más nueva primero. Hoy el API devuelve createdAt
// en null, así que se usa el idUsuario (autoincremental: un id más alto es un alta posterior), que da el mismo orden.
// Si el backend empieza a mandar la fecha, se usa la fecha.
function compararRecientes(a: Funcionario, b: Funcionario): number {
    if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
        return a.createdAt < b.createdAt ? 1 : -1;
    }
    return b.idUsuario - a.idUsuario;
}

// El listado se trae completo y se ordena en el cliente (ver listFuncionariosPorEstados).
export const ORDENES: Record<OrdenFuncionarios, { label: string; comparar: (a: Funcionario, b: Funcionario) => number }> = {
    apellido: {
        label: "Apellido (A-Z)",
        comparar: (a, b) => comparar(a.apellido, b.apellido) || comparar(a.nombre, b.nombre),
    },
    "apellido-desc": {
        label: "Apellido (Z-A)",
        comparar: (a, b) => comparar(b.apellido, a.apellido) || comparar(b.nombre, a.nombre),
    },
    nombre: {
        label: "Nombre (A-Z)",
        comparar: (a, b) => comparar(a.nombre, b.nombre) || comparar(a.apellido, b.apellido),
    },
    documento: {
        label: "Documento",
        comparar: (a, b) => comparar(a.documento, b.documento),
    },
    recientes: {
        label: "Más recientes",
        comparar: compararRecientes,
    },
};

export const ORDEN_POR_DEFECTO: OrdenFuncionarios = "apellido";

export type FiltrosFuncionarios = {
    texto: string;
    // Etiqueta de ESTADOS_FUNCIONARIO ("Activo", ...), "" = todos.
    estado: string;
    // Nombre del rol (ej. "DOCENTE"), "" = todos. Se filtra en el cliente.
    rol: string;
    orden: OrdenFuncionarios;
    pagina: number;
};

export const FILTROS_POR_DEFECTO: FiltrosFuncionarios = {
    texto: "",
    estado: "",
    rol: "",
    orden: ORDEN_POR_DEFECTO,
    pagina: 0,
};

// Copia de las etiquetas de ESTADOS_FUNCIONARIO, para validar lo que llega por la URL.
const ESTADOS_VALIDOS = new Set(["Activo", "Pendiente", "Inactivo"]);

type Fuente = URLSearchParams | Record<string, string | string[] | undefined>;

function valor(fuente: Fuente, clave: string): string {
    const v = fuente instanceof URLSearchParams ? fuente.get(clave) : fuente[clave];
    return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

// Lo que viene en la URL lo escribe cualquiera: lo que no es válido se ignora y queda el valor por defecto.
export function leerFiltros(fuente: Fuente): FiltrosFuncionarios {
    const orden = valor(fuente, "orden");
    const estado = valor(fuente, "estado");
    const pagina = Number(valor(fuente, "pagina"));
    return {
        texto: valor(fuente, "q"),
        estado: ESTADOS_VALIDOS.has(estado) ? estado : "",
        rol: valor(fuente, "rol"),
        orden: orden in ORDENES ? (orden as OrdenFuncionarios) : ORDEN_POR_DEFECTO,
        // En la URL la página va desde 1; internamente desde 0.
        pagina: Number.isInteger(pagina) && pagina > 1 ? pagina - 1 : 0,
    };
}

// Query string sin los valores por defecto, para que la URL del listado "limpio" quede como /funcionarios.
export function aQuery(f: FiltrosFuncionarios): string {
    const usp = new URLSearchParams();
    if (f.texto) usp.set("q", f.texto);
    if (f.estado) usp.set("estado", f.estado);
    if (f.rol) usp.set("rol", f.rol);
    if (f.orden !== ORDEN_POR_DEFECTO) usp.set("orden", f.orden);
    if (f.pagina > 0) usp.set("pagina", String(f.pagina + 1));
    return usp.toString();
}

export function hayFiltrosActivos(f: FiltrosFuncionarios): boolean {
    return aQuery(f) !== "";
}
