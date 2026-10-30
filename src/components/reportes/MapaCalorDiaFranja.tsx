import type { IncidenciasDiaFranja } from "@/lib/reportes";

const FRANJAS_CONOCIDAS = ["Mañana", "Mediodía", "Tarde", "Noche"];

// Incidencias por día de la semana y franja horaria (IND-06), sumadas en el período. Cada celda lleva el número, así que la intensidad del color es un refuerzo y no la única señal.
export function MapaCalorDiaFranja({ datos }: { datos: IncidenciasDiaFranja[] }) {
  const celdas = new Map<string, number>();
  const dias = new Map<number, string>();
  const franjasPresentes = new Set<string>();
  for (const d of datos) {
    dias.set(d.diaSemanaNro, d.diaSemana);
    franjasPresentes.add(d.franjaHoraria);
    const clave = `${d.diaSemanaNro}|${d.franjaHoraria}`;
    celdas.set(clave, (celdas.get(clave) ?? 0) + d.incidencias);
  }

  const diasOrdenados = [...dias.entries()].sort((a, b) => a[0] - b[0]);
  const franjas = [
    ...FRANJAS_CONOCIDAS.filter((f) => franjasPresentes.has(f)),
    ...[...franjasPresentes].filter((f) => !FRANJAS_CONOCIDAS.includes(f)).sort(),
  ];
  const maximo = Math.max(...celdas.values(), 0);

  return (
    <section className="card bg-base-100 border border-base-300">
      <div className="card-body gap-3 p-4">
        <h2 className="card-title text-base">Incidencias por día y franja horaria</h2>
        {diasOrdenados.length === 0 ? (
          <p role="status" className="text-sm text-base-content/70">Sin datos en el período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-sm">
              <caption className="sr-only">Cantidad de incidencias por día de la semana y franja horaria, sumadas en el período</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left font-medium text-base-content/70 pr-2">Día</th>
                  {franjas.map((f) => (
                    <th key={f} scope="col" className="font-medium text-base-content/70 px-2">{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diasOrdenados.map(([nro, nombre]) => (
                  <tr key={nro}>
                    <th scope="row" className="text-left font-medium pr-2 whitespace-nowrap">{nombre}</th>
                    {franjas.map((f) => {
                      const valor = celdas.get(`${nro}|${f}`) ?? 0;
                      const intensidad = maximo ? valor / maximo : 0;
                      return (
                        <td
                          key={f}
                          className="text-center tabular-nums rounded-field h-10 min-w-16"
                          style={{ backgroundColor: `color-mix(in oklab, var(--color-primary) ${Math.round(intensidad * 100)}%, var(--color-base-200))` }}
                        >
                          {valor}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
