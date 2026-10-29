import { apiGet, apiGetBlob, apiPostForm } from "@/lib/api";
import { mesAFecha, type FiltrosReportes } from "@/lib/reportes-filtros";

// Claves del ReporteResponseDTO del backend. Los indicadores salen de las vistas v_* del Data Warehouse; `mes` es el primer día del mes (yyyy-MM-dd) y `anioMes` su forma AAAA-MM.
export type EvolucionMensual = {
  mes: string;
  anioMes: string;
  instanciasAgendadas: number;
  incidenciasOcurridas: number;
};

export type InstanciasCategoriaMes = {
  mes: string;
  anioMes: string;
  categoria: string;
  instancias: number;
  porcentajeDelMes: number;
};

export type InstanciasCanalMes = {
  mes: string;
  anioMes: string;
  canal: string;
  modalidad: string;
  instancias: number;
  porcentajeDelMes: number;
};

export type IncidenciasEspacioMes = {
  mes: string;
  anioMes: string;
  tipoEspacio: string;
  incidencias: number;
};

export type IncidenciasDiaFranja = {
  mes: string;
  anioMes: string;
  diaSemanaNro: number;
  diaSemana: string;
  franjaHoraria: string;
  incidencias: number;
};

export type IncidenciasInvolucradosMes = {
  mes: string;
  anioMes: string;
  incidencias: number;
  totalInvolucrados: number;
  incidenciasConMasDeUno: number;
  promedioInvolucrados: number;
  porcentajeConMasDeUno: number;
};

export type Reporte = {
  fechaGeneracion: string;
  generadoPor: string;
  // Fecha de la última carga correcta del DW; null si todavía no hubo ninguna.
  datosAl: string | null;
  // Primer y último día del período efectivo; null si el DW no tiene datos.
  desde: string | null;
  hasta: string | null;
  totalInstancias: number;
  totalIncidencias: number;
  evolucionMensual: EvolucionMensual[];
  instanciasPorCategoria: InstanciasCategoriaMes[];
  instanciasPorCanal: InstanciasCanalMes[];
  incidenciasPorLugar: IncidenciasEspacioMes[];
  incidenciasPorDiaFranja: IncidenciasDiaFranja[];
  incidenciasInvolucrados: IncidenciasInvolucradosMes[];
};

export type ValidacionReporte = {
  autentico: boolean;
  fechaGeneracion: string | null;
};

function parametros(f: FiltrosReportes) {
  return { desde: mesAFecha(f.desde), hasta: mesAFecha(f.hasta) };
}

export function obtenerReporte(f: FiltrosReportes): Promise<Reporte> {
  return apiGet<Reporte>("/reportes", parametros(f));
}

export function exportarReportePdf(f: FiltrosReportes) {
  return apiGetBlob("/reportes/pdf", parametros(f));
}

export function validarReportePdf(archivo: File): Promise<ValidacionReporte> {
  const form = new FormData();
  form.append("archivo", archivo);
  return apiPostForm<ValidacionReporte>("/reportes/validar", form);
}

// Suma de un campo numérico sobre una lista de filas (los indicadores vienen por mes y la pantalla los muestra agregados en el período).
export function sumar<T>(filas: T[], campo: (fila: T) => number): number {
  return filas.reduce((acc, fila) => acc + campo(fila), 0);
}

// Agrupa filas por una clave y suma su valor, ordenado de mayor a menor.
export function agruparPorClave<T>(
  filas: T[],
  clave: (fila: T) => string,
  valor: (fila: T) => number,
): { clave: string; valor: number }[] {
  const acc = new Map<string, number>();
  for (const fila of filas) acc.set(clave(fila), (acc.get(clave(fila)) ?? 0) + valor(fila));
  return [...acc.entries()].map(([k, v]) => ({ clave: k, valor: v })).sort((a, b) => b.valor - a.valor);
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// "2026-03-01" -> "marzo 2026" (sin pasar por Date, por el desfase de huso horario).
export function etiquetaMes(fechaIso: string): string {
  const [anio, mes] = fechaIso.split("-");
  const nombre = MESES[Number(mes) - 1];
  return nombre ? `${nombre} ${anio}` : fechaIso;
}

// "2026-03-01" -> "mar" para el eje del gráfico.
export function etiquetaMesCorta(fechaIso: string): string {
  const nombre = MESES[Number(fechaIso.split("-")[1]) - 1];
  return nombre ? nombre.slice(0, 3) : fechaIso;
}
