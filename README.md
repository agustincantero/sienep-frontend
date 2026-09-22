# Proyecto Final de Tecnicatura Cuarto Semestre DZA Grupo 1 – SIENEP

**Sistema Integral de Estudiantes con Necesidades Educativas Personalizadas**

Este repositorio contiene el frontend de **SIENEP**, desarrollado en **Next.js** (App Router) + **TypeScript**, con **Tailwind CSS** y **daisyUI**. Consume la API REST del backend de SIENEP (Java/Spring Boot); el contrato de esa API está en `docs/openapi.json`.

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
2. La **API de SIENEP** (backend, [repo](https://git.utec.edu.uy/pdi-tercer-semestre-dza-grupo-1/sienep)). Por defecto el frontend apunta a una instancia alojada en un servidor; también se puede levantar localmente siguiendo el README de ese repo.

## Estado del proyecto

En construcción. Lo que ya funciona:

- **Autenticación**: login con email/contraseña y con Google (Google Identity Services), "olvidé mi contraseña" y restablecimiento, todo conectado a la API. Si el usuario está `PENDIENTE_DE_ACTIVACION` (alta reciente, contraseña temporal), se lo fuerza a elegir contraseña nueva antes de entrar a la app: `SetPasswordForm` lo resuelve ahí mismo en el login, y `SetPasswordScreen` hace de respaldo cuando se llega con una sesión que ya estaba iniciada.
- **Sesión**: el JWT del backend viaja en una cookie `httpOnly` que el JavaScript no puede leer. Un proxy propio (`src/app/api/**`) recibe las llamadas del cliente, saca el token de la cookie y lo reenvía a la API como `Authorization: Bearer`. El acceso al área autenticada se valida contra `GET /auth/me`; sin sesión válida, redirige a `/login`. Si la sesión muere en medio del uso, un modal no descartable (`SesionExpiradaModal`) obliga a volver a `/login`.
- **Inicio** (`/`): panel post-login con accesos a los módulos, filtrados según el `tipo` de usuario (funcionario/estudiante) y sus `permisos`.
- **Estudiantes**: primer módulo completo: listado con búsqueda/filtros/paginación, alta, ficha (datos, comentarios normales y confidenciales, informes médicos adjuntos), edición, foto de perfil, asignación de grupo e ITR, desactivar/reactivar y reenvío de contraseña temporal.
- **Estructura de página**: `TopBar` en toda pantalla autenticada, `Sidebar` dentro de las secciones de funcionario. Las pantallas sin sesión (login, recuperación) y la página 404 comparten otra estructura, con `Footer`.

Módulos planeados (11): Autenticación, Estudiantes, Instancias, Incidencias, Recordatorios, Funcionarios, Roles, Catálogos, Auditoría, Reportes, Perfil Estudiante. De estos, Autenticación y Estudiantes ya están implementados; el resto todavía no tiene páginas propias. La capa de datos quedó resuelta con un cliente `fetch` propio en `src/lib/api.ts` (`apiGet`/`apiPost`/`apiPut`/`apiPatch`/`apiDelete`, más variantes `*Form` para `multipart/form-data`).

## UI y estilos

**Se prioriza usar componentes de daisyUI** (`btn`, `card`, `alert`, `input`, `dropdown`, `table`, etc.) antes que construir UI a mano con clases de Tailwind. Solo se recurre a Tailwind puro cuando daisyUI no cubre el caso, y a CSS propio como último recurso.

- La paleta de marca está aplicada sobre el theme `light` de daisyUI en `src/app/globals.css` (sin toggle de tema todavía: la app corre siempre en `data-theme="light"`).
- `docs/prototipo.html` es la referencia visual (prototipo React + Tailwind + daisyUI, sin build).

## Estructura del código

- `src/app/`: rutas de Next.js (App Router). `(auth)/` tiene el login y la recuperación de contraseña; `(app)/` es el área autenticada, con `(secciones)/` para las páginas de módulo (hoy solo `estudiantes/`); `api/` es el proxy al backend.
- `src/components/`: `auth/` (pantallas sin sesión), `layout/` (TopBar, Sidebar, Footer y demás piezas de la estructura de página), `students/` (módulo Estudiantes) y `ui/` (bloques reutilizables de listado).
- `src/lib/`: acceso a la API y lógica de dominio. `api.ts`, `auth.ts`, `session.ts`, `current-user.ts` y `session-context.tsx` manejan la sesión y las llamadas HTTP; `students.ts`, `groups.ts`, `itrs.ts`, `comments.ts` y `medical-reports.ts` son del módulo Estudiantes; `nav-items.ts` define la navegación.

## Componentes disponibles

### Estructura de página (`src/components/layout/`)

Normalmente **no** se instancian a mano: ya vienen puestos por los layouts de `src/app/(app)/**`. Se listan para saber qué cubre cada uno.

| Componente | Qué es / dónde | Props |
|---|---|---|
| `AppShell` | Estructura de toda pantalla autenticada: `TopBar` arriba + contenido. La incluye `(app)/layout.tsx`. | `children` |
| `TopBar` | Barra superior: logo; a la derecha avatar + nombre/rol + menú con "Cerrar sesión". | `userName`, `userRole`, `onLogout` |
| `Footer` | Pie de página de las pantallas sin sesión y de la 404 (lo incluye `AuthLayout`). El área autenticada no lo usa. | - |
| `SeccionShell` | Estructura de página de los módulos. Funcionario → `Sidebar` + botón "Menú" mobile + contenido. Estudiante → `BackButton` + contenido. Lo incluye `(app)/(secciones)/layout.tsx`. | `children` |
| `Sidebar` | Nav lateral de funcionario, filtrada por los `permisos` del usuario; offcanvas en mobile. Devuelve `null` para estudiante. | `show`, `onClose` |
| `SesionExpiradaModal` | Modal no descartable que se abre al evento `SESION_EXPIRADA` (`src/lib/api.ts`); fuerza `window.location.href = "/login"`. Montado en `AppShell`. | - |
| `BackButton` | Link con flecha para volver. | `href`, `label?` (default `"Volver al inicio"`) |
| `Logo` | Isotipo "SIENEP" (`next/image`), dos variantes. | `variant?` (`"blanco"` \| `"negro"`, default `"blanco"`), `className?` |

### Autenticación (`src/components/auth/`)

| Componente | Qué es | Props |
|---|---|---|
| `AuthLayout` | Estructura de página de las pantallas sin sesión: `LoginBackground` de fondo, logo arriba, `Footer` abajo. | `children` |
| `AuthCard` | Card blanca centrada dentro de `AuthLayout`. | `title`, `description?`, `focusOnMount?`, `children` |
| `LoginBackground` | Fondo decorativo: tres fotos del campus que se funden lentamente entre sí, con un velo celeste para que el texto blanco de encima tenga contraste. | - |
| `LoginForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `SetPasswordForm` | Formularios de login, pedido de recuperación, restablecimiento con token y cambio de contraseña obligatorio (`PENDIENTE_DE_ACTIVACION`). | propios de cada uno |
| `GoogleLoginButton` | Botón de login con Google (Google Identity Services); deshabilitado sin `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. | `onSuccess`, `onError` |
| `PasswordInput` | Campo de contraseña con toggle de visibilidad. | `label`, `value`, `onChange`, `autoComplete`, `disabled?`, `required?`, `error?`, `hint?`, `errorId?` |
| `GoogleIcon` | SVG inline de la marca de Google a color (ninguna librería de íconos la trae). | - |

### Módulo Estudiantes (`src/components/students/`)

| Componente | Qué es | Props |
|---|---|---|
| `StudentsListView` | Vista de listado: `Toolbar` + `DataTable` + `PaginationFooter` conectados a `GET /estudiantes`. | - |
| `StudentForm` | Alta y edición; secciones en `fieldset`s: datos personales, dirección, teléfonos, grupos (filtrado por ITR y carrera) e información de salud. | `{ mode: "crear" }` \| `{ mode: "editar", estudianteId, estudiante }` |
| `StudentProfile` | Ficha del estudiante en tabs: datos generales, salud (confidencial, según permiso), instancias e incidencias (placeholder hasta que exista ese módulo), informes médicos y comentarios. | `idEstudiante` |
| `StudentCommentsPanel` | Comentarios normales y confidenciales, paginados. | `idEstudiante` |
| `MedicalReportsPanel` | Informes médicos adjuntos: listar, subir, borrar. | `idEstudiante` |
| `StudentAvatar` | Foto de perfil (proxy autenticado) o iniciales si no hay foto o la imagen falla al cargar. | `nombre`, `apellido`, `urlFoto?`, `size?` (`"sm"` \| `"lg"`) |
| `EstadoBadge` | Chip de estado del estudiante (Activo/Inactivo/etc.), colores vía `describeEstado()` en `src/lib/students.ts`. | `estado` |
| `ConfirmDialog` | Reemplazo de `window.confirm()` para acciones como desactivar o reenviar contraseña; variante destructiva en rojo. | `open`, `title`, `message`, `confirmLabel`, `destructive?`, `onConfirm`, `onCancel` |

### Bloques de listado (`src/components/ui/`)

Reutilizables para las páginas de cualquier módulo (hoy en uso en Estudiantes).

| Componente | Qué es | Props |
|---|---|---|
| `SectionHeader` | Encabezado de sección: título + botón de acción opcional (ej. "Nuevo…"). | `title`, `action?` (texto del botón), `onAction?` |
| `Toolbar` | Barra de búsqueda + `select`s de filtro, controlada por props. | `placeholder`, `searchValue?`, `onSearchChange?`, `filters?` (`{ label, emptyLabel, options, value?, onChange? }[]`) |
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
- `npm run build`: build de producción.
- `npm run lint`: ESLint.

### Variables de entorno

Los defaults por entorno ya están commiteados (`.env.development`, `.env.production`). Para overrides personales, copiá `.env.example` a `.env.local` (no se commitea).

| Variable | Uso |
|---|---|
| `API_BASE_URL` | Base de la API REST. Solo server; el navegador siempre va por `/api`. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | OAuth Client ID de Google para el login con Google. Sin él, ese botón queda deshabilitado. |

> Mientras el backend no corra en local, `.env.development` apunta a la API alojada en el servidor.

## Documentación de referencia

En `docs/` se versionan estos insumos:

- `openapi.json`: spec OpenAPI 3 de la API del backend, contra la que se codea.
- `prototipo.html`: prototipo de UI (React + Tailwind + daisyUI, sin build) usado como referencia visual. No se copia tal cual: se porta a componentes tipados y reutilizables.
- `wireframes.pdf`: wireframes de las pantallas.

La documentación del backend (arquitectura, auth, cómo levantarlo) está en su propio repositorio: <https://git.utec.edu.uy/pdi-tercer-semestre-dza-grupo-1/sienep>. Los assets de marca están en `public/`; el favicon usa la convención de archivos de Next (`src/app/favicon.ico`, `icon.svg`, `apple-icon.png`, `manifest.webmanifest`).
