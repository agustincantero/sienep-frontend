"use client";

import { useEffect, useRef, useState } from "react";
import { etiquetaMes, etiquetaMesCorta, type EvolucionMensual } from "@/lib/reportes";

// Ancho de arranque (antes de medir el contenedor) y mínimo, en px.
const ANCHO_INICIAL = 640;
const ANCHO_MINIMO = 280;
const ALTO = 280;
const TAMANIO_TEXTO = 12;
// El margen superior deja libre una franja para el tooltip, así no tapa las líneas ni los puntos.
const ANCHO_TOOLTIP = 280;
const MARGEN = { arriba: 56, derecha: 40, abajo: 32, izquierda: 40 };

// Eje con marcas redondas (paso 1, 2 o 5 por potencia de 10) y entre 3 y 5 tramos, que alcanza para el valor máximo. Cada serie tiene el suyo.
function escalaEje(maximoDato: number): { max: number; marcas: number[] } {
  for (let exp = 0; exp < 9; exp++) {
    for (const mult of [1, 2, 5]) {
      const paso = mult * 10 ** exp;
      const tramos = Math.max(3, Math.ceil(maximoDato / paso));
      if (tramos <= 5) return { max: tramos * paso, marcas: Array.from({ length: tramos + 1 }, (_, i) => i * paso) };
    }
  }
  return { max: maximoDato, marcas: [0, maximoDato] };
}

