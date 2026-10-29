// Período del reporte (RF30), en la forma en que viaja en la URL (/reportes?desde=2026-03&hasta=2026-09). Sin imports de cliente: lo usa tanto la page (Server Component) como ReportesView.

// Meses completos en formato AAAA-MM (el de <input type="month">), "" = sin límite.
export type FiltrosReportes = {
  desde: string;
  hasta: string;
};

export const FILTROS_REPORTES_POR_DEFECTO: FiltrosReportes = { desde: "", hasta: "" };

type Fuente = URLSearchParams | Record<string, string | string[] | undefined>;

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

function mes(fuente: Fuente, clave: string): string {
  const v = fuente instanceof URLSearchParams ? fuente.get(clave) : fuente[clave];
  const texto = (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
  return MES.test(texto) ? texto : "";
}

// Lo que viene en la URL lo escribe cualquiera: un mes inválido se ignora.
export function leerFiltrosReportes(fuente: Fuente): FiltrosReportes {
  return { desde: mes(fuente, "desde"), hasta: mes(fuente, "hasta") };
}

export function aQueryReportes(f: FiltrosReportes): string {
  const usp = new URLSearchParams();
  if (f.desde) usp.set("desde", f.desde);
  if (f.hasta) usp.set("hasta", f.hasta);
  return usp.toString();
}

// El backend espera fechas ISO; el primer día del mes alcanza porque él redondea a meses completos.
export function mesAFecha(mesIso: string): string | undefined {
  return MES.test(mesIso) ? `${mesIso}-01` : undefined;
}
