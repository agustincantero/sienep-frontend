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
  // Con esto la fila pasa a un layout propio (ver layoutConTrailing) para que entre todo en una sola fila en pantallas anchas.
  trailing?: React.ReactNode;
};

// Buscador y filtros con floating-label de daisyUI 5 (mismo patrón que Field en StudentForm y los
// formularios de auth): el control va PRIMERO y el <span> con la etiqueta después, ambos hijos
// directos del <label>. Así cada campo tiene nombre accesible propio y no depende del placeholder.
// En un <select> la etiqueta queda siempre flotando (no hay placeholder-shown que la anime).
export function Toolbar({ placeholder, searchValue, onSearchChange, searchOptions, filters, trailing }: ToolbarProps) {
  const datalistId = searchOptions ? "toolbar-search-options" : undefined;
  const layout = trailing ? layoutConTrailing : layoutBase;
  return (
    <div className={`grid gap-2 mb-3 ${layout.grid}`}>
      {/* md:col-span-5 (no 4): con la etiqueta flotante el control pasa a tamaño normal y el placeholder
          "Buscar por nombre, apellido o documento" quedaba cortado en 4 columnas. */}
      {/* Sin onSearchChange no se renderiza el buscador en absoluto. */}
      {onSearchChange ? (
        <div className={layout.search}>
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
        <div className={layout.filter} key={f.label}>
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
      {trailing ? <div className={layout.trailing}>{trailing}</div> : null}
    </div>
  );
}

// Layout original: grilla de 12, buscador de 5 columnas y filtros de 2.
const layoutBase = {
  grid: "grid-cols-12",
  search: "col-span-12 md:col-span-5",
  filter: "col-span-6 md:col-span-2",
  trailing: "",
};

// Con trailing hay un select más y en la grilla de 12 no entra todo sin achicar el buscador hasta cortar el placeholder
// (con el sidebar de 260px, entre 1024 y ~1400px quedaba en 240-330px). Por eso: selects de a 2 en mobile, de a 4 desde lg
// con el buscador en su fila, y una sola fila recién en xl con selects de ancho fijo y el buscador ocupando el resto.
// col-end-[-1]: el trailing siempre cae en la última columna, aunque no haya buscador ni filtros (ej. sin BUSCAR_ESTUDIANTE).
const layoutConTrailing = {
  grid: "grid-cols-2 lg:grid-cols-4 xl:grid-cols-[minmax(0,1fr)_repeat(4,9rem)]",
  search: "col-span-2 lg:col-span-4 xl:col-span-1",
  filter: "col-span-1",
  trailing: "col-span-1 col-end-[-1]",
};
