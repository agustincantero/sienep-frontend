import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiPutForm } from "./api";

// Un estudiante recién creado queda PENDIENTE_DE_ACTIVACION hasta que pone su
// contraseña — no es lo mismo que "desactivado" (RF06), así que se etiqueta
// distinto y no ofrece las acciones Desactivar/Activar (ver wireframe 05,
// fila "Camila Rodríguez").
export function describeEstado(estado: string): { label: string; badgeClass: string } {
  switch (estado) {
    case "ACTIVO":
      return { label: "Activo", badgeClass: "badge-success" };
    case "INACTIVO":
      return { label: "Inactivo", badgeClass: "badge-ghost" };
    default:
      return { label: "Pendiente", badgeClass: "badge-warning" };
  }
}

// Página al estilo Spring Data (forma real de lo que devuelve el backend).
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

// Ficha completa — GET /estudiantes/{id}. Claves del JSON del backend
// (EstudianteResponseDTO), sin traducir. informacionSalud/sistemaSalud/
// motivoDerivacion vienen null si el usuario autenticado no tiene
// VER_BLOQUE_CONFIDENCIAL — el backend ya los nulifica, acá solo se leen.
export type Student = {
  idUsuario: number;
  nombre: string;
  apellido: string;
  documento: string;
  paisDocumento: string;
  email: string;
  estado: string;
  fechaNacimiento: string;
  ciudad: string | null;
  departamento: string | null;
  calle: string | null;
  nroPuerta: number | null;
  informacionSalud: string | null;
  sistemaSalud: string | null;
  motivoDerivacion: string | null;
  urlFoto: string | null;
  telefonos: string[];
  grupos: string[];
  advertencia: string | null;
};

// Fila del listado — GET /estudiantes (EstudianteResumenDTO). Sin datos de salud.
export type StudentSummary = {
  idUsuario: number;
  nombre: string;
  apellido: string;
  documento: string;
  email: string;
  estado: string;
  grupos: string[];
  telefonos: string[];
};

export type StudentListParams = {
  texto?: string;
  grupo?: number;
  carrera?: number;
  itr?: number;
  estado?: string;
  page?: number;
  size?: number;
};

export function listStudents(params: StudentListParams = {}): Promise<Page<StudentSummary>> {
  return apiGet<Page<StudentSummary>>("/estudiantes", params);
}

export function getStudent(id: number): Promise<Student> {
  return apiGet<Student>(`/estudiantes/${id}`);
}

// Datos de alta — EstudianteRequestDTO. documento y paisDocumento son
// inmutables después de creado (por eso no están en StudentUpdateInput).
export type StudentCreateInput = {
  nombre: string;
  apellido: string;
  documento: string;
  paisDocumento: string;
  email: string;
  fechaNacimiento: string;
  ciudad?: string;
  departamento?: string;
  calle?: string;
  nroPuerta?: number;
  informacionSalud?: string;
  sistemaSalud?: string;
  motivoDerivacion?: string;
  telefonos?: string[];
  idGrupos?: number[];
};

// Datos editables — EstudianteUpdateDTO. Sin documento ni paisDocumento.
export type StudentUpdateInput = Omit<StudentCreateInput, "documento" | "paisDocumento">;

export function createStudent(dto: StudentCreateInput): Promise<Student> {
  return apiPost<Student>("/estudiantes", dto);
}

export function updateStudent(id: number, dto: StudentUpdateInput): Promise<Student> {
  return apiPut<Student>(`/estudiantes/${id}`, dto);
}

// Baja lógica (RF06): el backend nunca borra al estudiante, solo cambia el
// estado a INACTIVO.
export function deactivateStudent(id: number): Promise<void> {
  return apiDelete<void>(`/estudiantes/${id}`);
}

export function reactivateStudent(id: number): Promise<void> {
  return apiPatch<void>(`/estudiantes/${id}/reactivar`);
}

export function uploadStudentPhoto(id: number, foto: File): Promise<Student> {
  const formData = new FormData();
  formData.set("foto", foto);
  return apiPutForm<Student>(`/estudiantes/${id}/foto`, formData);
}

// POST /estudiantes/{id}/contrasenia — genera una contraseña nueva y la manda
// por email (mismo endpoint que se usa para "reenviar contraseña" a un
// estudiante PENDIENTE_DE_ACTIVACION que nunca la recibió, y para
// "restablecer contraseña" de uno que ya está activo). Sin body: el valor lo
// define el servidor, no el cliente. Si Brevo falla, el backend revierte el
// cambio y devuelve 503 — a diferencia del alta, acá SÍ es un error real.
export function resendStudentPassword(id: number): Promise<void> {
  return apiPost<void>(`/estudiantes/${id}/contrasenia`, {});
}
