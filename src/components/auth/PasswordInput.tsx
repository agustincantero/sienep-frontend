"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  disabled?: boolean;
  required?: boolean;
  error?: string;
  // id para enlazar el <p> de error con aria-describedby; si no se pasa se genera uno
  errorId?: string;
};

// Campo de contraseña con toggle de visibilidad (ojito). El wrapper lleva la clase `input` (patrón daisyUI para input con control extra): el <input> va pelado adentro y el botón es hijo flex, sin posicionamiento absoluto. El <span> sigue siendo hijo directo del floating-label y el <input> conserva su placeholder, que es lo que dispara el float.
export function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  required = true,
  error,
  errorId,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const describedBy = error ? (errorId ?? generatedId) : undefined;

  return (
    <div>
      <label className="floating-label">
        {/* wrapper <div> (no <span>): `.floating-label > span` de daisyUI, que posiciona la etiqueta flotante, matchearía un <span> wrapper */}
        <div className={`input w-full pr-1${error ? " input-error" : ""}`}>
          <input
            type={visible ? "text" : "password"}
            required={required}
            autoComplete={autoComplete}
            placeholder={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            disabled={disabled}
            aria-label="Mostrar contraseña"
            aria-pressed={visible}
            className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content"
          >
            {visible ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
          </button>
        </div>
        <span>{label}</span>
      </label>
      {error ? (
        <p id={describedBy} className="mt-1 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
