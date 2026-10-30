type Barra = {
  etiqueta: string;
  // Texto secundario bajo la etiqueta (modalidad, tipo de espacio).
  detalle?: string;
  valor: number;
};

type BarrasHorizontalesProps = {
  titulo: string;
  barras: Barra[];
  // Total contra el que se calcula el porcentaje; sin él, la barra se escala contra el valor máximo.
  total?: number;
  color?: "primary" | "secondary" | "accent";
  vacio?: string;
};

// Tonos 600 de Tailwind en vez de los tokens de daisyUI, que contra el blanco quedan por debajo de 3:1 (WCAG 1.4.11). El valor de .progress se pinta con currentColor.
const COLORES = {
  primary: "text-sky-600",
  secondary: "text-pink-600",
  accent: "text-teal-600",
};

const FORMATO_PORCENTAJE = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

// Lista ordenada de barras con la cantidad y, si hay total, el porcentaje. Los números van en texto, así que no depende solo del color ni de la longitud de la barra.
export function BarrasHorizontales({ titulo, barras, total, color = "primary", vacio = "Sin datos en el período." }: BarrasHorizontalesProps) {
  const maximo = Math.max(...barras.map((b) => b.valor), 0);
  return (
    <section className="card bg-base-100 border border-base-300">
      <div className="card-body gap-3 p-4">
        <h2 className="card-title text-base">{titulo}</h2>
        {barras.length === 0 ? (
          <p role="status" className="text-sm text-base-content/70">{vacio}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {barras.map((b) => {
              const porcentaje = total ? (b.valor / total) * 100 : null;
              return (
                <li key={`${b.etiqueta}-${b.detalle ?? ""}`}>
                  <div className="flex items-baseline justify-between gap-2 text-sm mb-1">
                    <span className="min-w-0">
                      <span className="font-medium">{b.etiqueta}</span>
                      {b.detalle && b.detalle !== b.etiqueta ? <span className="text-base-content/70"> · {b.detalle}</span> : null}
                    </span>
                    <span className="whitespace-nowrap tabular-nums">
                      <strong>{b.valor}</strong>
                      {porcentaje !== null ? (
                        <span className="text-base-content/70"> ({FORMATO_PORCENTAJE.format(porcentaje)}%)</span>
                      ) : null}
                    </span>
                  </div>
                  <progress
                    className={`progress w-full ${COLORES[color]}`}
                    value={b.valor}
                    max={maximo || 1}
                    aria-hidden
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
