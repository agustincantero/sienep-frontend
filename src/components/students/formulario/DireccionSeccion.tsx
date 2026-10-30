import { MapPin } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { SeccionCard, SeccionLegend } from "@/components/ui/SeccionFormulario";
import type { SeccionEstudianteProps } from "./tipos";

export function DireccionSeccion({ form, errores, guardando, onCampo }: SeccionEstudianteProps) {
  return (
    <SeccionCard>
      <SeccionLegend icon={MapPin}>Dirección</SeccionLegend>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <Field label="Calle" fieldKey="calle" error={errores.calle}>
            <input
              className={`input w-full${errores.calle ? " input-error" : ""}`}
              placeholder="Calle"
              value={form.calle}
              maxLength={160}
              onChange={(e) => onCampo("calle", e.target.value)}
              disabled={guardando}
            />
          </Field>
        </div>
        <Field label="Número" fieldKey="nroPuerta" error={errores.nroPuerta}>
          {/* type="text" + inputMode="numeric" y no type="number": el navegador ignora maxLength en los number, así que dejaba escribir más de 4 dígitos y recién avisaba al validar. Así el tope se aplica mientras se escribe y se descarta todo lo que no sea dígito (también "e", "-", "." que un number acepta). */}
          <input
            type="text"
            inputMode="numeric"
            className={`input w-full${errores.nroPuerta ? " input-error" : ""}`}
            placeholder="Número"
            value={form.nroPuerta}
            maxLength={4}
            onChange={(e) => onCampo("nroPuerta", e.target.value.replace(/\D/g, ""))}
            disabled={guardando}
          />
        </Field>
        <Field label="Ciudad" fieldKey="ciudad" error={errores.ciudad}>
          <input
            className={`input w-full${errores.ciudad ? " input-error" : ""}`}
            placeholder="Ciudad"
            value={form.ciudad}
            maxLength={50}
            onChange={(e) => onCampo("ciudad", e.target.value)}
            disabled={guardando}
          />
        </Field>
      </div>
      <Field label="Departamento" fieldKey="departamento" error={errores.departamento}>
        <input
          className={`input w-full sm:w-1/2${errores.departamento ? " input-error" : ""}`}
          placeholder="Departamento"
          value={form.departamento}
          maxLength={20}
          onChange={(e) => onCampo("departamento", e.target.value)}
          disabled={guardando}
        />
      </Field>
    </SeccionCard>
  );
}
