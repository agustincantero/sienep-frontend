import {
  Archive,
  BarChart3,
  Bell,
  Calendar,
  Library,
  Shield,
  TriangleAlert,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  // El ítem se muestra si el usuario tiene AL MENOS UNO de estos permisos.
  // Sin `permisos` -> visible siempre (ítems self-service del estudiante).
  // Nombres tomados de proyecto_schema.sql (proyecto.permisos).
  permisos?: string[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const FUNCIONARIO_NAV: NavGroup[] = [
  {
    label: "Trabajo diario",
    items: [
      {
        key: "estudiantes",
        href: "/estudiantes",
        icon: User,
        title: "Estudiantes",
        desc: "Buscar, ver fichas y gestionar estudiantes.",
        permisos: ["VER_ESTUDIANTE", "VER_ESTUDIANTE_RESUMIDO", "BUSCAR_ESTUDIANTE"],
      },
      {
        key: "instancias",
        href: "/instancias",
        icon: Calendar,
        title: "Instancias",
        desc: "Reuniones, llamadas y coordinaciones.",
        permisos: ["VER_INSTANCIAS"],
      },
      {
        key: "incidencias",
        href: "/incidencias",
        icon: TriangleAlert,
        title: "Incidencias",
        desc: "Situaciones puntuales a registrar y seguir.",
        permisos: ["VER_INCIDENCIAS"],
      },
      {
        key: "recordatorios",
        href: "/recordatorios",
        icon: Bell,
        title: "Recordatorios",
        desc: "Tareas y avisos, sincronizados con Google Calendar.",
        permisos: ["VER_RECORDATORIOS"],
      },
    ],
  },
  {
    label: "Administración",
    items: [
      {
        key: "funcionarios",
        href: "/funcionarios",
        icon: Users,
        title: "Funcionarios",
        desc: "Altas, bajas y roles del equipo.",
        permisos: ["VER_FUNCIONARIOS"],
      },
      {
        key: "roles",
        href: "/roles",
        icon: Shield,
        title: "Roles",
        desc: "Qué puede hacer cada rol del sistema.",
        permisos: ["VER_ROLES", "VER_PERMISOS"],
      },
      {
        key: "catalogos",
        href: "/catalogos",
        icon: Library,
        title: "Catálogos",
        desc: "Carreras, grupos, ITRs y categorías.",
        permisos: [
          "VER_CARRERAS",
          "VER_GRUPOS",
          "VER_ITRS",
          "VER_CATEGORIAS_INSTANCIA",
          "VER_CATEGORIAS_RECORDATORIO",
        ],
      },
      {
        key: "auditoria",
        href: "/auditoria",
        icon: Archive,
        title: "Auditoría",
        desc: "Quién hizo qué, y cuándo.",
        permisos: ["VER_AUDITORIA"],
      },
      {
        key: "reportes",
        href: "/reportes",
        icon: BarChart3,
        title: "Reportes",
        desc: "Métricas de seguimiento, exportables a PDF.",
        permisos: ["VER_REPORTES"],
      },
    ],
  },
];

// Self-service del estudiante: sin permiso, el filtro por `tipo` ya alcanza.
export const ESTUDIANTE_NAV: NavItem[] = [
  { key: "perfil-estudiante", href: "/perfil-estudiante", icon: User, title: "Mi perfil", desc: "Tus datos personales y tu contraseña." },
  { key: "mis-incidencias", href: "/perfil-estudiante/incidencias", icon: TriangleAlert, title: "Mis incidencias", desc: "Incidencias registradas sobre vos." },
  { key: "mis-instancias", href: "/perfil-estudiante/instancias", icon: Calendar, title: "Mis instancias", desc: "Reuniones y seguimientos agendados." },
];

// El usuario ve el ítem si no tiene requisitos de permiso, o si tiene al menos
// uno de los requeridos.
export function puedeVer(item: NavItem, permisosUsuario: readonly string[]): boolean {
  if (!item.permisos || item.permisos.length === 0) return true;
  return item.permisos.some((p) => permisosUsuario.includes(p));
}

// Aplica `puedeVer` a los grupos y descarta los que quedan sin ítems visibles.
export function gruposVisibles(
  grupos: readonly NavGroup[],
  permisosUsuario: readonly string[],
): NavGroup[] {
  return grupos
    .map((g) => ({ ...g, items: g.items.filter((i) => puedeVer(i, permisosUsuario)) }))
    .filter((g) => g.items.length > 0);
}
