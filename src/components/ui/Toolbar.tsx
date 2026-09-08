import { Search } from "lucide-react";

export type ToolbarFilter = {
  label: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
};

type ToolbarProps = {
  placeholder: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: ToolbarFilter[];
};

export function Toolbar({ placeholder, searchValue, onSearchChange, filters }: ToolbarProps) {
  return (
    <div className="grid grid-cols-12 gap-2 mb-3">
      <div className="col-span-12 md:col-span-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none">
            <Search size={14} aria-hidden />
          </span>
          <input
            className="input input-bordered input-sm w-full pl-9 border-neutral-800/30"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </div>
      {(filters ?? []).map((f) => (
        <div className="col-span-6 md:col-span-2" key={f.label}>
          <select
            className="select select-bordered select-sm w-full border-neutral-800/30"
            value={f.value}
            onChange={(e) => f.onChange?.(e.target.value)}
          >
            <option value="">{f.label}</option>
            {f.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
