// Un header puede ser un string (alineado a la izquierda) o un objeto con `align` para columnas como "Identificador" que leen mejor centradas.
export type DataTableHeader = string | { label: string; align?: "center" | "right" };

type DataTableProps = {
  headers: DataTableHeader[];
  children: React.ReactNode;
};

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      {/* Encabezados al 70 % porque el 60 % de daisyUI da 4,11:1 de contraste, menos del 4,5:1 de WCAG AA. */}
      <table className="table align-middle [&_thead]:text-base-content/70 [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-150 [&_tbody_tr:hover]:bg-base-200">
        <thead>
          <tr>
            {headers.map((hd) => {
              const label = typeof hd === "string" ? hd : hd.label;
              const align = typeof hd === "string" ? undefined : hd.align;
              // Clases completas a mano (no `text-${align}`): un template literal armado en runtime no lo detecta el escaneo estático de Tailwind y la clase queda afuera del CSS compilado.
              const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : undefined;
              return (
                <th key={label} className={alignClass}>
                  {/* Columna de acciones sin título visible: se le da nombre accesible para los lectores de pantalla. */}
                  {label || <span className="sr-only">Acciones</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
