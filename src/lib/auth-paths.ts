// Regla compartida para interpretar un 401 del backend, usada por el cliente (src/lib/api.ts) y el proxy (src/app/api/[...path]/route.ts) para que apliquen el mismo criterio.

// Rutas donde un 401 significa "los datos que enviaste son incorrectos" (contraseña equivocada en el login, enlace de recuperación vencido) y NO "tu sesión expiró": las maneja el formulario que llamó y no hay sesión de la que expulsar. Para todo el resto —incluido GET /auth/me y cualquier recurso— un 401 significa que la sesión murió: limpiar la cookie y volver al login.
const BUSINESS_401_PATHS = [
  "/auth/login",
  "/auth/google",
  "/auth/olvide-contrasenia",
  "/auth/restablecer-contrasenia",
];

// PATCH /funcionarios/{id}/contrasenia y /estudiantes/{id}/contrasenia (cambiar la contraseña propia) devuelven 401 cuando la contraseña actual no coincide: también es un 401 de negocio, no de sesión muerta.
const BUSINESS_401_SUFFIXES = ["/contrasenia"];

// `path` es la ruta del backend con barra inicial y sin el prefijo `/api` (ej. "/auth/me", "/estudiantes/12").
export function shouldLogoutOn401(path: string): boolean {
  if (BUSINESS_401_SUFFIXES.some((suffix) => path.endsWith(suffix))) return false;
  return !BUSINESS_401_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}
