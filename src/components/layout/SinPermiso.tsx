import Link from "next/link";
import { ShieldAlert } from "lucide-react";

type SinPermisoProps = {
  volverHref: string;
  volverLabel: string;
};

// Lo que ve un usuario que llega por URL directa a una pantalla para la que no tiene permiso (el menú y los botones ya la ocultan, pero la ruta sigue existiendo). El backend igual rechazaría la operación con 403; esto evita mostrarle un formulario que no va a poder guardar.
export function SinPermiso({ volverHref, volverLabel }: SinPermisoProps) {
  return (
    <div className="grow overflow-auto">
      <div className="max-w-[720px] mx-auto w-full px-4 py-5">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body items-center text-center gap-2">
            <ShieldAlert size={32} aria-hidden className="text-warning" />
            <h1 className="text-xl font-bold">No tenés permiso para ver esta página</h1>
            <p className="text-sm text-base-content/70">
              Si creés que deberías tener acceso, consultá con un administrador.
            </p>
            <Link href={volverHref} className="btn btn-primary btn-sm mt-3">
              {volverLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
