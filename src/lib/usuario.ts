// Forma del usuario autenticado que devuelve GET /auth/me. Archivo sin imports
// de servidor para poder usar el type tanto en Server Components como en cliente.

export type TipoUsuario = "FUNCIONARIO" | "ESTUDIANTE";

export type UsuarioAutenticado = {
  idUsuario: number;
  tipo: TipoUsuario;
  email: string;
  nombre: string;
  apellido: string;
  estado: string;
  // Nombre del rol (ej. "ADMINISTRADOR"). Solo para mostrar/diagnóstico:
  // el gating fino se hace con `permisos`, el shell con `tipo`.
  rol: string;
  permisos: string[];
};
