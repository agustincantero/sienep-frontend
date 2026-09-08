type DataTableProps = {
  headers: string[];
  children: React.ReactNode;
};

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table align-middle [&_tbody_tr:hover]:bg-base-200">
        <thead>
          <tr>
            {headers.map((hd) => (
              <th key={hd}>{hd}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
