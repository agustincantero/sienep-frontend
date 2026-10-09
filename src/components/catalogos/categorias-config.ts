import {
  createCategoriaInstancia,
  deactivateCategoriaInstancia,
  listCategoriasInstancia,
  reactivateCategoriaInstancia,
  updateCategoriaInstancia,
} from "@/lib/categorias-instancia";
import {
  createCategoriaRecordatorio,
  deactivateCategoriaRecordatorio,
  listCategoriasRecordatorio,
  reactivateCategoriaRecordatorio,
  updateCategoriaRecordatorio,
} from "@/lib/categorias-recordatorio";
import type { TabCatalogo } from "@/lib/catalogos-tabs";
import type { Sustantivo } from "./useCatalogo";

// Las dos categorías tienen exactamente el mismo DTO y las mismas reglas en el backend (nombre normalizado y único, descripción opcional, baja bloqueada si está en uso); solo cambian el endpoint, los permisos y los textos.
export type Categoria = {
  idCategoria: number;
  nomCategoria: string;
  descripcion: string | null;
  estado: string;
};

export type CategoriaInput = { nomCategoria: string; descripcion?: string };

export type ConfigCategoria = {
  tab: TabCatalogo;
  sustantivo: Sustantivo;
  permisos: { desactivar: string; reactivar: string };
  // Para qué se usa, en la leyenda del alta/edición.
  uso: string;
  // Qué se pierde al desactivarla, para la confirmación.
  efectoBaja: string;
  listar: (estado: string) => Promise<Categoria[]>;
  crear: (dto: CategoriaInput) => Promise<unknown>;
  editar: (id: number, dto: CategoriaInput) => Promise<unknown>;
  desactivar: (id: number) => Promise<unknown>;
  reactivar: (id: number) => Promise<unknown>;
};

export const CATEGORIAS_INSTANCIA: ConfigCategoria = {
  tab: "categorias-instancia",
  sustantivo: { singular: "Categoría", plural: "categorías de instancia", femenino: true },
  permisos: { desactivar: "DESACTIVAR_CATEGORIA_INSTANCIA", reactivar: "REACTIVAR_CATEGORIA_INSTANCIA" },
  uso: "Tipos de instancia que se ofrecen al registrar una reunión, llamada o coordinación con un estudiante, y en el filtro del listado de instancias.",
  efectoBaja: "Deja de ofrecerse al registrar instancias y en el filtro del listado.",
  listar: listCategoriasInstancia,
  crear: createCategoriaInstancia,
  editar: updateCategoriaInstancia,
  desactivar: deactivateCategoriaInstancia,
  reactivar: reactivateCategoriaInstancia,
};

export const CATEGORIAS_RECORDATORIO: ConfigCategoria = {
  tab: "categorias-recordatorio",
  sustantivo: { singular: "Categoría", plural: "categorías de recordatorio", femenino: true },
  permisos: { desactivar: "DESACTIVAR_CATEGORIA_RECORDATORIO", reactivar: "REACTIVAR_CATEGORIA_RECORDATORIO" },
  uso: "Tipos de recordatorio que se ofrecen al agendar una tarea o aviso. Son independientes de las categorías de instancia.",
  efectoBaja: "Deja de ofrecerse al crear recordatorios.",
  listar: listCategoriasRecordatorio,
  crear: createCategoriaRecordatorio,
  editar: updateCategoriaRecordatorio,
  desactivar: deactivateCategoriaRecordatorio,
  reactivar: reactivateCategoriaRecordatorio,
};
