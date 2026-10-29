import { apiGet } from "./api";
import type { Page } from "./students";

// TipoAccion del backend (com.fides.sienep.model.TipoAccion).
export type AuditAction = "INSERT" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "NOTIFICACION";

export const AUDIT_ACTIONS: AuditAction[] = ["INSERT", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "NOTIFICACION"];

// Badge por acción (mismo criterio de color que EstadoBadge: éxito/alta en verde, baja en rojo).
const ACCION_BADGE: Record<AuditAction, string> = {
  INSERT: "badge-success",
  UPDATE: "badge-primary",
  DELETE: "badge-error",
  LOGIN: "badge-neutral",
  LOGOUT: "badge-outline",
  NOTIFICACION: "badge-info",
};

export function describeAccion(accion: AuditAction): { badgeClass: string } {
  return { badgeClass: ACCION_BADGE[accion] };
}

// Tablas con trigger trg_auditoria_general (proyecto_schema.sql, proyecto.trg_audit_*) más "SISTEMA", que es la entidad fija de los eventos manuales de LOGIN/LOGOUT (AuthService.registrarEventoManual). Las NOTIFICACION usan INSTANCIAS o RECORDATORIOS, que ya están. Lista fija: solo cambia si el backend agrega un trigger de auditoría nuevo.
export const AUDIT_ENTITIES = [
  "SISTEMA",
  "USUARIOS",
  "ESTUDIANTES",
  "FUNCIONARIOS",
  "INSTANCIAS",
  "RECORDATORIOS",
  "CARRERAS",
  "ITRS",
  "ROLES",
  "PERMISOS",
  "FRECUENCIAS",
  "CAT_INSTANCIAS",
  "CAT_RECORDATORIOS",
  "GRUPOS",
  "ITR_CARRERA",
  "ROL_PERMISOS",
  "INCIDENCIAS",
  "ESTU_GRUPOS",
  "ESTU_INFORMESADJS",
  "ESTU_TELEFONOS",
  "ESTU_OBS_COMENTARIOS",
  "ESTU_OBS_CONFIDENCIALES",
  "INVOLUCRADOS",
  "INST_COMUNES",
  "INST_COMENTARIOS",
  "INST_COM_CONFIDENCIALES",
];

// Forma de GET /auditorias (AuditoriaResponseDTO). valorAnterior/valorNuevo llegan ya como objeto (el backend anota esos campos con @JsonRawValue: son jsonb crudo de to_jsonb(OLD)/to_jsonb(NEW), no un string que haya que volver a parsear). idAutor/nombreAutor/ip vienen null cuando el cambio lo hizo un DBA directo en BD (sin pasar por la app, así que no hay variable de sesión `sienep.usuario_actual` que el trigger pueda leer); usuarioBd viene null en los eventos manuales de LOGIN/LOGOUT y NOTIFICACION porque el backend no lo completa. Una NOTIFICACION del scheduler de recordatorios tampoco trae autor: la dispara el sistema.
export type AuditEvent = {
  idAuditoria: number;
  entidad: string;
  accion: AuditAction;
  idAutor: number | null;
  nombreAutor: string | null;
  documentoAutor: string | null;
  usuarioBd: string | null;
  fechaHora: string;
  ip: string | null;
  valorAnterior: Record<string, unknown> | null;
  valorNuevo: Record<string, unknown> | null;
};

export type AuditListParams = {
  entidad?: string;
  accion?: AuditAction;
  idAutor?: number;
  // Búsqueda general por nombre, apellido o documento del autor (parcial, sin distinguir mayúsculas), mismo criterio que el `texto` de GET /estudiantes. Un evento sin autor (cambio directo en BD) no matchea.
  texto?: string;
  page?: number;
  size?: number;
};

// Detalle que guarda el backend en valorNuevo de un evento NOTIFICACION (AuditoriaService.registrarNotificacion): un correo de RF15 o de RF23, enviado o fallido. No trae el email del destinatario (RD01), solo su id y nombre.
export type DetalleNotificacion = {
  canal: string;
  tipo: string;
  idNegocio: string | null;
  destinatario: string | null;
  enviada: boolean;
  motivo: string | null;
};

// Texto de cada tipo de notificación que audita el backend.
const TIPO_NOTIFICACION: Record<string, string> = {
  INSTANCIA_CREADA: "Aviso de instancia registrada (RF15)",
  RECORDATORIO_PROXIMO: "Aviso de recordatorio próximo a vencer (RF23)",
};

export function detalleNotificacion(evento: AuditEvent): DetalleNotificacion | null {
  if (evento.accion !== "NOTIFICACION" || !evento.valorNuevo) return null;
  const v = evento.valorNuevo;
  const texto = (campo: string) => (typeof v[campo] === "string" && v[campo] !== "" ? (v[campo] as string) : null);
  const tipo = texto("tipo") ?? "";
  return {
    canal: texto("canal") === "EMAIL" ? "Correo electrónico" : (texto("canal") ?? "—"),
    tipo: TIPO_NOTIFICACION[tipo] ?? tipo,
    idNegocio: texto("id_negocio"),
    destinatario: texto("destinatario"),
    enviada: v.resultado === "ENVIADA",
    motivo: texto("motivo"),
  };
}

export function listAuditEvents(params: AuditListParams = {}): Promise<Page<AuditEvent>> {
  return apiGet<Page<AuditEvent>>("/auditorias", params);
}
