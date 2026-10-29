import { Phone, Plus, X } from "lucide-react";
import { SeccionCard, SeccionLegend } from "@/components/ui/SeccionFormulario";

// Lista de teléfonos editable. No usa Field porque cada fila lleva su botón de quitar al lado del input;
// el id `telefono-<idx>` es el que usa StudentForm para enfocar el primer teléfono inválido.
export function TelefonosSeccion({
  telefonos,
  errores,
  guardando,
  onAgregar,
  onQuitar,
  onCambiar,
}: {
  telefonos: string[];
  errores: Record<string, string>;
  guardando: boolean;
  onAgregar: () => void;
  onQuitar: (idx: number) => void;
  onCambiar: (idx: number, value: string) => void;
}) {
  return (
    <SeccionCard>
      <SeccionLegend icon={Phone}>Teléfonos</SeccionLegend>
      {telefonos.map((tel, idx) => {
        const key = `telefono-${idx}`;
        const errorId = `${key}-error`;
        const errorTel = errores[key];
        return (
          <div key={idx}>
            <div className="flex gap-2">
              <label className="floating-label w-full max-w-xs">
                <input
                  id={key}
                  className={`input w-full${errorTel ? " input-error" : ""}`}
                  placeholder="Teléfono"
                  aria-label={`Teléfono ${idx + 1}`}
                  value={tel}
                  maxLength={12}
                  onChange={(e) => onCambiar(idx, e.target.value)}
                  disabled={guardando}
                  aria-invalid={errorTel ? true : undefined}
                  aria-describedby={errorTel ? errorId : undefined}
                />
                <span>Teléfono</span>
              </label>
              {telefonos.length > 1 ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onQuitar(idx)}
                  disabled={guardando}
                  aria-label="Quitar teléfono"
                >
                  <X size={14} aria-hidden />
                </button>
              ) : null}
            </div>
            {errorTel ? (
              <p id={errorId} className="mt-1 text-xs text-error">
                {errorTel}
              </p>
            ) : null}
          </div>
        );
      })}
      <button
        type="button"
        className="btn btn-link btn-sm pl-0 gap-1 text-sky-700"
        onClick={onAgregar}
        disabled={guardando}
      >
        <Plus size={14} aria-hidden />
        Agregar teléfono
      </button>
    </SeccionCard>
  );
}
