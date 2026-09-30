import { Search, X } from "lucide-react";

export type ToolbarFilter = {
  // Etiqueta flotante del filtro (ej. "Grupo"): es el nombre accesible del control.
  label: string;
  // Texto de la opción vacía (ej. "Todos"): lo que se ve cuando no hay nada elegido.
  // Sin efecto si type es "search" (ahí "vacío" es simplemente borrar el texto).
  emptyLabel: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  // "select" (default) = <select> con las opciones fijas. "search" = <input> con
  // autocompletado (<datalist>) sobre las mismas opciones — para filtros con muchas
  // opciones (ej. Estudiante) donde tipear es más rápido que scrollear un combo largo.
  // En ambos casos `value`/`onChange` siguen siendo el texto exacto de una opción.
  type?: "select" | "search";
};

type ToolbarProps = {
  // Etiqueta flotante del buscador; también hace de placeholder mientras está vacío y sin foco.
  // Sin onSearchChange no se renderiza el buscador en absoluto (ver Instancias/Incidencias: esos
  // endpoints no tienen un filtro de texto libre en el backend, solo filtros por id vía `filters`).
  placeholder?: string;
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
      {onSearchChange ? (
        <div className="col-span-12 md:col-span-5">
          <div className="relative">
            <label className="floating-label">
              <input
                className="input w-full pl-9 pr-8 border-neutral-800/30"
                placeholder={placeholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
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
                onClick={() => onSearchChange("")}
                aria-label="Limpiar búsqueda"
              >
                <X size={13} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {(filters ?? []).map((f) => {
        const datalistId = `toolbar-filter-${f.label.toLowerCase().replace(/\s+/g, "-")}`;
        return (
          <div className="col-span-6 md:col-span-2" key={f.label}>
            <label className="floating-label">
              {f.type === "search" ? (
                <>
                  <input
                    className="input w-full border-neutral-800/30"
                    list={datalistId}
                    value={f.value ?? ""}
                    onChange={(e) => f.onChange?.(e.target.value)}
                    placeholder={f.label}
                  />
                  <datalist id={datalistId}>
                    {f.options.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </>
              ) : (
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
              )}
              <span>{f.label}</span>
            </label>
          </div>
        );
      })}
    </div>
  );
}
