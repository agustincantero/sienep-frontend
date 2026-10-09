"use client";

import { cloneElement, useState } from "react";
import { MapPin, Pencil, Plus, X } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { updateMisDatos, type MiPerfilEstudiante } from "@/lib/students";
import {
  NRO_PUERTA_INVALIDO_MSG,
  TELEFONO_INVALIDO_MSG,
  TELEFONO_REGEX,
  TEXTO_INVALIDO_MSG,
  TEXTO_REGEX,
} from "@/lib/validaciones-estudiante";
import { Dato } from "./Dato";
import { SeccionCard } from "./SeccionCard";

type FormState = {
  calle: string;
  nroPuerta: string;
  ciudad: string;
  departamento: string;
  telefonos: string[];
};

function estadoInicial(perfil: MiPerfilEstudiante): FormState {
  return {
    calle: perfil.calle ?? "",
    nroPuerta: perfil.nroPuerta != null ? String(perfil.nroPuerta) : "",
    ciudad: perfil.ciudad ?? "",
    departamento: perfil.departamento ?? "",
    // Al menos una fila para poder escribir un teléfono aunque no tenga ninguno cargado.
    telefonos: perfil.telefonos.length > 0 ? [...perfil.telefonos] : [""],
  };
}

export function formatDireccion(perfil: MiPerfilEstudiante): string {
  const calle = [perfil.calle, perfil.nroPuerta].filter(Boolean).join(" ");
  return [calle, perfil.ciudad, perfil.departamento].filter(Boolean).join(", ");
}

