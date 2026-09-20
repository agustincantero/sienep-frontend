import { Search, X } from "lucide-react";

export type ToolbarFilter = {
  // Etiqueta flotante del filtro (ej. "Grupo"): es el nombre accesible del <select>.
  label: string;
  // Texto de la opción vacía (ej. "Todos"): lo que se ve cuando no hay nada elegido.
  emptyLabel: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
};

type ToolbarProps = {
  // Etiqueta flotante del buscador; también hace de placeholder mientras está vacío y sin foco.
  placeholder: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: ToolbarFilter[];
};

// Buscador y filtros con floating-label de daisyUI 5 (mismo patrón que Field en StudentForm y los
// formularios de auth): el control va PRIMERO y el <span> con la etiqueta después, ambos hijos
// directos del <label>. Así cada campo tiene nombre accesible propio y no depende del placeholder.
// En un <select> la etiqueta queda siempre flotando (no hay placeholder-shown que la anime).
export function Toolbar({ placeholder, searchValue, onSearchChange, filters }: ToolbarProps) {
  return (
    <div className="grid grid-cols-12 gap-2 mb-3">
      {/* md:col-span-5 (no 4): con la etiqueta flotante el control pasa a tamaño normal y el placeholder
          "Buscar por nombre, apellido o documento" quedaba cortado en 4 columnas. */}
      <div className="col-span-12 md:col-span-5">
        <div className="relative">
          <label className="floating-label">
            <input
              className="input w-full pl-9 pr-8 border-neutral-800/30"
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            <span>{placeholder}</span>
          </label>
          {/* Fuera del <label>: `.floating-label > span` de daisyUI posiciona la etiqueta, así que el
              ícono va en un <div>; y el botón de limpiar no debe sumarse al nombre accesible del input. */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none">
            <Search size={14} aria-hidden />
          </div>
          {searchValue ? (
            <button
              type="button"
              className="btn btn-ghost btn-circle btn-xs absolute right-1 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
              onClick={() => onSearchChange?.("")}
              aria-label="Limpiar búsqueda"
            >
              <X size={13} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
      {(filters ?? []).map((f) => (
        <div className="col-span-6 md:col-span-2" key={f.label}>
          <label className="floating-label">
            <select
              className="select w-full border-neutral-800/30"
              value={f.value}
              onChange={(e) => f.onChange?.(e.target.value)}
            >
              <option value="">{f.emptyLabel}</option>
              {f.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>{f.label}</span>
          </label>
        </div>
      ))}
    </div>
  );
}
