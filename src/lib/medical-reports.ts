import { apiDelete, apiGet, apiPostForm } from "./api";
import type { Page } from "./students";

// GET /informes-adjuntos — InformeAdjuntoResponseDTO. RF09.
export type MedicalReport = {
  idInforme: number;
  idUsuario: number;
  nombre: string;
  // null en un informe ELIMINADO: el backend lo sigue listando como marca de que existió, sin descarga.
  urlDescarga: string | null;
  estado: string;
  createdAt: string;
  // Si está ELIMINADO, fecha de la eliminación.
  updatedAt: string;
};

export function listMedicalReports(idEstudiante: number, page = 0): Promise<Page<MedicalReport>> {
  return apiGet<Page<MedicalReport>>("/informes-adjuntos", { idUsuario: idEstudiante, page });
}

// multipart/form-data: idUsuario, nombre, archivo (PDF/JPG/JPEG/PNG, máx. 5MB).
export function attachMedicalReport(idEstudiante: number, nombre: string, archivo: File): Promise<MedicalReport> {
  const formData = new FormData();
  formData.set("idUsuario", String(idEstudiante));
  formData.set("nombre", nombre);
  formData.set("archivo", archivo);
  return apiPostForm<MedicalReport>("/informes-adjuntos", formData);
}

// Baja lógica: el informe pasa a ELIMINADO y se sigue listando, sin descarga, como marca de que existió.
export function deleteMedicalReport(id: number): Promise<void> {
  return apiDelete<void>(`/informes-adjuntos/${id}`);
}