// Autogestión del estudiante (PUT /estudiantes/{id}/mis-datos): solo dirección y teléfonos. El resto de los datos
// (identidad, grupos, salud) los actualiza la coordinación.
export function ContactoCard({
  perfil,
  onGuardado,
}: {
  perfil: MiPerfilEstudiante;
  onGuardado: (actualizado: MiPerfilEstudiante) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<FormState>(() => estadoInicial(perfil));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState("");

  function abrirEdicion() {
    setForm(estadoInicial(perfil));
    setErrores({});
    setErrorGeneral("");
    setExito("");
    setEditando(true);
  }

  function campo<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }));
  }

  function cambiarTelefono(idx: number, value: string) {
    setForm((f) => ({ ...f, telefonos: f.telefonos.map((t, i) => (i === idx ? value : t)) }));
    const key = `telefono-${idx}`;
    if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }));
  }

  // Al quitar una fila se descartan los errores de teléfono: sus claves dependen del índice y quedarían corridas.
  function quitarTelefono(idx: number) {
    setForm((f) => ({ ...f, telefonos: f.telefonos.filter((_, i) => i !== idx) }));
    setErrores((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith("telefono-"))));
  }

  // Mismas reglas que StudentForm. El orden de los checks define qué campo se enfoca primero: sigue el de la pantalla.
  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    form.telefonos.forEach((tel, idx) => {
      if (tel.trim() && !TELEFONO_REGEX.test(tel.trim())) e[`telefono-${idx}`] = TELEFONO_INVALIDO_MSG;
    });
    if (form.calle.trim() && !TEXTO_REGEX.test(form.calle)) e.calle = TEXTO_INVALIDO_MSG;
    if (form.nroPuerta) {
      const n = Number(form.nroPuerta);
      if (!Number.isInteger(n) || n < 1 || n > 9999) e.nroPuerta = NRO_PUERTA_INVALIDO_MSG;
    }
    if (form.ciudad.trim() && !TEXTO_REGEX.test(form.ciudad)) e.ciudad = TEXTO_INVALIDO_MSG;
    if (form.departamento.trim() && !TEXTO_REGEX.test(form.departamento)) e.departamento = TEXTO_INVALIDO_MSG;
    return e;
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setErrorGeneral("");
    const e = validar();
    setErrores(e);
    const primero = Object.keys(e)[0];
    if (primero) {
      document.getElementById(`contacto-${primero}`)?.focus();
      return;
    }

    setGuardando(true);
    try {
      // Reemplazo completo: un campo vacío se manda como ausente y queda borrado.
      const actualizado = await updateMisDatos(perfil.idUsuario, {
        calle: form.calle.trim() || undefined,
        nroPuerta: form.nroPuerta ? Number(form.nroPuerta) : undefined,
        ciudad: form.ciudad.trim() || undefined,
        departamento: form.departamento.trim() || undefined,
        telefonos: form.telefonos.map((t) => t.trim()).filter(Boolean),
      });
      onGuardado(actualizado);
      setEditando(false);
      setExito("Tus datos de contacto se actualizaron.");
    } catch (err) {
      setErrorGeneral(apiErrorMessage(err, "No se pudieron guardar tus datos. Probá de nuevo."));
    } finally {
      setGuardando(false);
    }
  }

  if (!editando) {
    return (
      <SeccionCard icon={MapPin} titulo="Contacto y dirección">
        {exito ? (
          <div role="status" className="alert alert-success alert-soft text-sm">
            <span>{exito}</span>
          </div>
        ) : null}
        <div>
          <Dato label="Teléfono" value={perfil.telefonos.join(", ")} />
          <Dato label="Dirección" value={formatDireccion(perfil)} />
        </div>
        <div>
          <button type="button" className="btn btn-outline btn-sm gap-1" onClick={abrirEdicion}>
            <Pencil size={14} aria-hidden />
            Editar contacto
          </button>
        </div>
      </SeccionCard>
    );
  }

  return (
    <SeccionCard icon={MapPin} titulo="Contacto y dirección">
      {/* noValidate: mismo motivo que en StudentForm — la validación la hace validar() con mensajes propios. */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4 text-sm">
        <div className="space-y-2">
          <p className="font-semibold text-base-content">Teléfonos</p>
          {form.telefonos.map((tel, idx) => {
            const key = `telefono-${idx}`;
            const errorTel = errores[key];
            return (
              <div key={idx}>
                <div className="flex gap-2">
                  <input
                    id={`contacto-${key}`}
                    className={`input w-full max-w-xs${errorTel ? " input-error" : ""}`}
                    placeholder="099123456"
                    aria-label={`Teléfono ${idx + 1}`}
                    inputMode="numeric"
                    value={tel}
                    maxLength={12}
                    onChange={(e) => cambiarTelefono(idx, e.target.value)}
                    disabled={guardando}
                    aria-invalid={errorTel ? true : undefined}
                    aria-describedby={errorTel ? `contacto-${key}-error` : undefined}
                  />
                  {form.telefonos.length > 1 ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => quitarTelefono(idx)}
                      disabled={guardando}
                      aria-label={`Quitar teléfono ${idx + 1}`}
                    >
                      <X size={14} aria-hidden />
                    </button>
                  ) : null}
                </div>
                {errorTel ? (
                  <p id={`contacto-${key}-error`} className="mt-1 text-xs text-error">
                    {errorTel}
                  </p>
                ) : null}
              </div>
            );
          })}
          <button
            type="button"
            className="btn btn-link btn-sm pl-0 gap-1"
            onClick={() => setForm((f) => ({ ...f, telefonos: [...f.telefonos, ""] }))}
            disabled={guardando}
          >
            <Plus size={14} aria-hidden />
            Agregar teléfono
          </button>
        </div>

        <div className="space-y-3">
          <p className="font-semibold text-base-content">Dirección</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <Campo label="Calle" fieldKey="calle" error={errores.calle}>
                <input
                  className={`input w-full${errores.calle ? " input-error" : ""}`}
                  placeholder="Calle"
                  value={form.calle}
                  maxLength={160}
                  onChange={(e) => campo("calle", e.target.value)}
                  disabled={guardando}
                />
              </Campo>
            </div>
            <Campo label="Número" fieldKey="nroPuerta" error={errores.nroPuerta}>
              {/* Igual que en StudentForm: text + inputMode numeric para que el tope de 4 dígitos se aplique al escribir. */}
              <input
                type="text"
                inputMode="numeric"
                className={`input w-full${errores.nroPuerta ? " input-error" : ""}`}
                placeholder="Número"
                value={form.nroPuerta}
                maxLength={4}
                onChange={(e) => campo("nroPuerta", e.target.value.replace(/\D/g, ""))}
                disabled={guardando}
              />
            </Campo>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Ciudad" fieldKey="ciudad" error={errores.ciudad}>
              <input
                className={`input w-full${errores.ciudad ? " input-error" : ""}`}
                placeholder="Ciudad"
                value={form.ciudad}
                maxLength={50}
                onChange={(e) => campo("ciudad", e.target.value)}
                disabled={guardando}
              />
            </Campo>
            <Campo label="Departamento" fieldKey="departamento" error={errores.departamento}>
              <input
                className={`input w-full${errores.departamento ? " input-error" : ""}`}
                placeholder="Departamento"
                value={form.departamento}
                maxLength={20}
                onChange={(e) => campo("departamento", e.target.value)}
                disabled={guardando}
              />
            </Campo>
          </div>
        </div>

        {errorGeneral ? (
          <div role="alert" className="alert alert-error alert-soft text-sm">
            <span>{errorGeneral}</span>
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditando(false)} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
            {guardando ? <span className="loading loading-spinner loading-xs" /> : null}
            Guardar cambios
          </button>
        </div>
      </form>
    </SeccionCard>
  );
}

// Campo con floating-label, mismo patrón que Field en StudentForm: el id y los aria del control se arman acá.
function Campo({
  label,
  fieldKey,
  error,
  children,
}: {
  label: string;
  fieldKey: string;
  error?: string;
  children: React.ReactElement<Record<string, unknown>>;
}) {
  const id = `contacto-${fieldKey}`;
  const errorId = `${id}-error`;
  return (
    <div>
      <label className="floating-label">
        {cloneElement(children, {
          id,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? errorId : undefined,
        })}
        <span>{label}</span>
      </label>
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
