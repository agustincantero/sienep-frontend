"use client";

import { Fragment, useEffect, useState } from "react";
import { apiErrorMessage } from "@/lib/api";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  describeAccion,
  listAuditEvents,
  type AuditAction,
  type AuditEvent,
} from "@/lib/audit";
import { formatFechaHora } from "@/lib/format";
import { DataTable } from "@/components/ui/DataTable";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";

// null/undefined -> "—" (campo no presente en ese lado del diff); objetos/arrays (no debería darse en estas filas, que son de to_jsonb(ROW) plano, pero por las dudas) -> JSON; el resto, texto plano.
function formatValor(valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

// valorAnterior/valorNuevo son la FILA ENTERA (to_jsonb(OLD)/to_jsonb(NEW) del trigger), no solo el campo que cambió, así que se arma la unión de claves de ambos lados y se resalta lo que difiere.
function DetalleEvento({ evento }: { evento: AuditEvent }) {
  const { valorAnterior, valorNuevo } = evento;

  if (!valorAnterior && !valorNuevo) {
    return (
      <p className="text-sm text-base-content/60 py-2">
        Este evento no modifica datos (inicio o cierre de sesión): no tiene valores antes/después.
      </p>
    );
  }

  const campos = [...new Set([...Object.keys(valorAnterior ?? {}), ...Object.keys(valorNuevo ?? {})])];

  return (
    <table className="table table-sm align-middle" aria-label={`Detalle del cambio en ${evento.entidad}`}>
      <thead>
        <tr>
          <th>Campo</th>
          <th>Valor anterior</th>
          <th>Valor nuevo</th>
        </tr>
      </thead>
      <tbody>
        {campos.map((campo) => {
          const textoAnterior = formatValor(valorAnterior?.[campo]);
          const textoNuevo = formatValor(valorNuevo?.[campo]);
          const cambio = textoAnterior !== textoNuevo;
          return (
            <tr key={campo}>
              <td>{campo}</td>
              <td className={cambio && valorAnterior ? "text-error" : "text-base-content/60"}>{textoAnterior}</td>
              <td className={cambio && valorNuevo ? "text-success font-semibold" : ""}>{textoNuevo}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Espera a que el usuario termine de tipear antes de pegarle a la API (evita un request por tecla en el buscador).
function useDebounced<T>(valor: T, ms: number): T {
  const [debounced, setDebounced] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return debounced;
}

export function AuditListView() {
  const [texto, setTexto] = useState("");
  const [entidad, setEntidad] = useState("");
  const [accion, setAccion] = useState("");
  const [page, setPage] = useState(0);
  const textoDebounced = useDebounced(texto, 300);

  const [eventos, setEventos] = useState<AuditEvent[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [hasNext, setHasNext] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [expandidoId, setExpandidoId] = useState<number | null>(null);

  // Cualquier cambio de filtro vuelve a la primera página.
  function conResetDePagina<T>(setter: (valor: T) => void) {
    return (valor: T) => {
      setter(valor);
      setPage(0);
    };
  }
  const handleTextoChange = conResetDePagina(setTexto);
  const handleEntidadChange = conResetDePagina(setEntidad);
  const handleAccionChange = conResetDePagina(setAccion);

  useEffect(() => {
    let cancelado = false;

    listAuditEvents({
      texto: textoDebounced || undefined,
      entidad: entidad || undefined,
      accion: (accion || undefined) as AuditAction | undefined,
      page,
    })
      .then((res) => {
        if (cancelado) return;
        setEventos(res.content);
        setTotalElements(res.totalElements);
        setPageSize(res.size);
        setHasNext(!res.last);
        setError("");
      })
      .catch((err) => {
        if (cancelado) return;
        setError(apiErrorMessage(err, "No se pudieron cargar los eventos de auditoría."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [textoDebounced, entidad, accion, page]);

  const filters: ToolbarFilter[] = [
    { label: "Entidad", emptyLabel: "Todas", options: AUDIT_ENTITIES, value: entidad, onChange: handleEntidadChange },
    { label: "Acción", emptyLabel: "Todas", options: AUDIT_ACTIONS, value: accion, onChange: handleAccionChange },
  ];

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[1160px] mx-auto w-full px-4 py-5">
        <SectionHeader title="Auditoría" />

        <Toolbar
          placeholder="Buscar por nombre, apellido o documento del autor"
          searchValue={texto}
          onSearchChange={handleTextoChange}
          filters={filters}
        />

        {error ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
            <span>{error}</span>
          </div>
        ) : null}

        {cargando ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : eventos.length === 0 ? (
          <p className="text-base-content/60 py-6 text-center">No se encontraron eventos de auditoría.</p>
        ) : (
          <>
            <DataTable headers={["Fecha y hora", "Usuario", "Acción", "Entidad", "Usuario BD", "IP", ""]}>
              {eventos.map((evento) => {
                const expandido = expandidoId === evento.idAuditoria;
                const detalleId = `detalle-auditoria-${evento.idAuditoria}`;
                return (
                  <Fragment key={evento.idAuditoria}>
                    <tr>
                      <td className="whitespace-nowrap">{formatFechaHora(evento.fechaHora)}</td>
                      <td>
                        {evento.nombreAutor ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{evento.nombreAutor}</span>
                            {evento.documentoAutor ? (
                              <span className="text-xs text-base-content/60">{evento.documentoAutor}</span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-base-content/50 italic">Acción directa en BD</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-sm ${describeAccion(evento.accion).badgeClass}`}>
                          {evento.accion}
                        </span>
                      </td>
                      <td>{evento.entidad}</td>
                      <td className="text-base-content/60">{evento.usuarioBd ?? "—"}</td>
                      <td className="text-base-content/60">{evento.ip ?? "—"}</td>
                      <td className="whitespace-nowrap">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          aria-expanded={expandido}
                          aria-controls={detalleId}
                          onClick={() => setExpandidoId(expandido ? null : evento.idAuditoria)}
                        >
                          {expandido ? "Ocultar" : "Ver detalle"}
                        </button>
                      </td>
                    </tr>
                    {expandido ? (
                      <tr id={detalleId}>
                        <td colSpan={7} className="bg-base-200">
                          <DetalleEvento evento={evento} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </DataTable>

            <PaginationFooter
              shown={eventos.length}
              total={totalElements}
              noun="eventos"
              page={page}
              pageSize={pageSize}
              hasPrevious={page > 0}
              hasNext={hasNext}
              onPrevious={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </div>
    </div>
  );
}
