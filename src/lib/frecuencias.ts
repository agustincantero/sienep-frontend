import { apiGet } from "./api";

// GET /frecuencias (FrecuenciaResponseDTO). Catálogo de repeticiones de los recordatorios; requiere VER_RECORDATORIOS.
export type Frecuencia = {
  idFrecuencia: number;
  descripcion: string;
  tipo: "DIARIA" | "SEMANAL" | "MENSUAL" | "PERSONALIZADA";
  intDias: number | null;
  diaSemana: string | null;
  estado: string;
};

// Sin ?estado=, el backend devuelve solo las ACTIVAS.
export function listFrecuencias(): Promise<Frecuencia[]> {
  return apiGet<Frecuencia[]>("/frecuencias");
}
