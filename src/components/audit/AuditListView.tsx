"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  describeAccion,
  detalleNotificacion,
  listAuditEvents,
  type AuditAction,
  type AuditEvent,
} from "@/lib/audit";
import {
  coincidenciasPersona,
  MAX_COINCIDENCIAS,
  paginarMezclado,
  TAMANIO_PAGINA,
  todosLosEstudiantesConInactivos,
  todosLosFuncionarios,
} from "@/lib/buscar-estudiante";
import { formatFechaHora } from "@/lib/format";
import { AuditDetalleEvento } from "./AuditDetalleEvento";
import { DataTable } from "@/components/ui/DataTable";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";

type Resultado = { content: AuditEvent[]; total: number; last: boolean; demasiados?: boolean };
const SIN_RESULTADOS: Resultado = { content: [], total: 0, last: true };

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

  const {
    data: resultado,
    cargando,
    errorCarga: error,
  } = useApi(
    () => {
      const filtros = { entidad: entidad || undefined, accion: (accion || undefined) as AuditAction | undefined };
      const buscado = textoDebounced.trim();

      // El `texto` del backend no ignora tildes ni acepta "Nombre Apellido": se resuelve el autor acá (estudiantes y funcionarios) y se filtra por idAutor.
      const pedido: Promise<Resultado> = buscado
        ? Promise.allSettled([todosLosEstudiantesConInactivos(), todosLosFuncionarios()]).then(async (listas) => {
            // Con una sola lista caída (ej. 403 por permisos) la búsqueda local perdería autores sin avisar: se deja el filtro original del backend.
            if (listas.some((l) => l.status === "rejected")) {
              const res = await listAuditEvents({ ...filtros, texto: buscado, page });
              return { content: res.content, total: res.totalElements, last: res.last };
            }
            const personas = listas.flatMap((l) => (l.status === "fulfilled" ? l.value : []));
            const autores = coincidenciasPersona(personas, buscado);
            if (autores.length === 0 || autores.length > MAX_COINCIDENCIAS) {
              return { content: [], total: 0, last: true, demasiados: autores.length > MAX_COINCIDENCIAS };
            }
            const r = await paginarMezclado(
              autores.map((a) => a.idUsuario),
              (idAutor, size) => listAuditEvents({ ...filtros, idAutor, size }),
              page,
              (e) => e.idAuditoria,
            );
            return { content: r.content, total: r.total, last: (page + 1) * TAMANIO_PAGINA >= r.total };
          })
        : listAuditEvents({ ...filtros, page }).then((res) => ({ content: res.content, total: res.totalElements, last: res.last }));
      return pedido;
    },
    [textoDebounced, entidad, accion, page],
    { inicial: SIN_RESULTADOS, mensajeError: "No se pudieron cargar los eventos de auditoría." },
  );
  const { content: eventos, total: totalElements } = resultado;
  const hasNext = !resultado.last;
  // Más autores coinciden con el texto que los que se consultan a la vez: no se muestra nada hasta que se acote la búsqueda.
  const demasiadosAutores = resultado.demasiados === true;

  const filters: ToolbarFilter[] = [
    { label: "Entidad", emptyLabel: "Todas", options: AUDIT_ENTITIES, value: entidad, onChange: handleEntidadChange },
    { label: "Acción", emptyLabel: "Todas", options: AUDIT_ACTIONS, value: accion, onChange: handleAccionChange },
  ];

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[1200px] mx-auto w-full px-4 py-5">
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
            <span className="loading loading-spinner loading-md" role="status" aria-label="Cargando" />
          </div>
        ) : demasiadosAutores ? (
          <div role="status" className="alert alert-info alert-soft text-sm">
            <span>Hay demasiadas coincidencias ({MAX_COINCIDENCIAS}+ autores). Escribí más del nombre o apellido para acotar la búsqueda.</span>
          </div>
        ) : eventos.length === 0 ? (
          <p role="status" className="text-base-content/70 py-6 text-center">No se encontraron eventos de auditoría.</p>
        ) : (
          <>
            <DataTable headers={["Fecha y hora", "Usuario", "Acción", "Entidad", "Usuario BD", "IP", ""]}>
              {eventos.map((evento) => {
                const expandido = expandidoId === evento.idAuditoria;
                const detalleId = `detalle-auditoria-${evento.idAuditoria}`;
                const tieneDetalle = Boolean(evento.valorAnterior || evento.valorNuevo);
                const notificacion = detalleNotificacion(evento);
                return (
                  <Fragment key={evento.idAuditoria}>
                    <tr>
                      <td className="whitespace-nowrap">{formatFechaHora(evento.fechaHora)}</td>
                      <td>
                        {evento.nombreAutor ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{evento.nombreAutor}</span>
                            {evento.documentoAutor ? (
                              <span className="text-xs text-base-content/70">{evento.documentoAutor}</span>
                            ) : null}
                          </div>
                        ) : notificacion ? (
                          // Los avisos del scheduler de recordatorios (RF23) no tienen autor: los dispara el sistema, no un cambio directo en BD.
                          <span className="text-base-content/70 italic">Sistema (envío automático)</span>
                        ) : (
                          <span className="text-base-content/70 italic">Acción directa en BD</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className={`badge badge-sm ${describeAccion(evento.accion).badgeClass}`}>
                            {evento.accion}
                          </span>
                          {/* Un envío fallido se marca ya en la lista, sin tener que abrir el detalle (RNF12). */}
                          {notificacion && !notificacion.enviada ? (
                            <span className="badge badge-sm badge-error badge-outline">Falló</span>
                          ) : null}
                        </div>
                      </td>
                      <td>{evento.entidad}</td>
                      <td className="text-base-content/70">{evento.usuarioBd ?? "—"}</td>
                      <td className="text-base-content/70">{evento.ip ?? "—"}</td>
                      <td className="whitespace-nowrap">
                        {/* LOGIN/LOGOUT no traen valores antes/después: no hay nada que detallar. */}
                        {tieneDetalle ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            aria-expanded={expandido}
                            aria-controls={detalleId}
                            onClick={() => setExpandidoId(expandido ? null : evento.idAuditoria)}
                          >
                            {expandido ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
                            {expandido ? "Ocultar" : "Ver detalle"}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                    {expandido && tieneDetalle ? (
                      <tr id={detalleId}>
                        <td colSpan={7} className="bg-base-100 p-3 sm:p-4">
                          {/* La tabla es más ancha que la pantalla en móvil: el panel se fija al borde izquierdo con el ancho visible, así no queda cortado al desplazarla. */}
                          <div className="sticky left-0 w-[calc(100vw-3.5rem)] lg:w-auto">
                            <AuditDetalleEvento evento={evento} />
                          </div>
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
              pageSize={TAMANIO_PAGINA}
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
