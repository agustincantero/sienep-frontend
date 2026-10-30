"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { apiErrorMessage } from "@/lib/api";
import { formatFechaHora } from "@/lib/format";
import {
  agruparPorClave,
  etiquetaMes,
  exportarReportePdf,
  obtenerReporte,
  sumar,
  type Reporte,
} from "@/lib/reportes";
import { aQueryReportes, type FiltrosReportes } from "@/lib/reportes-filtros";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BarrasHorizontales } from "./BarrasHorizontales";
import { GraficoEvolucion } from "./GraficoEvolucion";
import { MapaCalorDiaFranja } from "./MapaCalorDiaFranja";
import { MesInput } from "./MesInput";
import { ValidarPdf } from "./ValidarPdf";

const FORMATO_DECIMAL = new Intl.NumberFormat("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const FORMATO_PORCENTAJE = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

type ReportesViewProps = {
  filtrosIniciales: FiltrosReportes;
  puedeExportar: boolean;
};

export function ReportesView({ filtrosIniciales, puedeExportar }: ReportesViewProps) {
  const [filtros, setFiltros] = useState(filtrosIniciales);
  // Error de la exportación; el de carga es errorCarga.
  const [error, setError] = useState("");
  const [exportando, setExportando] = useState(false);

  // Con "desde" posterior a "hasta" el backend responde 400: se avisa acá y no se consulta.
  const rangoInvalido = Boolean(filtros.desde && filtros.hasta && filtros.desde > filtros.hasta);

  // Cada cambio de filtros vuelve a mostrar el spinner, para no dejar a la vista el reporte de otro período mientras llega el nuevo.
  const { data, cargando, errorCarga } = useApi(() => obtenerReporte(filtros), [filtros], {
    mensajeError: "No se pudo cargar el reporte.",
    spinnerAlCambiar: true,
    esperar: rangoInvalido,
  });
  // Si la carga falla, el hook conserva el reporte anterior: se oculta para no mostrar datos de otro período bajo el aviso de error.
  const reporte: Reporte | null = errorCarga ? null : data;

  function cambiarFiltros(nuevos: FiltrosReportes) {
    setFiltros(nuevos);
    const query = aQueryReportes(nuevos);
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }

  async function exportarPdf() {
    setExportando(true);
    setError("");
    try {
      const { blob, nombreArchivo } = await exportarReportePdf(filtros);
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreArchivo ?? "reporte_sienep.pdf";
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      // Se libera con demora porque algunos navegadores cortan la descarga si la URL se revoca recién hecho el click.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo exportar el reporte."));
    } finally {
      setExportando(false);
    }
  }

  // Sin meses con datos no hay nada que mostrar (el backend devuelve el período pedido igual, con todo en cero).
  const vacio = reporte !== null && reporte.evolucionMensual.length === 0;

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[1200px] mx-auto w-full px-4 py-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <SectionHeader title="Reportes" />
          {puedeExportar ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              // Firefox restaura el estado disabled del botón al recargar y rompe la hidratación; autoComplete="off" lo evita (los tipos de React no lo declaran para button).
              {...{ autoComplete: "off" }}
              suppressHydrationWarning
              onClick={() => void exportarPdf()}
              disabled={exportando || cargando || rangoInvalido || !reporte || vacio}
            >
              {exportando ? <span className="loading loading-spinner loading-xs" aria-hidden /> : <Download size={16} aria-hidden />}
              Exportar PDF
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Desde
            <MesInput value={filtros.desde} max={filtros.hasta || undefined} onChange={(desde) => cambiarFiltros({ ...filtros, desde })} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Hasta
            <MesInput value={filtros.hasta} min={filtros.desde || undefined} onChange={(hasta) => cambiarFiltros({ ...filtros, hasta })} />
          </label>
          {filtros.desde || filtros.hasta ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => cambiarFiltros({ desde: "", hasta: "" })}>
              Limpiar
            </button>
          ) : null}
        </div>

        {reporte && !rangoInvalido ? (
          <p className="text-sm text-base-content/70 mb-4" aria-live="polite">
            {reporte.desde && reporte.hasta ? <>Período {etiquetaMes(reporte.desde)} a {etiquetaMes(reporte.hasta)}. </> : null}
            {reporte.datosAl ? <>Datos al {formatFechaHora(reporte.datosAl)}. </> : <>Todavía no hay cargas en el Data Warehouse. </>}
            Los períodos se toman por mes completo.
          </p>
        ) : null}

        {rangoInvalido ? (
          <div role="alert" className="alert alert-warning alert-soft text-sm mb-3">
            <span>El mes «Desde» no puede ser posterior al mes «Hasta».</span>
          </div>
        ) : null}

        {errorCarga || error ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
            <span>{errorCarga || error}</span>
          </div>
        ) : null}

        {cargando && !rangoInvalido ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-md" role="status" aria-label="Cargando" />
          </div>
        ) : reporte && !rangoInvalido ? (
          vacio ? (
            <p role="status" className="text-base-content/70 py-6 text-center">No hay datos para el período elegido.</p>
          ) : (
            <Indicadores reporte={reporte} />
          )
        ) : null}

        <div className="mt-4">
          <ValidarPdf />
        </div>
      </div>
    </div>
  );
}

