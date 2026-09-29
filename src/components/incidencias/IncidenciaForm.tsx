"use client";

import { cloneElement, isValidElement, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TriangleAlert, User } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { createIncidencia, updateIncidencia, type Incidencia, type IncidenciaInput } from "@/lib/incidencias";
import { listStudents, type StudentSummary } from "@/lib/students";

const TITULO_MAX = 150;
const LUGAR_MAX = 50;
const CANAL_MAX = 50;

type FormState = {
  idEstudiante: string;
  titulo: string;
  lugar: string;
  fechaHora: string;
  canal: string;
};

function estadoInicial(incidencia?: Incidencia): FormState {
  return {
    idEstudiante: incidencia ? String(incidencia.idEstudiante) : "",
    titulo: incidencia?.titulo ?? "",
    lugar: incidencia?.lugar ?? "",
    fechaHora: incidencia?.fechaHora.slice(0, 16) ?? "",
    canal: incidencia?.canal ?? "",
  };
}

function SeccionLegend({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <legend className="fieldset-legend text-sm font-semibold text-base-content mb-1 gap-1.5">
      <Icon size={15} aria-hidden className="text-primary" />
      {children}
    </legend>
  );
}

type IncidenciaFormProps =
  | { mode: "crear" }
  | { mode: "editar"; codInstancia: number; incidencia: Incidencia };

// A diferencia de InstanciaForm, acá el Estudiante SÍ es editable en ambos
// modos: el backend reusa IncidenciaRequestDTO para alta y edición, y
// IncidenciaService.editar() re-resuelve/re-valida idEstudiante (no lo deja
// afuera como InstanciaComunUpdateDTO).
export function IncidenciaForm(props: IncidenciaFormProps) {
  const router = useRouter();
  const esEdicion = props.mode === "editar";

  const [form, setForm] = useState<FormState>(() =>
    estadoInicial(esEdicion ? props.incidencia : undefined),
  );
  const [estudiantes, setEstudiantes] = useState<StudentSummary[]>([]);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    listStudents({ size: 1000 })
      .then((res) => setEstudiantes(res.content))
      .catch(() => setEstudiantes([]));
  }, []);

  function campo<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }));
  }

  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.idEstudiante) {
      e.idEstudiante = "Elegí un estudiante.";
    }
    if (!form.titulo.trim()) {
      e.titulo = "El título es obligatorio.";
    } else if (form.titulo.length > TITULO_MAX) {
      e.titulo = `Máximo ${TITULO_MAX} caracteres.`;
    }
    if (!form.lugar.trim()) {
      e.lugar = "El lugar es obligatorio.";
    } else if (form.lugar.length > LUGAR_MAX) {
      e.lugar = `Máximo ${LUGAR_MAX} caracteres.`;
    }
    if (!form.fechaHora) {
      e.fechaHora = "La fecha y hora son obligatorias.";
    }
    if (form.canal.length > CANAL_MAX) {
      e.canal = `Máximo ${CANAL_MAX} caracteres.`;
    }
    return e;
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setErrorGeneral("");

    const erroresValidacion = validar();
    setErrores(erroresValidacion);
    const primerCampoError = Object.keys(erroresValidacion).find((k) => erroresValidacion[k]);
    if (primerCampoError) {
      document.getElementById(primerCampoError)?.focus();
      return;
    }

    const dto: IncidenciaInput = {
      idEstudiante: Number(form.idEstudiante),
      titulo: form.titulo.trim(),
      lugar: form.lugar.trim(),
      fechaHora: form.fechaHora,
      canal: form.canal.trim() || undefined,
    };

    setGuardando(true);
    try {
      if (esEdicion) {
        await updateIncidencia(props.codInstancia, dto);
        router.push(`/incidencias/${props.codInstancia}`);
      } else {
        const creada = await createIncidencia(dto);
        router.push(`/incidencias/${creada.codInstancia}`);
      }
    } catch (err) {
      setErrorGeneral(apiErrorMessage(err, "No se pudo guardar la incidencia. Probá de nuevo."));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[600px] mx-auto w-full px-4 py-5">
        <button
          type="button"
          className="btn btn-link btn-sm pl-0 no-underline mb-2 gap-1"
          onClick={() => router.back()}
        >
          <ArrowLeft size={14} aria-hidden />
          Cancelar
        </button>

        <h1 className="text-xl font-bold mb-4">{esEdicion ? "Editar incidencia" : "Nueva incidencia"}</h1>

        {errorGeneral ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-4">
            <span>{errorGeneral}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <fieldset className="fieldset space-y-3 p-4 rounded-box border border-base-300">
            <SeccionLegend icon={TriangleAlert}>Datos de la incidencia</SeccionLegend>

            <Field label="Estudiante" fieldKey="idEstudiante" error={errores.idEstudiante}>
              <select
                className={`select w-full${errores.idEstudiante ? " select-error" : ""}`}
                value={form.idEstudiante}
                onChange={(e) => campo("idEstudiante", e.target.value)}
                disabled={guardando}
                required
              >
                <option value="">Seleccioná un estudiante</option>
                {estudiantes.map((est) => (
                  <option key={est.idUsuario} value={est.idUsuario}>
                    {est.nombre} {est.apellido}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Título" fieldKey="titulo" error={errores.titulo}>
              <input
                className={`input w-full${errores.titulo ? " input-error" : ""}`}
                placeholder="Título"
                value={form.titulo}
                maxLength={TITULO_MAX}
                onChange={(e) => campo("titulo", e.target.value)}
                disabled={guardando}
                required
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Lugar" fieldKey="lugar" error={errores.lugar}>
                <input
                  className={`input w-full${errores.lugar ? " input-error" : ""}`}
                  placeholder="Lugar"
                  value={form.lugar}
                  maxLength={LUGAR_MAX}
                  onChange={(e) => campo("lugar", e.target.value)}
                  disabled={guardando}
                  required
                />
              </Field>
              <Field label="Canal" fieldKey="canal" error={errores.canal}>
                <input
                  className={`input w-full${errores.canal ? " input-error" : ""}`}
                  placeholder="Presencial, telefónico…"
                  value={form.canal}
                  maxLength={CANAL_MAX}
                  onChange={(e) => campo("canal", e.target.value)}
                  disabled={guardando}
                />
              </Field>
              {/* datetime-local y no date: el mock de baja fidelidad solo pide
                  fecha para incidencias, pero IncidenciaRequestDTO.fechaHora es
                  un LocalDateTime @NotNull — se necesita la hora igual que en
                  instancia, o se perdería ese dato al guardar. */}
              <Field label="Fecha y hora" fieldKey="fechaHora" error={errores.fechaHora}>
                <input
                  type="datetime-local"
                  className={`input w-full${errores.fechaHora ? " input-error" : ""}`}
                  value={form.fechaHora}
                  onChange={(e) => campo("fechaHora", e.target.value)}
                  disabled={guardando}
                  required
                />
              </Field>
            </div>
          </fieldset>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => router.back()} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? <span className="loading loading-spinner loading-sm" /> : null}
              {esEdicion ? "Guardar cambios" : "Guardar incidencia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Ver comentario del mismo helper en InstanciaForm.tsx.
function Field({
  label,
  error,
  fieldKey,
  children,
}: {
  label: string;
  error?: string;
  fieldKey: string;
  children: React.ReactElement;
}) {
  const errorId = `${fieldKey}-error`;
  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id: fieldKey,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      })
    : children;

  return (
    <div>
      <label className="floating-label">
        {control}
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
