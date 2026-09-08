# Proyecto Final de Tecnicatura Cuarto Semestre DZA Grupo 1 – SIENEP

**Sistema Integral de Estudiantes con Necesidades Educativas Personalizadas**

Este repositorio contiene el frontend de **SIENEP**, desarrollado en **Next.js** (App Router) + **TypeScript**, con **Tailwind CSS** y **daisyUI**. Consume la API REST del backend de SIENEP (Java/Spring Boot) — el contrato de esa API está en `docs/openapi.json`.

Forma parte del **Proyecto Final de Tecnicatura** del cuarto semestre de la **Licenciatura en Tecnologías de la Información** en **UTEC**.

## Tabla de contenidos

- [Requisitos previos](#requisitos-previos)
- [Estado del proyecto](#estado-del-proyecto)
- [UI y estilos](#ui-y-estilos)
- [Estructura del código](#estructura-del-código)
- [Componentes disponibles](#componentes-disponibles)
- [Configuración y ejecución](#configuración-y-ejecución)
- [Documentación de referencia](#documentación-de-referencia)

## Requisitos previos

1. **Node.js 20+** y **npm**.
2. La **API de SIENEP** (backend, [repo](https://git.utec.edu.uy/pdi-tercer-semestre-dza-grupo-1/sienep)). Por defecto el frontend apunta a una instancia hosteada; también se puede levantar localmente siguiendo el README de ese repo.

## Estado del proyecto

En construcción. Lo que ya funciona:

- **Autenticación** — pantallas de login, "olvidé mi contraseña" y restablecimiento. El login con email/contraseña y con Google (Google Identity Services) está conectado a la API; el pedido y uso del enlace de recuperación todavía son presentacionales.
- **Sesión** — el JWT del backend viaja en una cookie `httpOnly` que el JavaScript no puede leer. Un proxy propio (`src/app/api/**`) recibe las llamadas del cliente, saca el token de la cookie y lo reenvía a la API como `Authorization: Bearer`. El área autenticada se gatea contra `GET /auth/me`; sin sesión válida, redirige a `/login`.
- **Inicio** (`/inicio`) — panel post-login con accesos a los módulos, filtrados según el `tipo` de usuario (funcionario/estudiante) y sus `permisos`.
- **Chrome** — `TopBar` en toda pantalla autenticada, `Sidebar` dentro de las secciones de funcionario, página 404 propia.

Todavía **no hay páginas de módulo** (Estudiantes, Instancias, etc.): existe el prototipo de referencia y el chrome donde van a montarse.

Módulos planeados (11): Autenticación, Estudiantes, Instancias, Incidencias, Recordatorios, Funcionarios, Roles, Catálogos, Auditoría, Reportes, Perfil Estudiante. La organización de rutas y el manejo de sesión ya están definidos (ver la estructura más abajo); la decisión abierta principal es la **capa de datos** de los módulos — cliente `fetch` propio vs TanStack Query.

## UI y estilos

**Se prioriza usar componentes de daisyUI** (`btn`, `card`, `alert`, `input`, `dropdown`, `table`, etc.) antes que construir UI a mano con clases de Tailwind. Solo se recurre a Tailwind puro cuando daisyUI no cubre el caso, y a CSS propio como último recurso.

- Las guías de componentes de daisyUI están en `.agents/skills/daisyui/`.
- La paleta de marca está aplicada sobre el theme `light` de daisyUI en `src/app/globals.css` (sin toggle de tema todavía: la app corre siempre en `data-theme="light"`).
- `docs/prototipo.html` es la referencia visual (prototipo React + Tailwind + daisyUI, sin build). No se copia tal cual: se porta a componentes tipados y reutilizables.

## Estructura del código

```
src/
├─ app/
│  ├─ (auth)/             # Login y recuperación de contraseña (sin sidebar)
│  ├─ (app)/              # Área autenticada — portón de sesión + TopBar
│  │  ├─ inicio/           # Panel post-login
│  │  └─ (secciones)/      # Chrome con Sidebar para los módulos (aún sin páginas)
│  ├─ api/               # Proxy a la API del backend (route handlers)
│  └─ not-found.tsx      # Página 404 propia
├─ components/
│  ├─ auth/               # Formularios de login / recuperación + GoogleIcon
│  ├─ layout/             # AppShell, TopBar, Sidebar, SeccionShell, BackButton, Logo
│  └─ ui/                 # Bloques de listado: SectionHeader, Toolbar, DataTable, PaginationFooter
└─ lib/
   ├─ api.ts              # Cliente HTTP del navegador (siempre contra /api)
   ├─ auth.ts             # login / logout / login con Google (cliente)
   ├─ backend.ts          # Acceso a la API desde el server (Server Components)
   ├─ session.ts          # Cookie de sesión httpOnly (server)
   ├─ current-user.ts     # GET /auth/me (server)
   ├─ session-context.tsx # useSession() (cliente)
   └─ nav-items.ts        # Navegación de los módulos + filtrado por permisos
```

## Componentes disponibles

Ya portados del prototipo, tipados y listos para reusar al construir los módulos.

### Chrome / layout (`src/components/layout/`)

Normalmente **no** se instancian a mano: ya vienen puestos por los layouts de `src/app/(app)/**`. Se listan para saber qué cubre cada uno.

| Componente | Qué es / dónde | Props |
|---|---|---|
| `AppShell` | Frame de toda pantalla autenticada: `TopBar` arriba + contenido. Lo monta `(app)/layout.tsx`. | `children` |
| `TopBar` | Barra superior: logo; a la derecha avatar + nombre/rol + menú con "Cerrar sesión". | `userName`, `userRole`, `onLogout` |
| `SeccionShell` | Chrome de las páginas de módulo. Funcionario → `Sidebar` + botón "Menú" mobile + contenido. Estudiante → `BackButton` + contenido. Lo monta `(app)/(secciones)/layout.tsx`. | `children` |
| `Sidebar` | Nav lateral de funcionario, filtrada por los `permisos` del usuario; offcanvas en mobile. Devuelve `null` para estudiante. | `show`, `onClose` |
| `BackButton` | Link con chevron para volver. | `href`, `label?` (default `"Volver al inicio"`) |
| `Logo` | Isotipo "SIENEP" (`next/image`), dos variantes. | `variant?` (`"blanco"` \| `"negro"`, default `"blanco"`), `className?` |

### Bloques de UI (`src/components/ui/`)

Estos **sí** se usan dentro de cada página de módulo (listados, tablas).

| Componente | Qué es | Props |
|---|---|---|
| `SectionHeader` | Encabezado de sección: título + botón de acción opcional (ej. "Nuevo…"). | `title`, `action?` (texto del botón), `onAction?` |
| `Toolbar` | Barra de búsqueda + `select`s de filtro, controlada por props. | `placeholder`, `searchValue?`, `onSearchChange?`, `filters?` (`{ label, options, value?, onChange? }[]`) |
| `DataTable` | `<table>` de daisyUI: recibe `headers` y las filas como `children` (`<tr>…`). | `headers: string[]`, `children` |
| `PaginationFooter` | Pie de listado: "Mostrando X de Y …" + Anterior / Siguiente. | `shown`, `total`, `noun`, `hasPrevious?`, `hasNext?`, `onPrevious?`, `onNext?` |

### Íconos

**lucide-react**, importado directo donde se usa:

```tsx
import { User } from "lucide-react";
<User size={16} aria-hidden />
```

Los íconos de la navegación se guardan como componente en `src/lib/nav-items.ts` (`icon: User`) y se renderizan con `<item.icon size={15} />`.

El ícono multicolor de Google va aparte en `src/components/auth/GoogleIcon.tsx` (SVG inline): es la marca oficial de Google y ninguna librería de íconos la trae a color.

## Configuración y ejecución

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador.

Comandos útiles:
- `npm run build` — build de producción.
- `npm run lint` — ESLint.

### Variables de entorno

Los defaults por entorno ya están commiteados (`.env.development`, `.env.production`). Para overrides personales, copiá `.env.example` a `.env.local` (no se commitea).

| Variable | Uso |
|---|---|
| `API_BASE_URL` | Base de la API REST. Solo server — el navegador siempre va por `/api`. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | OAuth Client ID de Google para el login con Google. Sin él, ese botón queda deshabilitado. |

> Mientras el backend no corra en local, `.env.development` apunta a la API hosteada.

## Documentación de referencia

En `docs/` se versionan tres insumos:

- `openapi.json` — spec OpenAPI 3 de la API del backend, contra la que se codea.
- `prototipo.html` — prototipo de UI (React + Tailwind + daisyUI, sin build) usado como referencia visual. No se copia tal cual: se porta a componentes tipados y reutilizables.
- `wireframes.pdf` — wireframes de las pantallas.

La documentación del backend (arquitectura, auth, cómo levantarlo) está en su propio repositorio: <https://git.utec.edu.uy/pdi-tercer-semestre-dza-grupo-1/sienep>. Los assets de marca están en `public/`; el favicon usa la convención de archivos de Next (`src/app/favicon.ico`, `icon.svg`, `apple-icon.png`, `manifest.webmanifest`).
