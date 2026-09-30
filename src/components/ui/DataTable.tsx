// Un header puede ser un string (alineado a la izquierda) o un objeto con `align` para columnas como "Identificador" que leen mejor centradas.
export type DataTableHeader = string | { label: string; align?: "center" | "right" };

type DataTableProps = {
  headers: DataTableHeader[];
  children: React.ReactNode;
};

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table align-middle [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-150 [&_tbody_tr:hover]:bg-base-200">
        <thead>
          <tr>
            {headers.map((hd) => {
              const label = typeof hd === "string" ? hd : hd.label;
              const align = typeof hd === "string" ? undefined : hd.align;
              // Clases completas a mano (no `text-${align}`): un template literal armado en runtime no lo detecta el escaneo estático de Tailwind y la clase queda afuera del CSS compilado.
              const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : undefined;
              return (
                <th key={label} className={alignClass}>
                  {label}
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
