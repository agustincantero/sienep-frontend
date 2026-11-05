# Proyecto Final de Tecnicatura Cuarto Semestre DZA Grupo 1 - SIENEP

**Sistema Integral de Estudiantes con Necesidades Educativas Personalizadas**

Este repositorio contiene el frontend de **SIENEP**, desarrollado en **Next.js** (App Router) + **TypeScript**, con **Tailwind CSS** y **daisyUI**. Consume la API REST del backend de SIENEP (Java/Spring Boot); el contrato de esa API está en `docs/openapi.json`.

Forma parte del **Proyecto Final de Tecnicatura** del cuarto semestre de la **Licenciatura en Tecnologías de la Información** en **UTEC**.

## Tabla de contenidos

- [Requisitos previos](#requisitos-previos)
- [Qué incluye](#qué-incluye)
- [Arquitectura](#arquitectura)
- [Estructura del código](#estructura-del-código)
- [UI y estilos](#ui-y-estilos)
- [Configuración y ejecución](#configuración-y-ejecución)
- [Documentación de referencia](#documentación-de-referencia)

## Requisitos previos

1. **Node.js 22+** y **npm**.
2. La **API de SIENEP** (backend, [repo](https://git.utec.edu.uy/pdi-tercer-semestre-dza-grupo-1/sienep)). Por defecto el frontend apunta a una instancia alojada en un servidor; también se puede levantar localmente siguiendo el README de ese repo.

## Qué incluye

Los 11 módulos previstos están implementados. Lo que ve cada persona depende de su tipo de usuario (funcionario o estudiante) y de los permisos de su rol.

- **Autenticación**: login con email y contraseña, con Google y con cuenta UTEC (Active Directory), recuperación de contraseña y cambio obligatorio de la contraseña temporal en el primer ingreso.
- **Estudiantes**: listado con búsqueda, filtros y paginación; alta, edición, foto de perfil, grupos y carrera; ficha con datos, información de salud (confidencial, según permiso), instancias, incidencias, informes médicos adjuntos y comentarios; desactivar, reactivar y reenvío de contraseña temporal.
- **Instancias** e **Incidencias**: registro de las acciones de apoyo (reuniones, llamadas, acuerdos) y de los hechos puntuales, con listado, filtros, alta, edición y detalle. Las instancias llevan comentarios y las incidencias, involucrados.
- **Recordatorios**: listado con filtros por categoría, vencimiento y estado; alta, edición, repetición opcional y registro de seguimiento, que crea la instancia correspondiente. Se sincronizan con Google Calendar desde el backend.
- **Funcionarios**: listado, ficha con foto, alta y edición, con el rol asignable según los permisos de quien lo gestiona.
- **Roles**: alta y edición de roles con sus permisos agrupados por dominio.
- **Catálogos**: carreras, grupos, ITRs, categorías de instancia y de recordatorio, y frecuencias de repetición.
- **Auditoría**: listado de eventos del sistema (quién hizo qué, y cuándo).
- **Reportes**: indicadores del Data Warehouse por período, con exportación a PDF y validación de un PDF emitido.
- **Mi perfil**: autoservicio con los datos de la persona, cambio de contraseña y de foto. El estudiante además edita su contacto y ve solo sus propias instancias, incidencias, comentarios e informes.

También es una **PWA instalable** (se puede agregar a la pantalla de inicio), sin modo sin conexión.

## Arquitectura

- **Sesión**: el token del backend viaja en una cookie `httpOnly` que el JavaScript del navegador no puede leer. El navegador solo habla con rutas propias de Next (`/api/*`), que sacan el token de la cookie y lo reenvían al backend como `Authorization: Bearer`.
- **Acceso**: el área autenticada se valida contra `GET /auth/me`; sin sesión válida se redirige a `/login`. Si la sesión vence en medio del uso, un aviso obliga a volver a iniciar sesión.
- **Autorización**: la navegación se filtra por los permisos del usuario, y cada página de módulo vuelve a chequear el permiso en el servidor.
- **Datos**: un cliente `fetch` propio (`src/lib/api.ts`) y el hook `useApi` (`src/hooks/useApi.ts`) para las cargas desde componentes cliente.

## Estructura del código

- `src/app/`: rutas de Next.js. `(auth)/` tiene las pantallas sin sesión, `(app)/` el área autenticada con una carpeta por módulo, y `api/` el proxy al backend.
- `src/components/`: una carpeta por módulo, más `layout/` (barra superior, menú lateral y demás piezas de la estructura de página), `auth/` (pantallas sin sesión) y `ui/` (bloques reutilizables).
- `src/lib/`: acceso a la API y lógica de dominio, con un archivo por módulo (tipos y funciones sobre `api.ts`), más los archivos transversales de sesión, navegación y permisos.
- `src/hooks/`: hooks compartidos.

Las páginas de módulo siguen el mismo patrón: la `page.tsx` (Server Component) chequea el permiso y delega en una vista cliente (`*ListView`, `*Detalle` o `*Form`) que usa `src/lib/<modulo>.ts`.

Bloques reutilizables para páginas de listado (`src/components/ui/`): `SectionHeader`, `Toolbar` (búsqueda y filtros), `DataTable`, `PaginationFooter` y `ConfirmDialog`.

## UI y estilos

Se prioriza usar componentes de **daisyUI** (`btn`, `card`, `alert`, `input`, `table`, etc.) antes que armar la interfaz a mano con Tailwind; Tailwind puro solo cuando daisyUI no cubre el caso, y CSS propio como último recurso.

- La paleta de marca está aplicada sobre el theme `light` de daisyUI en `src/app/globals.css`. No hay selector de tema: la app corre siempre en modo claro.
- Íconos: **lucide-react**, importados directo donde se usan.
- `docs/prototipo.html` es la referencia visual (prototipo React + Tailwind + daisyUI, sin build).

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
- `prototipo.html`: prototipo de UI usado como referencia visual. No se copia tal cual: se porta a componentes tipados y reutilizables.

En `ux/` están los documentos de UX/UI. `Documento de Entregas UI-UX - Entrega 1 y 2.pdf` reúne los wireframes, los arquetipos y el mapa de empatía de las entregas 1 y 2, y `Documento de Entregas UI-UX - Entrega Final.pdf` es el documento de la entrega final.

La documentación del backend (arquitectura, auth, cómo levantarlo) está en su propio repositorio: <https://git.utec.edu.uy/pdi-tercer-semestre-dza-grupo-1/sienep>. Los assets de marca están en `public/`.
