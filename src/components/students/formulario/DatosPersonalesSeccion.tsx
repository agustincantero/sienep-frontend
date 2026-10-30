import { User } from "lucide-react";
import { PAISES, PAISES_FRECUENTES } from "@/lib/paises";
import { FECHA_NACIMIENTO_MAX, FECHA_NACIMIENTO_MIN } from "@/lib/validaciones-estudiante";
import { Field } from "@/components/ui/Field";
import { SeccionCard, SeccionLegend } from "@/components/ui/SeccionFormulario";
import type { SeccionEstudianteProps } from "./tipos";

export function DatosPersonalesSeccion({
  form,
  errores,
  guardando,
  onCampo,
  esEdicion,
}: SeccionEstudianteProps & { esEdicion: boolean }) {
  return (
    <SeccionCard>
      <SeccionLegend icon={User}>Datos personales</SeccionLegend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nombre" fieldKey="nombre" error={errores.nombre} required>
          <input
            className={`input w-full${errores.nombre ? " input-error" : ""}`}
            placeholder="Nombre"
            value={form.nombre}
            maxLength={30}
            onChange={(e) => onCampo("nombre", e.target.value)}
            disabled={guardando}
            required
          />
        </Field>
        <Field label="Apellido" fieldKey="apellido" error={errores.apellido} required>
          <input
            className={`input w-full${errores.apellido ? " input-error" : ""}`}
            placeholder="Apellido"
            value={form.apellido}
            maxLength={30}
            onChange={(e) => onCampo("apellido", e.target.value)}
            disabled={guardando}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* En edición el documento no se puede cambiar (va deshabilitado), así que no se marca. */}
        <Field label="Documento" fieldKey="documento" error={errores.documento} required={!esEdicion}>
          <input
            className={`input w-full${errores.documento ? " input-error" : ""}`}
            placeholder="Documento"
            value={form.documento}
            maxLength={12}
            onChange={(e) => onCampo("documento", e.target.value)}
            disabled={guardando || esEdicion}
            required
          />
        </Field>
        <Field label="País del documento" fieldKey="paisDocumento">
          <select
            className="select w-full"
            value={form.paisDocumento}
            onChange={(e) => onCampo("paisDocumento", e.target.value)}
            disabled={guardando || esEdicion}
          >
            <optgroup label="Frecuentes">
              {PAISES_FRECUENTES.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.nombre}
                </option>
              ))}
            </optgroup>
            {/* Los frecuentes se repiten acá a propósito, para que cada país también esté en su lugar alfabético. */}
            <optgroup label="Todos los países">
              {PAISES.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.nombre}
                </option>
              ))}
            </optgroup>
          </select>
        </Field>
        <Field
          label="Fecha de nacimiento"
          fieldKey="fechaNacimiento"
          error={errores.fechaNacimiento}
          required
        >
          <input
            type="date"
            className={`input w-full${errores.fechaNacimiento ? " input-error" : ""}`}
            value={form.fechaNacimiento}
            min={FECHA_NACIMIENTO_MIN}
            max={FECHA_NACIMIENTO_MAX}
            onChange={(e) => onCampo("fechaNacimiento", e.target.value)}
            disabled={guardando}
            required
          />
        </Field>
      </div>

      <Field label="Email" fieldKey="email" error={errores.email} required>
        <input
          type="email"
          className={`input w-full${errores.email ? " input-error" : ""}`}
          placeholder="Email"
          value={form.email}
          onChange={(e) => onCampo("email", e.target.value)}
          disabled={guardando}
          required
        />
      </Field>
    </SeccionCard>
  );
}
