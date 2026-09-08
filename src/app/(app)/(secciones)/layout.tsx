import { SeccionShell } from "@/components/layout/SeccionShell";

// Envuelve las páginas de módulo con el Sidebar (funcionario) / BackButton
// (estudiante). Todo lo que vaya en (app)/(secciones)/<modulo>/ queda con este
// chrome; /inicio, que está fuera de este grupo, no lo tiene.
export default function SeccionesLayout({ children }: { children: React.ReactNode }) {
  return <SeccionShell>{children}</SeccionShell>;
}
