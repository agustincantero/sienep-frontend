type CampoProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  // Texto de ayuda debajo del campo cuando no hay error (ej. cómo se va a guardar el nombre).
  ayuda?: React.ReactNode;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  multilinea?: boolean;
  type?: "text" | "number";
  min?: number;
  max?: number;
};

// Campo con floating-label de daisyUI 5, mismo patrón que RolForm/StudentForm: control primero, <span> con la etiqueta después, y el error o la ayuda enlazados por aria-describedby.
export function Campo({
  id,
  label,
  value,
  onChange,
  error,
  ayuda,
  maxLength,
  disabled,
  required,
  multilinea,
  type = "text",
  min,
  max,
}: CampoProps) {
  const descripcionId = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;
  const comunes = {
    id,
    value,
    maxLength,
    disabled,
    required,
    placeholder: label,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": descripcionId,
  };

  return (
    <div>
      <label className="floating-label">
        {multilinea ? (
          <textarea
            {...comunes}
            rows={3}
            className={`textarea w-full${error ? " textarea-error" : ""}`}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            {...comunes}
            type={type}
            min={min}
            max={max}
            inputMode={type === "number" ? "numeric" : undefined}
            className={`input w-full${error ? " input-error" : ""}`}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        <span>
          {label}
          {required ? " *" : ""}
        </span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-error">
          {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-ayuda`} className="mt-1 text-xs text-base-content/60">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}
