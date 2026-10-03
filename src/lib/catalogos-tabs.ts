import { Bell, Building2, Calendar, GraduationCap, Users, type LucideIcon } from "lucide-react";

export type TabCatalogo = "carreras" | "grupos" | "itrs" | "categorias-instancia" | "categorias-recordatorio";

export type DefinicionCatalogo = {
  id: TabCatalogo;
  label: string;
  icon: LucideIcon;
  // Endpoint del backend, para el GET /{id} server-side de la página de edición.
  endpoint: string;
  // "Nueva carrera", "Nuevo grupo": botón del listado y título de la página de alta.
  nuevoLabel: string;
  editarLabel: string;
  permisos: { ver: string; crear: string; editar: string };
};

// Pestañas de /catalogos y los permisos de cada una. Vive fuera de los componentes (que son "use client") porque también lo usan las páginas server-side para decidir si el usuario puede entrar.
// Mismo orden que el prototipo (docs/prototipo.html): la jerarquía académica primero (Carrera → Grupo, ITR → Carreras) y después las dos categorías.
export const TABS_CATALOGO: DefinicionCatalogo[] = [
  {
    id: "carreras",
    label: "Carreras",
    icon: GraduationCap,
    endpoint: "/carreras",
    nuevoLabel: "Nueva carrera",
    editarLabel: "Editar carrera",
    permisos: { ver: "VER_CARRERAS", crear: "CREAR_CARRERA", editar: "EDITAR_CARRERA" },
  },
  {
    id: "grupos",
    label: "Grupos",
    icon: Users,
    endpoint: "/grupos",
    nuevoLabel: "Nuevo grupo",
    editarLabel: "Editar grupo",
    permisos: { ver: "VER_GRUPOS", crear: "CREAR_GRUPO", editar: "EDITAR_GRUPO" },
  },
  {
    id: "itrs",
    label: "ITRs",
    icon: Building2,
    endpoint: "/itrs",
    nuevoLabel: "Nuevo ITR",
    editarLabel: "Editar ITR",
    permisos: { ver: "VER_ITRS", crear: "CREAR_ITR", editar: "EDITAR_ITR" },
  },
  {
    id: "categorias-instancia",
    label: "Categorías de instancia",
    icon: Calendar,
    endpoint: "/categorias-instancias",
    nuevoLabel: "Nueva categoría de instancia",
    editarLabel: "Editar categoría de instancia",
    permisos: { ver: "VER_CATEGORIAS_INSTANCIA", crear: "CREAR_CATEGORIA_INSTANCIA", editar: "EDITAR_CATEGORIA_INSTANCIA" },
  },
  {
    id: "categorias-recordatorio",
    label: "Categorías de recordatorio",
    icon: Bell,
    endpoint: "/categorias-recordatorios",
    nuevoLabel: "Nueva categoría de recordatorio",
    editarLabel: "Editar categoría de recordatorio",
    permisos: {
      ver: "VER_CATEGORIAS_RECORDATORIO",
      crear: "CREAR_CATEGORIA_RECORDATORIO",
      editar: "EDITAR_CATEGORIA_RECORDATORIO",
    },
  },
];

export function buscarCatalogo(id: string | undefined): DefinicionCatalogo | undefined {
  return TABS_CATALOGO.find((t) => t.id === id);
}

// Vuelta al listado en la pestaña correspondiente; con `exito`, el listado muestra ese mensaje al llegar (después de un alta o edición).
export function hrefListado(id: TabCatalogo, exito?: string): string {
  const usp = new URLSearchParams({ tab: id });
  if (exito) usp.set("exito", exito);
  return `/catalogos?${usp.toString()}`;
}
