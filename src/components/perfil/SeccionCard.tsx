import type { LucideIcon } from "lucide-react";

// Card de sección de "Mi perfil": mismas clases que SeccionCard + SeccionLegend de StudentForm, para que el perfil se vea como el resto de los formularios. Ojo: el `fieldset` de daisyUI baja todo su contenido a text-xs, así que el texto de adentro tiene que fijar su tamaño (text-sm) explícitamente.
export function SeccionCard({
  icon: Icon,
  titulo,
  children,
}: {
  icon: LucideIcon;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="fieldset space-y-3 p-4 rounded-box border border-base-300">
      <legend className="fieldset-legend text-sm font-semibold text-base-content mb-1 gap-1.5">
        <Icon size={15} aria-hidden className="text-primary" />
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}
