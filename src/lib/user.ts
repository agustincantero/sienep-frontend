// Forma del usuario autenticado que devuelve GET /auth/me. Archivo sin imports de servidor para poder usar el type tanto en Server Components como en cliente. Los nombres de campo (tipo, nombre, apellido, estado, rol, permisos) son las claves del JSON del backend (UsuarioAutenticadoDTO) y no se traducen.

export type UserType = "FUNCIONARIO" | "ESTUDIANTE";

export type AuthenticatedUser = {
  idUsuario: number;
  tipo: UserType;
  email: string;
  nombre: string;
  apellido: string;
  estado: string;
  // Nombre del rol (ej. "ADMINISTRADOR"). Solo para mostrar/diagnóstico:
  // el gating fino se hace con `permisos`, el shell con `tipo`.
  rol: string;
  permisos: string[];
};
