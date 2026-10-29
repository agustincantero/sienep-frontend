"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { listMisComentarios } from "@/lib/comments";
import { formatFechaHora } from "@/lib/format";
import { PaginationFooter } from "@/components/ui/PaginationFooter";

// Mismo prefijo de cita que arma StudentCommentsPanel al citar otro comentario: acá solo se quita para mostrar el
// texto limpio. Al estudiante no se le muestra a qué comentario responde, porque el citado puede ser confidencial.
const CITA_REGEX = /^\[\[cita:(normal|confidencial):(\d+)\]\]\n/;

// "Mis comentarios" del estudiante, contra GET /comentarios-normales-estudiante sin idEstudiante: el backend devuelve
// solo los del usuario autenticado (y solo los ACTIVOS). Solo lectura, más recientes primero. Los confidenciales no
// se muestran: el rol ESTUDIANTE no tiene permiso para verlos.
export function MisComentarios() {
  const [page, setPage] = useState(0);
  const { data: resultado, cargando, errorCarga: error } = useApi(() => listMisComentarios(page), [page], {
    mensajeError: "No se pudieron cargar tus comentarios.",
  });


  const comentarios = resultado?.content ?? [];

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[980px] mx-auto w-full px-4 py-5">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MessageSquare size={20} aria-hidden className="text-primary" />
          Mis comentarios
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
          ) : comentarios.length === 0 ? (
            <p className="text-base-content/70 py-1">No tenés comentarios registrados.</p>
          ) : (
            <>
              <ul className="divide-y divide-base-300">
                {comentarios.map((c) => (
                  <li key={c.id} className="py-2">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold">{c.nombreAutor}</span>
                      <span className="text-xs text-base-content/70">{formatFechaHora(c.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap mt-1">{c.contenido.replace(CITA_REGEX, "")}</p>
                  </li>
                ))}
              </ul>
              {resultado ? (
                <PaginationFooter
                  shown={comentarios.length}
                  total={resultado.totalElements}
                  noun="comentarios"
                  page={page}
                  pageSize={resultado.size}
                  hasPrevious={page > 0}
                  hasNext={!resultado.last}
                  onPrevious={() => setPage((p) => Math.max(0, p - 1))}
                  onNext={() => setPage((p) => p + 1)}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
