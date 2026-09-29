import { apiGet } from "./api";

// Forma de GET /categorias-instancias (CategoriaInstanciaResponseDTO). Sin
// createdAt/updatedAt: el backend no los incluye en este DTO aunque la
// entidad los tenga.
export type CategoriaInstancia = {
  idCategoria: number;
  nomCategoria: string;
  descripcion: string | null;
  estado: string;
};

// Solo lectura: el CRUD de categorías (crear/editar/desactivar) queda para
// la futura pantalla de Catálogos (junto con Carreras/Grupos/ITRs), no es
// parte de esta feature. Requiere VER_CATEGORIAS_INSTANCIA — en el seed
// actual (proyecto_schema.sql) ese permiso es exclusivo de ADMINISTRADOR,
// así que Psicopedagogo/Tutor (que sí pueden crear instancias) van a ver
// este combo vacío hasta que se corrija el rol_permisos del lado del
// backend. Documentado en C:\temp\Proyecto\decisiones.md.
export function listCategoriasInstancia(): Promise<CategoriaInstancia[]> {
  return apiGet<CategoriaInstancia[]>("/categorias-instancias", { estado: "ACTIVO" });
}
