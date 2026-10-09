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
  placeholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  // Convierte el buscador en un autocompletado (<datalist>) en vez de texto libre: para filtros que en realidad resuelven a un id, pero deben ocupar el mismo lugar que un buscador de texto real.
  searchOptions?: string[];
  filters?: ToolbarFilter[];
  // Control extra al final de la fila (ej. el "Ordenar por" de estudiantes), del mismo ancho que un filtro y pegado a la derecha.
  // Con esto el buscador baja a 4 columnas en lg para que todo entre en una sola fila; entre md y lg va solo en su fila.
  trailing?: React.ReactNode;
};

// Buscador y filtros con floating-label de daisyUI 5 (mismo patrón que Field en StudentForm y los
// formularios de auth): el control va PRIMERO y el <span> con la etiqueta después, ambos hijos
// directos del <label>. Así cada campo tiene nombre accesible propio y no depende del placeholder.
// En un <select> la etiqueta queda siempre flotando (no hay placeholder-shown que la anime).
export function Toolbar({ placeholder, searchValue, onSearchChange, searchOptions, filters, trailing }: ToolbarProps) {
  const datalistId = searchOptions ? "toolbar-search-options" : undefined;
  const searchSpan = trailing ? "md:col-span-12 lg:col-span-4" : "md:col-span-5";
  const filterSpan = trailing ? "col-span-6 md:col-span-3 lg:col-span-2" : "col-span-6 md:col-span-2";
  return (
    <div className="grid grid-cols-12 gap-2 mb-3">
      {/* md:col-span-5 (no 4): con la etiqueta flotante el control pasa a tamaño normal y el placeholder
          "Buscar por nombre, apellido o documento" quedaba cortado en 4 columnas. */}
      {/* Sin onSearchChange no se renderiza el buscador en absoluto. */}
      {onSearchChange ? (
        <div className={`col-span-12 ${searchSpan}`}>
          <div className="relative">
            <label className="floating-label">
              <input
                className="input w-full pl-9 pr-8 border-neutral-800/30"
                placeholder={placeholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                list={datalistId}
              />
              <span>{placeholder}</span>
            </label>
            {/* Sin opciones mientras el input está vacío: un <input list> con datalist le muestra al navegador TODAS las opciones al hacer foco/click, incluso sin texto. Se evita vaciando el datalist hasta que haya algo tipeado. */}
            {datalistId && searchValue ? (
              <datalist id={datalistId}>
                {searchOptions!.map((opt) => (
                  <option key={opt} value={opt} />
                ))}
              </datalist>
            ) : null}
            {/* Fuera del <label>: `.floating-label > span` de daisyUI posiciona la etiqueta, así que el
                ícono va en un <div>; y el botón de limpiar no debe sumarse al nombre accesible del input. */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none">
              <Search size={14} aria-hidden />
            </div>
            {searchValue ? (
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-xs absolute right-1 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                onClick={() => onSearchChange("")}
                aria-label="Limpiar búsqueda"
              >
                <X size={13} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {(filters ?? []).map((f) => (
        <div className={filterSpan} key={f.label}>
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
      {trailing ? <div className={`${filterSpan} col-end-13`}>{trailing}</div> : null}
    </div>
  );
}
