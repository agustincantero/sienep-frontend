"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Eye, TriangleAlert } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { formatFechaHora } from "@/lib/format";
import { listIncidencias, type Incidencia } from "@/lib/incidencias";
import { listInstancias, type InstanciaComun } from "@/lib/instancias";
import { useSession } from "@/lib/session-context";
import type { Page } from "@/lib/students";
import { DataTable } from "@/components/ui/DataTable";
import { PaginationFooter } from "@/components/ui/PaginationFooter";

// Pestaña "Instancias e incidencias" de la ficha del estudiante: lista las de ese estudiante y cada fila lleva a su pantalla de detalle. Solo las ACTIVAS (default del backend sin ?estado=): GET /instancias/{id} y GET /incidencias/{id} responden 404 para una inactiva, así que listarlas acá llevaría a un detalle que no abre.
export function StudentInstanciasPanel({ idEstudiante }: { idEstudiante: number }) {
  const { permisos } = useSession();
  const puedeVerInstancias = permisos.includes("VER_INSTANCIAS");
  const puedeVerIncidencias = permisos.includes("VER_INCIDENCIAS");

  if (!puedeVerInstancias && !puedeVerIncidencias) {
    return (
      <p className="text-base-content/60 text-sm">
        No tenés permiso para ver las instancias ni las incidencias de este estudiante.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {puedeVerInstancias ? <InstanciasDelEstudiante idEstudiante={idEstudiante} /> : null}
      {puedeVerIncidencias ? <IncidenciasDelEstudiante idEstudiante={idEstudiante} /> : null}
    </div>
  );
}

// Carga paginada atada a un estudiante. cancelado: si cambia el estudiante o la página mientras un pedido sigue en vuelo, la respuesta vieja no pisa la nueva (mismo criterio que StudentProfile).
function usePaginaDelEstudiante<T>(
  idEstudiante: number,
  cargar: (idEstudiante: number, page: number) => Promise<Page<T>>,
  mensajeError: string,
) {
  const [page, setPage] = useState(0);
  const [resultado, setResultado] = useState<Page<T> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    cargar(idEstudiante, page)
      .then((res) => {
        if (cancelado) return;
        setResultado(res);
        setError("");
      })
      .catch((err) => {
        if (cancelado) return;
        setError(apiErrorMessage(err, mensajeError));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cargar/mensajeError son constantes de cada sección, no deben re-disparar el fetch
  }, [idEstudiante, page]);

  return { page, setPage, resultado, cargando, error };
}

// Más recientes primero: es lo primero que se busca al revisar el historial de un estudiante.
const ORDEN = "fechaHora,desc";

function cargarInstancias(idEstudiante: number, page: number) {
  return listInstancias({ idEstudiante, page, sort: ORDEN });
}

function cargarIncidencias(idEstudiante: number, page: number) {
  return listIncidencias({ idEstudiante, page, sort: ORDEN });
}

function InstanciasDelEstudiante({ idEstudiante }: { idEstudiante: number }) {
  const pagina = usePaginaDelEstudiante<InstanciaComun>(
    idEstudiante,
    cargarInstancias,
    "No se pudieron cargar las instancias del estudiante.",
  );

  return (
    <Seccion
      titulo="Instancias"
      icono={<ClipboardList size={15} aria-hidden className="text-primary" />}
      noun="instancias"
      vacio="Este estudiante no tiene instancias activas."
      columnaExtra="Categoría"
      pagina={pagina}
      fila={(i) => ({
        id: i.codInstancia,
        href: `/instancias/${i.codInstancia}?desde=estudiante`,
        identificador: i.idNegInstancia,
        titulo: i.titulo,
        extra: i.nombreCategoria,
        fechaHora: i.fechaHora,
        responsable: i.nombreFuncionario,
      })}
    />
  );
}

function IncidenciasDelEstudiante({ idEstudiante }: { idEstudiante: number }) {
  const pagina = usePaginaDelEstudiante<Incidencia>(
    idEstudiante,
    cargarIncidencias,
    "No se pudieron cargar las incidencias del estudiante.",
  );

  return (
    <Seccion
      titulo="Incidencias"
      icono={<TriangleAlert size={15} aria-hidden className="text-primary" />}
      noun="incidencias"
      vacio="Este estudiante no tiene incidencias activas."
      columnaExtra="Lugar"
      pagina={pagina}
      fila={(i) => ({
        id: i.codInstancia,
        href: `/incidencias/${i.codInstancia}?desde=estudiante`,
        identificador: i.idNegInstancia,
        titulo: i.titulo,
        extra: i.lugar,
        fechaHora: i.fechaHora,
        responsable: i.nombreFuncionario,
      })}
    />
  );
}

type Fila = {
  id: number;
  href: string;
  identificador: string | null;
  titulo: string;
  extra: string | null;
  fechaHora: string;
  responsable: string;
};

type SeccionProps<T> = {
  titulo: string;
  icono: React.ReactNode;
  noun: string;
  vacio: string;
  // Única columna que difiere entre instancias (Categoría) e incidencias (Lugar).
  columnaExtra: string;
  pagina: ReturnType<typeof usePaginaDelEstudiante<T>>;
  fila: (item: T) => Fila;
};

function Seccion<T>({ titulo, icono, noun, vacio, columnaExtra, pagina, fila }: SeccionProps<T>) {
  const router = useRouter();
  const { page, setPage, resultado, cargando, error } = pagina;
  const filas = resultado?.content.map(fila) ?? [];

  return (
    <section>
      <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
        {icono}
        {titulo}
        {resultado ? <span className="text-base-content/60 font-normal">({resultado.totalElements})</span> : null}
      </h2>

      {error ? (
        <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
          <span>{error}</span>
        </div>
      ) : null}

      {cargando ? (
        <div className="flex justify-center py-6">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : filas.length === 0 ? (
        error ? null : <p className="text-base-content/60 text-sm py-2">{vacio}</p>
      ) : (
        <>
          <DataTable headers={["Identificador", "Título", columnaExtra, "Fecha", "Responsable", ""]}>
            {filas.map((f) => (
              <tr
                key={f.id}
                className="cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                tabIndex={0}
                onClick={() => router.push(f.href)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") router.push(f.href);
                }}
              >
                <td className="text-sm whitespace-nowrap">{f.identificador ?? "—"}</td>
                <td className="font-semibold">{f.titulo}</td>
                <td>{f.extra || "—"}</td>
                <td className="text-sm whitespace-nowrap">{formatFechaHora(f.fechaHora)}</td>
                <td className="whitespace-nowrap">{f.responsable}</td>
                <td className="whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                  <Link href={f.href} className="btn btn-ghost btn-xs gap-1">
                    <Eye size={13} aria-hidden />
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>

          <PaginationFooter
            shown={filas.length}
            total={resultado?.totalElements ?? 0}
            noun={noun}
            page={page}
            pageSize={resultado?.size}
            hasPrevious={page > 0}
            hasNext={resultado ? !resultado.last : false}
            onPrevious={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </section>
  );
}
