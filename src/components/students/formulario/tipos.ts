import type { EstudianteFormState } from "@/lib/validaciones-estudiante";

// Props comunes de las secciones de StudentForm: el estado vive en StudentForm y cada sección solo lo pinta y avisa los cambios con `onCampo`.
export type SeccionEstudianteProps = {
  form: EstudianteFormState;
  errores: Record<string, string>;
  guardando: boolean;
  onCampo: <K extends keyof EstudianteFormState>(key: K, value: EstudianteFormState[K]) => void;
};
