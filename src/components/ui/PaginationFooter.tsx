import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationFooterProps = {
  shown: number;
  total: number;
  noun: string;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
};

export function PaginationFooter({
  shown,
  total,
  noun,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
}: PaginationFooterProps) {
  return (
    <div className="flex items-center justify-between mt-2">
      <span className="text-base-content/60 text-sm">
        Mostrando {shown} de {total} {noun}
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
