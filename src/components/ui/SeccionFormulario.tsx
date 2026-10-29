import type { LucideIcon } from "lucide-react";

// Encabezado de sección de un formulario: sentence case con peso real — el estilo
// tracked-out en mayúscula queda reservado para rótulos secundarios como el
// del Sidebar, no para cinco títulos apilados en la misma pantalla. El ícono
// es el mismo lenguaje que las tabs de la ficha (StudentProfile).
export function SeccionLegend({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <legend className="fieldset-legend text-sm font-semibold text-base-content mb-1 gap-1.5">
      <Icon size={15} aria-hidden className="text-primary" />
      {children}
    </legend>
  );
}

// Cada sección del formulario es su propia card — con cinco fieldsets apilados sin
// separación visual, la pantalla se sentía como un solo bloque de texto
// interminable. El radius acá es --radius-box (redondeado), igual que el
// resto de las cards de la app; los controles adentro siguen con
// --radius-field (casi recto).
export function SeccionCard({ children }: { children: React.ReactNode }) {
  return (
    <fieldset className="fieldset space-y-3 p-4 rounded-box border border-base-300">{children}</fieldset>
  );
}
