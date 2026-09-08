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
              className="join-item btn btn-sm"
              disabled={!hasPrevious}
              onClick={onPrevious}
            >
              Anterior
            </button>
          </li>
          <li className="list-none inline-block">
            <button type="button" className="join-item btn btn-sm" disabled={!hasNext} onClick={onNext}>
              Siguiente
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