function Indicadores({ reporte }: { reporte: Reporte }) {
  const totalIncidenciasInv = sumar(reporte.incidenciasInvolucrados, (f) => f.incidencias);
  const totalInvolucrados = sumar(reporte.incidenciasInvolucrados, (f) => f.totalInvolucrados);
  const conMasDeUno = sumar(reporte.incidenciasInvolucrados, (f) => f.incidenciasConMasDeUno);
  // Promedios y porcentajes se recalculan como cociente de sumas (el promedio de los promedios mensuales sería incorrecto).
  const promedio = totalIncidenciasInv ? totalInvolucrados / totalIncidenciasInv : 0;
  const porcentajeMasDeUno = totalIncidenciasInv ? (conMasDeUno / totalIncidenciasInv) * 100 : 0;

  const categorias = agruparPorClave(reporte.instanciasPorCategoria, (f) => f.categoria, (f) => f.instancias);
  const totalCategorias = sumar(categorias, (c) => c.valor);

  const canales = agruparPorClave(reporte.instanciasPorCanal, (f) => `${f.canal}|${f.modalidad}`, (f) => f.instancias);
  const totalCanales = sumar(canales, (c) => c.valor);

  // El backend ya no manda el lugar puntual (junto con el mes podía identificar a una persona), así que cada mes trae una fila por tipo de espacio y acá se suma el período.
  const tiposEspacio = agruparPorClave(reporte.incidenciasPorLugar, (f) => f.tipoEspacio, (f) => f.incidencias);
  const totalTiposEspacio = sumar(tiposEspacio, (t) => t.valor);

  return (
    <div className="flex flex-col gap-4">
      <div className="stats stats-vertical sm:stats-horizontal border border-base-300 w-full">
        <div className="stat">
          <div className="stat-title">Instancias agendadas</div>
          <div className="stat-value">{reporte.totalInstancias}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Incidencias ocurridas</div>
          <div className="stat-value">{reporte.totalIncidencias}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Involucrados por incidencia</div>
          <div className="stat-value">{FORMATO_DECIMAL.format(promedio)}</div>
          <div className="stat-desc">{FORMATO_PORCENTAJE.format(porcentajeMasDeUno)}% de las incidencias con más de uno</div>
        </div>
      </div>

      <GraficoEvolucion datos={reporte.evolucionMensual} />

      {/* Dos columnas independientes en pantalla ancha, así cada tarjeta ocupa lo suyo y no queda un hueco bajo la más corta. En pantalla angosta los contenedores se disuelven (contents) y el orden de lectura lo da order-N. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start gap-4">
        <div className="contents lg:flex lg:flex-col lg:gap-4">
          <div className="order-1 lg:order-none">
            <BarrasHorizontales
              titulo="Instancias por categoría"
              barras={categorias.map((c) => ({ etiqueta: c.clave, valor: c.valor }))}
              total={totalCategorias}
            />
          </div>
          <div className="order-3 lg:order-none">
            <BarrasHorizontales
              titulo="Incidencias por tipo de espacio"
              color="accent"
              barras={tiposEspacio.map((t) => ({ etiqueta: t.clave, valor: t.valor }))}
              total={totalTiposEspacio}
            />
          </div>
        </div>
        <div className="contents lg:flex lg:flex-col lg:gap-4">
          <div className="order-2 lg:order-none">
            <BarrasHorizontales
              titulo="Instancias por canal"
              color="secondary"
              barras={canales.map((c) => {
                const [canal, modalidad] = c.clave.split("|");
                return { etiqueta: canal, detalle: modalidad, valor: c.valor };
              })}
              total={totalCanales}
            />
          </div>
          <div className="order-4 lg:order-none">
            <MapaCalorDiaFranja datos={reporte.incidenciasPorDiaFranja} />
          </div>
        </div>
      </div>
    </div>
  );
}
