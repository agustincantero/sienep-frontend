import { apiDelete, apiGet, apiPostForm } from "./api";
import type { Page } from "./students";

// GET /informes-adjuntos — InformeAdjuntoResponseDTO. RF09.
export type MedicalReport = {
  idInforme: number;
  idUsuario: number;
  nombre: string;
  urlDescarga: string;
  estado: string;
  createdAt: string;
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

// Baja lógica.
export function deleteMedicalReport(id: number): Promise<void> {
  return apiDelete<void>(`/informes-adjuntos/${id}`);
}