// Líneas de instancias e incidencias por mes (IND-01 e IND-02). SVG propio, con una franja enfocable por mes que lee los valores exactos a los lectores de pantalla y al teclado.
export function GraficoEvolucion({ datos }: { datos: EvolucionMensual[] }) {
  // Índice del mes bajo el mouse o con foco (null = ninguno).
  const [activo, setActivo] = useState<number | null>(null);
  // El lienzo mide lo mismo que el contenedor (1 unidad = 1 px), así el texto no se achica ni se agranda con el ancho de pantalla.
  const [ancho, setAncho] = useState(ANCHO_INICIAL);
  const contenedor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const observer = new ResizeObserver(([entrada]) => setAncho(Math.max(ANCHO_MINIMO, Math.round(entrada.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, [datos.length]);
  // Instancias e incidencias tienen órdenes de magnitud distintos: cada una usa su eje (instancias a la izquierda, incidencias a la derecha).
  const ejeInstancias = escalaEje(Math.max(...datos.map((d) => d.instanciasAgendadas), 0));
  const ejeIncidencias = escalaEje(Math.max(...datos.map((d) => d.incidenciasOcurridas), 0));
  const anchoUtil = ancho - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;

  const x = (i: number) => MARGEN.izquierda + (datos.length === 1 ? anchoUtil / 2 : (i / (datos.length - 1)) * anchoUtil);
  const yInstancias = (v: number) => MARGEN.arriba + altoUtil - (v / ejeInstancias.max) * altoUtil;
  const yIncidencias = (v: number) => MARGEN.arriba + altoUtil - (v / ejeIncidencias.max) * altoUtil;
  const camino = (valor: (d: EvolucionMensual) => number, y: (v: number) => number) =>
    datos.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(valor(d)).toFixed(1)}`).join(" ");

  const paso = datos.length > 1 ? anchoUtil / (datos.length - 1) : anchoUtil;

  return (
    <section className="card bg-base-100 border border-base-300">
      <div className="card-body gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="card-title text-base">Evolución mensual</h2>
          <ul className="flex gap-4 text-sm" aria-hidden>
            <li className="flex items-center gap-2">
              <span className="inline-block w-4 h-1 rounded bg-sky-600" />
              Instancias (eje izquierdo)
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block w-4 h-1 rounded bg-pink-600" />
              Incidencias (eje derecho)
            </li>
          </ul>
        </div>

        {datos.length === 0 ? (
          <p role="status" className="text-sm text-base-content/70">Sin datos en el período.</p>
        ) : (
          <>
            <div ref={contenedor} className="relative">
            <svg viewBox={`0 0 ${ancho} ${ALTO}`} role="group" aria-label="Evolución mensual, un punto por mes" className="w-full h-auto" onMouseLeave={() => setActivo(null)}>
              {ejeInstancias.marcas.map((m) => (
                <g key={m}>
                  <line x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha} y1={yInstancias(m)} y2={yInstancias(m)} stroke="currentColor" strokeOpacity={0.12} />
                  <text x={MARGEN.izquierda - 6} y={yInstancias(m) + 4} textAnchor="end" fontSize={TAMANIO_TEXTO} className="fill-sky-700">
                    {m}
                  </text>
                </g>
              ))}
              {ejeIncidencias.marcas.map((m) => (
                <text key={m} x={ancho - MARGEN.derecha + 6} y={yIncidencias(m) + 4} fontSize={TAMANIO_TEXTO} className="fill-pink-700">
                  {m}
                </text>
              ))}
              {datos.map((d, i) => (
                <text key={d.mes} x={x(i)} y={ALTO - 10} textAnchor="middle" fontSize={TAMANIO_TEXTO} fill="currentColor" fillOpacity={0.7}>
                  {etiquetaMesCorta(d.mes)}
                </text>
              ))}
              <path d={camino((d) => d.instanciasAgendadas, yInstancias)} fill="none" className="stroke-sky-600" strokeWidth={2.5} strokeLinejoin="round" />
              <path d={camino((d) => d.incidenciasOcurridas, yIncidencias)} fill="none" className="stroke-pink-600" strokeWidth={2.5} strokeLinejoin="round" />
              {activo !== null ? (
                <line x1={x(activo)} x2={x(activo)} y1={MARGEN.arriba} y2={ALTO - MARGEN.abajo} stroke="currentColor" strokeOpacity={0.3} strokeDasharray="3 3" />
              ) : null}
              {datos.map((d, i) => {
                const r = activo === i ? 6 : 4;
                return (
                  <g key={d.mes}>
                    <circle cx={x(i)} cy={yInstancias(d.instanciasAgendadas)} r={r} className="fill-sky-600" />
                    <circle cx={x(i)} cy={yIncidencias(d.incidenciasOcurridas)} r={r} className="fill-pink-600" />
                  </g>
                );
              })}
              {/* Una franja invisible por mes que captura el mouse y el foco de teclado */}
              {datos.map((d, i) => (
                <rect
                  key={d.mes}
                  x={x(i) - paso / 2}
                  y={MARGEN.arriba}
                  width={paso}
                  height={altoUtil}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${etiquetaMes(d.mes)}: ${d.instanciasAgendadas} instancias, ${d.incidenciasOcurridas} incidencias`}
                  className="outline-none focus-visible:outline-2 focus-visible:outline-base-content"
                  onKeyDown={(e) => e.key === "Escape" && setActivo(null)}
                  onMouseEnter={() => setActivo(i)}
                  onFocus={() => setActivo(i)}
                  onBlur={() => setActivo(null)}
                />
              ))}
            </svg>
            {activo !== null ? (
              <div
                aria-hidden
                className="absolute top-0 z-10 pointer-events-none rounded-field border border-base-300 bg-base-100 shadow-md px-2 py-1 text-sm leading-tight whitespace-nowrap"
                style={{
                  width: ANCHO_TOOLTIP,
                  left: `clamp(${ANCHO_TOOLTIP / 2}px, ${x(activo)}px, calc(100% - ${ANCHO_TOOLTIP / 2}px))`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="font-medium capitalize">{etiquetaMes(datos[activo].mes)}</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-sky-600" />Instancias <strong>{datos[activo].instanciasAgendadas}</strong></span>
                  <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-pink-600" />Incidencias <strong>{datos[activo].incidenciasOcurridas}</strong></span>
                </div>
              </div>
            ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
