"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Eye, Pencil, UserCheck, UserX } from "lucide-react";
import { formatFechaHora } from "@/lib/format";
import type { Recordatorio } from "@/lib/recordatorios";
import { DataTable } from "@/components/ui/DataTable";
import { EstadoBadge } from "@/components/instancias/EstadoBadge";
import { EstadoOperativoBadge } from "./EstadoOperativoBadge";

type RecordatoriosTablaProps = {
  filas: Recordatorio[];
  // Query que se agrega a los links al detalle y a editar (ej. "?desde=instancia" desde el detalle de la instancia).
  query?: string;
  // Dentro del detalle de una instancia la columna "Instancia" sobra (todas las filas son de esa misma), y tampoco va "Ver detalle": en esa columna angosta no entra, y la fila ya abre el detalle con clic o Enter.
  sinInstancia?: boolean;
  // Identificador de negocio de cada instancia (ver useIdNegInstancias); la que no esté se muestra por su título.
  idNegInstancias?: Map<number, string>;
  puedeEditar?: boolean;
  puedeDesactivar?: boolean;
  puedeReactivar?: boolean;
  accionEnCursoId?: number | null;
  onDesactivar?: (codRecordatorio: number) => void;
  onReactivar?: (codRecordatorio: number) => void;
};

// Tabla de recordatorios, compartida por el listado general (/recordatorios) y por el detalle de la instancia, para que columnas y acciones sean las mismas en los dos lados (mismo criterio que InstanciasTabla).
export function RecordatoriosTabla({
  filas,
  query = "",
  sinInstancia = false,
  idNegInstancias,
  puedeEditar = false,
  puedeDesactivar = false,
  puedeReactivar = false,
  accionEnCursoId = null,
  onDesactivar,
  onReactivar,
}: RecordatoriosTablaProps) {
  const router = useRouter();
  const headers = sinInstancia
    ? ["Título", "Categoría", "Fecha", "Cuándo", "Estado", ""]
    : ["Título", "Instancia", "Categoría", "Fecha", "Cuándo", "Estado", ""];

  return (
    <DataTable headers={headers}>
      {filas.map((r) => {
        const hrefDetalle = `/recordatorios/${r.codRecordatorio}${query}`;
        // GET /recordatorios/{id} da 404 para uno inactivo (igual que instancias): esas filas se muestran, pero no se abren; solo ofrecen "Activar".
        const abrible = r.estado === "ACTIVO";
        // La campanita marca lo que pide atención: vencido o para hoy, y todavía activo.
        const pendiente = abrible && r.estadoOperativo !== "FUTURO";
        return (
          <tr
            key={r.codRecordatorio}
            className={
              abrible
                ? "cursor-pointer select-none"
                : undefined
            }
            onClick={abrible ? () => router.push(hrefDetalle) : undefined}
          >
            <td className="font-semibold">
              <span className="inline-flex items-center gap-1.5">
                {pendiente ? <Bell size={13} className="text-base-content/70 shrink-0" aria-label="Pendiente" /> : null}
                {r.titulo}
              </span>
            </td>
            {sinInstancia ? null : (
              <td className="text-sm whitespace-nowrap" title={r.tituloInstancia}>
                {idNegInstancias?.get(r.codInstancia) ?? r.tituloInstancia}
              </td>
            )}
            <td className="whitespace-nowrap">{r.nombreCategoria}</td>
            <td className="text-sm whitespace-nowrap">{formatFechaHora(r.fechaHora)}</td>
            <td>
              <EstadoOperativoBadge estado={r.estadoOperativo} />
            </td>
            <td>
              <EstadoBadge estado={r.estado} />
            </td>
            <td className="whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
              <div className="inline-flex gap-1">
                {abrible ? (
                  <Link href={hrefDetalle} className="btn btn-ghost btn-xs gap-1">
                    <Eye size={13} aria-hidden />
                    Ver detalle
                  </Link>
                ) : null}
                {abrible && puedeEditar ? (
                  <Link href={`/recordatorios/${r.codRecordatorio}/editar${query}`} className="btn btn-ghost btn-xs gap-1">
                    <Pencil size={13} aria-hidden />
                    Editar
                  </Link>
                ) : null}
                {r.estado === "ACTIVO" && puedeDesactivar ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs gap-1 text-error"
                    disabled={accionEnCursoId === r.codRecordatorio}
                    onClick={() => onDesactivar?.(r.codRecordatorio)}
                  >
                    <UserX size={13} aria-hidden />
                    Desactivar
                  </button>
                ) : null}
                {r.estado === "INACTIVO" && puedeReactivar ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs gap-1"
                    disabled={accionEnCursoId === r.codRecordatorio}
                    onClick={() => onReactivar?.(r.codRecordatorio)}
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
