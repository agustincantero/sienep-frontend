import Link from "next/link";
import { Ban, Pencil, RotateCcw } from "lucide-react";

type AccionesFilaProps = {
  activo: boolean;
  nombre: string;
  enCurso: boolean;
  puedeEditar: boolean;
  puedeDesactivar: boolean;
  puedeReactivar: boolean;
  editarHref: string;
  onDesactivar: () => void;
  onReactivar: () => void;
};

// Mismas acciones y estilo que la columna de Roles. "Editar" solo en filas activas: los cinco services del backend responden 409 al editar algo inactivo ("reactívela primero").
export function AccionesFila({
  activo,
  nombre,
  enCurso,
  puedeEditar,
  puedeDesactivar,
  puedeReactivar,
  editarHref,
  onDesactivar,
  onReactivar,
}: AccionesFilaProps) {
  return (
    <div className="inline-flex gap-1">
      {activo && puedeEditar ? (
        <Link href={editarHref} className="btn btn-ghost btn-xs gap-1" aria-label={`Editar ${nombre}`}>
          <Pencil size={13} aria-hidden />
          Editar
        </Link>
      ) : null}
      {activo && puedeDesactivar ? (
        <button
          type="button"
          className="btn btn-ghost btn-xs gap-1 text-error"
          disabled={enCurso}
          onClick={onDesactivar}
          aria-label={`Desactivar ${nombre}`}
        >
          <Ban size={13} aria-hidden />
          Desactivar
        </button>
      ) : null}
      {!activo && puedeReactivar ? (
        <button type="button" className="btn btn-ghost btn-xs gap-1" disabled={enCurso} onClick={onReactivar} aria-label={`Activar ${nombre}`}>
          {enCurso ? <span className="loading loading-spinner loading-xs" /> : <RotateCcw size={13} aria-hidden />}
          Activar
        </button>
      ) : null}
    </div>
  );
}
