"use client";

import { useEffect, useState } from "react";
import { Download, Paperclip } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { formatFechaHora } from "@/lib/format";
import { listMisInformes, type MedicalReport } from "@/lib/medical-reports";
import type { Page } from "@/lib/students";
import { PaginationFooter } from "@/components/ui/PaginationFooter";

// "Mis informes" del estudiante, contra GET /informes-adjuntos/mios: el backend toma el id del token y devuelve solo
// los ACTIVOS, así que acá no hay marcas de eliminados como en la ficha. Solo lectura: los informes los adjunta el
// personal desde la ficha (MedicalReportsPanel). Más recientes primero.
export function MisInformes() {
  const [page, setPage] = useState(0);
  const [resultado, setResultado] = useState<Page<MedicalReport> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Cambiar de página vuelve a pedir la lista: el spinner se prende acá y no en el efecto, para no mostrar mientras tanto
  // las filas de la página anterior con el pie de la nueva.
  function cambiarPagina(nueva: number) {
    setCargando(true);
    setPage(nueva);
  }

  // cancelado: si se cambia de página mientras un pedido sigue en vuelo, la respuesta vieja no pisa la nueva.
  useEffect(() => {
    let cancelado = false;
    listMisInformes(page)
      .then((res) => {
        if (cancelado) return;
        setResultado(res);
        setError("");
      })
      .catch((err) => {
        if (cancelado) return;
        setError(apiErrorMessage(err, "No se pudieron cargar tus informes."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [page]);

  const informes = resultado?.content ?? [];

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[980px] mx-auto w-full px-4 py-5">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Paperclip size={20} aria-hidden className="text-primary" />
          Mis informes
        </h1>

        <div className="text-sm">
          {error ? (
            <div role="alert" className="alert alert-error alert-soft text-sm">
              <span>{error}</span>
            </div>
          ) : cargando ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner loading-sm" role="status" aria-label="Cargando" />
            </div>
          ) : informes.length === 0 ? (
            <p className="text-base-content/70 py-1">No tenés informes adjuntos.</p>
          ) : (
            <>
              <ul className="divide-y divide-base-300">
                {informes.map((inf) => (
                  <li
                    key={inf.idInforme}
                    className="px-2 -mx-2 rounded-field flex items-center justify-between gap-3 transition-colors hover:bg-base-200"
                  >
                    {/* Vista previa en pestaña nueva con ?inline=true, igual que en la ficha (la CSP no permite embeber PDFs). */}
                    <a
                      href={`/api${inf.urlDescarga}?inline=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-hover truncate flex items-center gap-2 py-2"
                      title="Ver (se abre en una pestaña nueva)"
                    >
                      <Paperclip size={14} aria-hidden className="text-base-content/70 shrink-0" />
                      <span className="truncate">{inf.nombre}</span>
                    </a>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-base-content/70">{formatFechaHora(inf.createdAt)}</span>
                      <a
                        href={`/api${inf.urlDescarga}`}
                        download
                        className="btn btn-ghost btn-xs btn-circle"
                        aria-label={`Descargar informe "${inf.nombre}"`}
                        title="Descargar"
                      >
                        <Download size={14} aria-hidden />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
              {resultado ? (
                <PaginationFooter
                  shown={informes.length}
                  total={resultado.totalElements}
                  noun="informes"
                  page={page}
                  pageSize={resultado.size}
                  hasPrevious={page > 0}
                  hasNext={!resultado.last}
                  onPrevious={() => cambiarPagina(Math.max(0, page - 1))}
                  onNext={() => cambiarPagina(page + 1)}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
