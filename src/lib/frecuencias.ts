import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";

export type TipoFrecuencia = "DIARIA" | "SEMANAL" | "MENSUAL" | "PERSONALIZADA";
export type DiaSemana = "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO" | "DOMINGO";

export const TIPOS_FRECUENCIA: Record<TipoFrecuencia, string> = {
  DIARIA: "Diaria",
  SEMANAL: "Semanal",
  MENSUAL: "Mensual",
  PERSONALIZADA: "Cada cierta cantidad de días",
};

export const DIAS_SEMANA: Record<DiaSemana, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

// GET /frecuencias (FrecuenciaResponseDTO). Catálogo de repeticiones de los recordatorios. No tiene permisos propios: comparte los de recordatorio (VER_RECORDATORIOS para leer, CREAR_/EDITAR_/DESACTIVAR_/REACTIVAR_RECORDATORIO para el resto).
export type Frecuencia = {
  idFrecuencia: number;
  descripcion: string;
  tipo: TipoFrecuencia;
  intDias: number | null;
  diaSemana: DiaSemana | null;
  estado: string;
};

// FrecuenciaRequestDTO: descripción obligatoria (máx. 50) y tipo. FrecuenciaService.validarCoherenciaFrecuencia exige diaSemana en SEMANAL e intDias (1 a 31) en PERSONALIZADA, y rechaza los dos en DIARIA y MENSUAL.
export type FrecuenciaInput = {
  descripcion: string;
  tipo: TipoFrecuencia;
  intDias?: number;
  diaSemana?: DiaSemana;
};

// Sin ?estado=, el backend devuelve solo las ACTIVAS.
export function listFrecuencias(estado?: string): Promise<Frecuencia[]> {
  return apiGet<Frecuencia[]>("/frecuencias", { estado });
}

export function createFrecuencia(dto: FrecuenciaInput): Promise<Frecuencia> {
  return apiPost<Frecuencia>("/frecuencias", dto);
}

export function updateFrecuencia(id: number, dto: FrecuenciaInput): Promise<Frecuencia> {
  return apiPut<Frecuencia>(`/frecuencias/${id}`, dto);
}

// El backend responde 409 si hay recordatorios activos que la usan.
export function deactivateFrecuencia(id: number): Promise<void> {
  return apiDelete<void>(`/frecuencias/${id}`);
}

export function reactivateFrecuencia(id: number): Promise<Frecuencia> {
  return apiPatch<Frecuencia>(`/frecuencias/${id}/reactivar`);
}

// Cómo se repite, en una frase: "Todos los días", "Todos los lunes", "Cada 15 días".
export function describirRegla(f: Pick<Frecuencia, "tipo" | "intDias" | "diaSemana">): string {
  switch (f.tipo) {
    case "DIARIA":
      return "Todos los días";
    case "SEMANAL":
      return f.diaSemana ? `Todos los ${DIAS_SEMANA[f.diaSemana].toLowerCase()}${f.diaSemana === "SABADO" || f.diaSemana === "DOMINGO" ? "s" : ""}` : "Todas las semanas";
    case "MENSUAL":
      return "Todos los meses";
    case "PERSONALIZADA":
      return f.intDias === 1 ? "Todos los días" : `Cada ${f.intDias} días`;
  }
}
