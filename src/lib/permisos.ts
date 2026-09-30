import { apiGet } from "./api";

// Forma de GET /permisos (PermisoResponseDTO). Catálogo inmutable: no hay alta/baja vía API, solo PUT /permisos/{id} para editar la descripción (fuera del alcance de la pantalla de roles).
export type Permiso = {
  idPermiso: number;
  nombre: string;
  descripcion: string;
  estado: string;
};

// Sin filtro por estado: PermisoService.listar() siempre devuelve el catálogo completo (activos e inactivos), a diferencia de /roles que por defecto solo trae ACTIVOS.
export function listPermisos(): Promise<Permiso[]> {
  return apiGet<Permiso[]>("/permisos");
}

// Agrupa el catálogo de permisos por dominio, en el mismo orden en que aparecen comentados en proyecto_schema.sql. Se arma por nombre exacto (no por prefijo/sufijo) porque varios dominios comparten substrings (INSTANCIA e INSTANCIAS aparecen en dominios distintos): una regla por substring pisaría categorías. Un permiso nuevo que el backend agregue y todavía no esté mapeado acá cae en "Otros" en vez de desaparecer de la pantalla.
const CATEGORIA_DE_PERMISO: Record<string, string> = {};
function registrarCategoria(categoria: string, nombres: string[]) {
  for (const nombre of nombres) CATEGORIA_DE_PERMISO[nombre] = categoria;
}

registrarCategoria("Funcionarios", [
  "VER_FUNCIONARIOS",
  "CREAR_FUNCIONARIO",
  "EDITAR_FUNCIONARIO",
  "DESACTIVAR_FUNCIONARIO",
  "REACTIVAR_FUNCIONARIO",
]);
registrarCategoria("Roles", ["VER_ROLES", "CREAR_ROL", "EDITAR_ROL", "DESACTIVAR_ROL", "REACTIVAR_ROL"]);
registrarCategoria("Estudiantes", [
  "VER_ESTUDIANTE",
  "VER_ESTUDIANTE_RESUMIDO",
  "CREAR_ESTUDIANTE",
  "EDITAR_ESTUDIANTE",
  "DESACTIVAR_ESTUDIANTE",
  "BUSCAR_ESTUDIANTE",
  "REACTIVAR_ESTUDIANTE",
]);
registrarCategoria("Adjuntos", ["VER_INFORME", "ADJUNTAR_INFORME", "ELIMINAR_INFORME"]);
registrarCategoria("Instancias", [
  "VER_INSTANCIAS",
  "CREAR_INSTANCIA",
  "EDITAR_INSTANCIA",
  "DESACTIVAR_INSTANCIA",
  "REACTIVAR_INSTANCIA",
  "VER_BLOQUE_CONFIDENCIAL",
]);
registrarCategoria("Recordatorios", [
  "VER_RECORDATORIOS",
  "CREAR_RECORDATORIO",
  "EDITAR_RECORDATORIO",
  "DESACTIVAR_RECORDATORIO",
  "REACTIVAR_RECORDATORIO",
]);
registrarCategoria("Incidencias", [
  "CREAR_INCIDENCIA",
  "VER_INCIDENCIAS",
  "EDITAR_INCIDENCIA",
  "DESACTIVAR_INCIDENCIA",
  "REACTIVAR_INCIDENCIA",
]);
registrarCategoria("Reportes", ["VER_REPORTES", "EXPORTAR_REPORTES"]);
registrarCategoria("Categorías de instancia", [
  "VER_CATEGORIAS_INSTANCIA",
  "CREAR_CATEGORIA_INSTANCIA",
  "EDITAR_CATEGORIA_INSTANCIA",
  "DESACTIVAR_CATEGORIA_INSTANCIA",
  "REACTIVAR_CATEGORIA_INSTANCIA",
]);
registrarCategoria("Categorías de recordatorio", [
  "VER_CATEGORIAS_RECORDATORIO",
  "CREAR_CATEGORIA_RECORDATORIO",
  "EDITAR_CATEGORIA_RECORDATORIO",
  "DESACTIVAR_CATEGORIA_RECORDATORIO",
  "REACTIVAR_CATEGORIA_RECORDATORIO",
]);
registrarCategoria("Permisos y auditoría", ["VER_PERMISOS", "EDITAR_PERMISO", "VER_AUDITORIA"]);
registrarCategoria("Comentarios de estudiante", [
  "VER_COMENTARIO_NORMAL_ESTUDIANTE",
  "VER_COMENTARIO_CONFIDENCIAL_ESTUDIANTE",
  "CREAR_COMENTARIO_NORMAL_ESTUDIANTE",
  "CREAR_COMENTARIO_CONFIDENCIAL_ESTUDIANTE",
  "EDITAR_COMENTARIO_NORMAL_ESTUDIANTE",
  "EDITAR_COMENTARIO_CONFIDENCIAL_ESTUDIANTE",
  "ELIMINAR_COMENTARIO_NORMAL_ESTUDIANTE",
  "ELIMINAR_COMENTARIO_CONFIDENCIAL_ESTUDIANTE",
]);
registrarCategoria("Comentarios de instancia", [
  "VER_COMENTARIO_NORMAL_INSTANCIA",
  "VER_COMENTARIO_CONFIDENCIAL_INSTANCIA",
  "CREAR_COMENTARIO_NORMAL_INSTANCIA",
  "CREAR_COMENTARIO_CONFIDENCIAL_INSTANCIA",
  "EDITAR_COMENTARIO_NORMAL_INSTANCIA",
  "EDITAR_COMENTARIO_CONFIDENCIAL_INSTANCIA",
  "ELIMINAR_COMENTARIO_NORMAL_INSTANCIA",
  "ELIMINAR_COMENTARIO_CONFIDENCIAL_INSTANCIA",
]);
registrarCategoria("Grupos", ["CREAR_GRUPO", "VER_GRUPOS", "EDITAR_GRUPO", "DESACTIVAR_GRUPO", "REACTIVAR_GRUPO"]);
registrarCategoria("Carreras", ["VER_CARRERAS", "CREAR_CARRERA", "EDITAR_CARRERA", "DESACTIVAR_CARRERA", "REACTIVAR_CARRERA"]);
registrarCategoria("ITRs", ["VER_ITRS", "CREAR_ITR", "EDITAR_ITR", "DESACTIVAR_ITR", "REACTIVAR_ITR"]);

const ORDEN_CATEGORIAS = [
  "Funcionarios",
  "Roles",
  "Estudiantes",
  "Adjuntos",
  "Instancias",
  "Recordatorios",
  "Incidencias",
  "Reportes",
  "Categorías de instancia",
  "Categorías de recordatorio",
  "Permisos y auditoría",
  "Comentarios de estudiante",
  "Comentarios de instancia",
  "Grupos",
  "Carreras",
  "ITRs",
  "Otros",
];

export type GrupoDePermisos = { categoria: string; permisos: Permiso[] };

// Agrupa y ordena para el render del formulario; solo incluye categorías que tengan al menos un permiso.
export function agruparPermisos(permisos: Permiso[]): GrupoDePermisos[] {
  const porCategoria = new Map<string, Permiso[]>();
  for (const permiso of permisos) {
    const categoria = CATEGORIA_DE_PERMISO[permiso.nombre] ?? "Otros";
    const lista = porCategoria.get(categoria) ?? [];
    lista.push(permiso);
    porCategoria.set(categoria, lista);
  }
  return ORDEN_CATEGORIAS.filter((c) => porCategoria.has(c)).map((categoria) => ({
    categoria,
    permisos: porCategoria.get(categoria)!,
  }));
}
