import { iniciales } from "@/lib/format";

type StudentAvatarProps = {
  nombre: string;
  apellido: string;
  urlFoto?: string | null;
  size?: "sm" | "lg";
};

// Foto (proxy autenticado /api/<urlFoto>) o iniciales sobre fondo neutral si no tiene.
// Mismo componente en la fila de la tabla (sm) y en el header de la ficha (lg, con
// anillo celeste tenue para separarlo del fondo).
export function StudentAvatar({ nombre, apellido, urlFoto, size = "sm" }: StudentAvatarProps) {
  const dimension = size === "lg" ? "w-16" : "w-8";
  const texto = size === "lg" ? "text-lg" : "text-xs";
  const anillo = size === "lg" ? "ring-2 ring-primary/25 ring-offset-2 ring-offset-base-100" : "";

  return (
    <div className="avatar avatar-placeholder">
      <div className={`bg-neutral text-neutral-content rounded-full ${dimension} ${texto} ${anillo}`}>
        {urlFoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto servida por el proxy autenticado, no un asset estático de Next
          <img src={`/api${urlFoto}`} alt="" className="rounded-full" />
        ) : (
          <span>{iniciales(nombre, apellido)}</span>
        )}
      </div>
    </div>
  );
}
