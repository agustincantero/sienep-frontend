import { HeartPulse, Info } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { SeccionCard, SeccionLegend } from "@/components/ui/SeccionFormulario";
import type { SeccionEstudianteProps } from "./tipos";

export function SaludSeccion({ form, errores, guardando, onCampo }: SeccionEstudianteProps) {
  return (
    <SeccionCard>
      <SeccionLegend icon={HeartPulse}>Información de salud</SeccionLegend>
      <div role="note" className="alert alert-info alert-soft text-sm">
        <Info size={16} aria-hidden />
        <span>Esta información solo la ven funcionarios con permiso para ver datos de salud.</span>
      </div>
      <Field label="Información de salud" fieldKey="informacionSalud">
        <textarea
          className="textarea w-full"
          placeholder="Información de salud"
          rows={2}
          value={form.informacionSalud}
          onChange={(e) => onCampo("informacionSalud", e.target.value)}
          disabled={guardando}
        />
      </Field>
      <Field label="Motivo de derivación" fieldKey="motivoDerivacion">
        <textarea
          className="textarea w-full"
          placeholder="Motivo de derivación"
          rows={2}
          value={form.motivoDerivacion}
          onChange={(e) => onCampo("motivoDerivacion", e.target.value)}
          disabled={guardando}
        />
      </Field>
      <Field label="Sistema de salud" fieldKey="sistemaSalud" error={errores.sistemaSalud}>
        <input
          className={`input w-full${errores.sistemaSalud ? " input-error" : ""}`}
          placeholder="Sistema de salud"
          value={form.sistemaSalud}
          maxLength={80}
          onChange={(e) => onCampo("sistemaSalud", e.target.value)}
          disabled={guardando}
        />
      </Field>
    </SeccionCard>
  );
}
