"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { formatFechaHora } from "@/lib/format";
import { listMisIncidencias } from "@/lib/incidencias";
import { listMisInstancias } from "@/lib/instancias";
import type { Page } from "@/lib/students";
import { DataTable } from "@/components/ui/DataTable";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { SeccionCard } from "./SeccionCard";

// Más recientes primero: es lo primero que se busca al revisar el propio historial.
const ORDEN = "fechaHora,desc";

type Fila = {
  id: number;
  titulo: string;
  extra: string | null;
  fechaHora: string;
  responsable: string;
};

// "Mis instancias e incidencias" del estudiante, contra GET /instancias/mis-instancias y GET /incidencias/mis-incidencias (solo las ACTIVAS). Solo lectura y sin link al detalle: GET /instancias/{id} y GET /incidencias/{id} exigen VER_INSTANCIAS / VER_INCIDENCIAS, que el rol ESTUDIANTE no tiene.
export function MisInstanciasCard() {
  return (
    <SeccionCard icon={ClipboardList} titulo="Mis instancias e incidencias">
      <Listado
        titulo="Instancias"
        noun="instancias"
        vacio="No tenés instancias registradas."
        columnaExtra="Categoría"
        cargar={(page) =>
          listMisInstancias({ page, sort: ORDEN }).then((res) =>
            aFilas(res, (i) => ({
              id: i.codInstancia,
              titulo: i.titulo,
              extra: i.nombreCategoria,
              fechaHora: i.fechaHora,
              responsable: i.nombreFuncionario,
            })),
          )
        }
      />
      <Listado
        titulo="Incidencias"
        noun="incidencias"
        vacio="No tenés incidencias registradas."
        columnaExtra="Lugar"
        cargar={(page) =>
          listMisIncidencias({ page, sort: ORDEN }).then((res) =>
            aFilas(res, (i) => ({
              id: i.codInstancia,
              titulo: i.titulo,
              extra: i.lugar,
              fechaHora: i.fechaHora,
              responsable: i.nombreFuncionario,
            })),
          )
        }
      />
    </SeccionCard>
  );
}

function aFilas<T>(res: Page<T>, fila: (item: T) => Fila): Page<Fila> {
  return { ...res, content: res.content.map(fila) };
}

function Listado({
  titulo,
  noun,
  vacio,
  columnaExtra,
  cargar,
}: {
  titulo: string;
  noun: string;
  vacio: string;
  columnaExtra: string;
  cargar: (page: number) => Promise<Page<Fila>>;
}) {
  const [page, setPage] = useState(0);
  const [resultado, setResultado] = useState<Page<Fila> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // cancelado: si se cambia de página mientras un pedido sigue en vuelo, la respuesta vieja no pisa la nueva.
  useEffect(() => {
    let cancelado = false;
    cargar(page)
      .then((res) => {
        if (cancelado) return;
        setResultado(res);
        setError("");
      })
      .catch((err) => {
        if (cancelado) return;
        setError(apiErrorMessage(err, `No se pudieron cargar tus ${noun}.`));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cargar/noun son fijos por listado; solo la página debe re-disparar el fetch
  }, [page]);

  const filas = resultado?.content ?? [];

  return (
    <div className="text-sm">
      <h3 className="font-semibold text-base-content mb-1">
        {titulo}
        {resultado ? <span className="text-base-content/60 font-normal"> ({resultado.totalElements})</span> : null}
      </h3>

      {error ? (
        <div role="alert" className="alert alert-error alert-soft text-sm">
          <span>{error}</span>
        </div>
      ) : cargando ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner loading-sm" />
        </div>
      ) : filas.length === 0 ? (
        <p className="text-base-content/60 py-1">{vacio}</p>
      ) : (
        <>
          <DataTable headers={["Fecha", "Título", columnaExtra, "Responsable"]}>
            {filas.map((f) => (
              <tr key={f.id}>
                <td className="whitespace-nowrap">{formatFechaHora(f.fechaHora)}</td>
                <td className="font-semibold">{f.titulo}</td>
                <td>{f.extra || "—"}</td>
                <td className="whitespace-nowrap">{f.responsable}</td>
              </tr>
            ))}
          </DataTable>
          {resultado && resultado.totalPages > 1 ? (
            <PaginationFooter
              shown={filas.length}
              total={resultado.totalElements}
              noun={noun}
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
  );
}
