"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Eye, Pencil, UserCheck, UserX } from "lucide-react";
import { formatFechaHora } from "@/lib/format";
import { DataTable } from "@/components/ui/DataTable";
import { EstadoBadge } from "./EstadoBadge";

// Campos que usa la tabla; InstanciaComun e Incidencia los tienen todos.
type FilaInstancia = {
  codInstancia: number;
  idNegInstancia: string | null;
  nombreEstudiante: string;
  fechaHora: string;
  nombreFuncionario: string;
  estado: string;
};

type InstanciasTablaProps = {
  filas: FilaInstancia[];
  // "/instancias" o "/incidencias": de ahí salen los links al detalle y a editar.
  basePath: "/instancias" | "/incidencias";
  // Query que se agrega a los links al detalle y a editar (ej. "?desde=estudiante" desde la ficha del estudiante).
  query?: string;
  // Sin columna de acciones ni filas clickeables: para el propio estudiante ("Mi perfil"), que no tiene VER_INSTANCIAS / VER_INCIDENCIAS y no puede abrir el detalle.
  soloLectura?: boolean;
  puedeEditar?: boolean;
  // Botón "Clonar" (RF17): solo tiene sentido para instancias comunes (basePath "/instancias").
  puedeClonar?: boolean;
  puedeDesactivar?: boolean;
  puedeReactivar?: boolean;
  accionEnCursoId?: number | null;
  onDesactivar?: (codInstancia: number) => void;
  onReactivar?: (codInstancia: number) => void;
};

// Tabla de instancias / incidencias, compartida por los listados generales (/instancias, /incidencias) y por las pestañas de la ficha del estudiante, para que las columnas y acciones sean exactamente las mismas en todos lados. Las dos entidades se listan igual; solo cambia la ruta base.
export function InstanciasTabla({
  filas,
  basePath,
  query = "",
  soloLectura = false,
  puedeEditar = false,
  puedeClonar = false,
  puedeDesactivar = false,
  puedeReactivar = false,
  accionEnCursoId = null,
  onDesactivar,
  onReactivar,
}: InstanciasTablaProps) {
  const router = useRouter();
  const columnas = ["Identificador", "Estudiante", "Fecha", "Responsable", "Estado"];

  return (
    <DataTable headers={soloLectura ? columnas : [...columnas, ""]}>
      {filas.map((i) => {
        const hrefDetalle = `${basePath}/${i.codInstancia}${query}`;
        if (soloLectura) {
          return (
            <tr key={i.codInstancia}>
              <CeldasDeDatos fila={i} />
            </tr>
          );
        }
        // GET /instancias/{id} y GET /incidencias/{id} (y por ende el detalle y la edición) dan 404 para una inactiva: esas filas se muestran, pero no se abren; solo ofrecen "Activar".
        const abrible = i.estado === "ACTIVO";
        return (
          <tr
            key={i.codInstancia}
            className={
              abrible
                ? "cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                : undefined
            }
            tabIndex={abrible ? 0 : undefined}
            onClick={abrible ? () => router.push(hrefDetalle) : undefined}
            onKeyDown={
              abrible
                ? (ev) => {
                    if (ev.key === "Enter") router.push(hrefDetalle);
                  }
                : undefined
            }
          >
            <CeldasDeDatos fila={i} />
            <td className="whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
              <div className="inline-flex gap-1">
                {abrible ? (
                  <Link href={hrefDetalle} className="btn btn-ghost btn-xs gap-1">
                    <Eye size={13} aria-hidden />
                    Ver detalle
                  </Link>
                ) : null}
                {abrible && puedeEditar ? (
                  <Link href={`${basePath}/${i.codInstancia}/editar${query}`} className="btn btn-ghost btn-xs gap-1">
                    <Pencil size={13} aria-hidden />
                    Editar
                  </Link>
                ) : null}
                {abrible && puedeClonar ? (
                  <Link href={`/instancias/nuevo?clonar=${i.codInstancia}`} className="btn btn-ghost btn-xs gap-1">
                    <Copy size={13} aria-hidden />
                    Clonar
                  </Link>
                ) : null}
                {i.estado === "ACTIVO" && puedeDesactivar ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs gap-1 text-error"
                    disabled={accionEnCursoId === i.codInstancia}
                    onClick={() => onDesactivar?.(i.codInstancia)}
                  >
                    <UserX size={13} aria-hidden />
                    Desactivar
                  </button>
                ) : null}
                {i.estado === "INACTIVO" && puedeReactivar ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs gap-1"
                    disabled={accionEnCursoId === i.codInstancia}
                    onClick={() => onReactivar?.(i.codInstancia)}
                  >
                    <UserCheck size={13} aria-hidden />
                    Activar
                  </button>
                ) : null}
              </div>
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}

// Columnas de datos, iguales en el modo normal y en el de solo lectura.
function CeldasDeDatos({ fila }: { fila: FilaInstancia }) {
  return (
    <>
      <td className="text-sm whitespace-nowrap">{fila.idNegInstancia}</td>
      <td className="font-semibold whitespace-nowrap">{fila.nombreEstudiante}</td>
      <td className="text-sm whitespace-nowrap">{formatFechaHora(fila.fechaHora)}</td>
      <td className="whitespace-nowrap">{fila.nombreFuncionario}</td>
      <td>
        <EstadoBadge estado={fila.estado} />
      </td>
    </>
  );
}
