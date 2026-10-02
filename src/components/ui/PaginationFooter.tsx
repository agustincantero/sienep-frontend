import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationFooterProps = {
  shown: number;
  total: number;
  noun: string;
  // Página actual (base 0) y tamaño de página, opcionales: si se pasan los dos, se muestra el rango real (ej. "21-40") en vez de repetir el mismo "20 de N" en todas las páginas salvo la última.
  page?: number;
  pageSize?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
};

export function PaginationFooter({
  shown,
  total,
  noun,
  page,
  pageSize,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
}: PaginationFooterProps) {
  let rango = `${shown}`;
  if (page !== undefined && pageSize !== undefined) {
    const desde = page * pageSize + 1;
    const hasta = page * pageSize + shown;
    rango = desde === hasta ? `${desde}` : `${desde}-${hasta}`;
  }

  return (
    <div className="flex items-center justify-between mt-2">
      <span className="text-base-content/60 text-sm">
        Mostrando {rango} de {total} {noun}
      </span>
      <nav>
        <ul className="join mb-0">
          <li className="list-none inline-block">
            <button
              type="button"
              className="join-item btn btn-sm gap-1"
              disabled={!hasPrevious}
              onClick={onPrevious}
            >
              <ChevronLeft size={14} aria-hidden />
              Anterior
            </button>
          </li>
          <li className="list-none inline-block">
            <button
              type="button"
              className="join-item btn btn-sm gap-1"
              disabled={!hasNext}
              onClick={onNext}
            >
              Siguiente
              <ChevronRight size={14} aria-hidden />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
