"use client";

import { cloneElement, isValidElement, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, User } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { listCategoriasInstancia, type CategoriaInstancia } from "@/lib/categorias-instancia";
import {
  createInstancia,
  updateInstancia,
  type InstanciaComun,
  type InstanciaComunCreateInput,
  type InstanciaComunUpdateInput,
} from "@/lib/instancias";
import { listStudents, type StudentSummary } from "@/lib/students";

const TITULO_MAX = 150;
const CANAL_MAX = 50;

type FormState = {
  idEstudiante: string;
  titulo: string;
  idCategoria: string;
  fechaHora: string;
  canal: string;
};

function estadoInicial(instancia?: InstanciaComun, idEstudianteFijo?: number): FormState {
  return {
    idEstudiante: instancia ? String(instancia.idEstudiante) : idEstudianteFijo ? String(idEstudianteFijo) : "",
    titulo: instancia?.titulo ?? "",
    idCategoria: instancia ? String(instancia.idCategoria) : "",
    // El backend manda "yyyy-MM-ddTHH:mm:ss"; datetime-local solo entiende hasta los minutos, así que se recorta.
    fechaHora: instancia?.fechaHora.slice(0, 16) ?? "",
    canal: instancia?.canal ?? "",
  };
}

// Mismo patrón que SeccionLegend/SeccionCard de StudentForm — un solo fieldset alcanza acá, el form es corto.
function SeccionLegend({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <legend className="fieldset-legend text-sm font-semibold text-base-content mb-1 gap-1.5">
      <Icon size={15} aria-hidden className="text-primary" />
      {children}
    </legend>
  );
}

type InstanciaFormProps =
  // idEstudianteFijo: alta desde la ficha del estudiante (RF18), con el estudiante preseleccionado y bloqueado.
  | { mode: "crear"; idEstudianteFijo?: number }
  | { mode: "editar"; codInstancia: number; instancia: InstanciaComun; volverAEstudiante?: boolean };

export function InstanciaForm(props: InstanciaFormProps) {
  const router = useRouter();
  const esEdicion = props.mode === "editar";

  const idEstudianteFijo = props.mode === "crear" ? props.idEstudianteFijo : undefined;
  const [form, setForm] = useState<FormState>(() =>
    estadoInicial(esEdicion ? props.instancia : undefined, idEstudianteFijo),
  );
  const [estudiantes, setEstudiantes] = useState<StudentSummary[]>([]);
  const [categorias, setCategorias] = useState<CategoriaInstancia[]>([]);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    // Estudiante inmutable en edición (ver abajo), así que solo hace falta la lista para el combo del alta.
    if (!esEdicion) {
      listStudents({ size: 1000 })
        .then((res) => setEstudiantes(res.content))
        .catch(() => setEstudiantes([]));
    }
    // La categoría requiere VER_CATEGORIAS_INSTANCIA — si el rol no lo tiene, el combo queda vacío y el usuario no puede guardar hasta que se corrija del lado del backend. No se rompe la pantalla por eso.
    listCategoriasInstancia()
      .then(setCategorias)
      .catch(() => setCategorias([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr al montar
  }, []);

  function campo<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }));
  }

  // Mismo criterio de orden que StudentForm.validar(): define qué campo se enfoca si falla, sigue el orden en pantalla.
  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!esEdicion && !form.idEstudiante) {
      e.idEstudiante = "Elegí un estudiante.";
    }
    if (!form.titulo.trim()) {
      e.titulo = "El título es obligatorio.";
    } else if (form.titulo.trim().length > TITULO_MAX) {
      e.titulo = `Máximo ${TITULO_MAX} caracteres.`;
    }
    if (!form.idCategoria) {
      e.idCategoria = "Elegí una categoría.";
    }
    if (!form.fechaHora) {
      e.fechaHora = "La fecha y hora son obligatorias.";
    }
    if (form.canal.trim().length > CANAL_MAX) {
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

    const datosComunes = {
      titulo: form.titulo.trim(),
      fechaHora: form.fechaHora,
      idCategoria: Number(form.idCategoria),
      canal: form.canal.trim() || undefined,
    } satisfies InstanciaComunUpdateInput;

    setGuardando(true);
    try {
      if (esEdicion) {
        await updateInstancia(props.codInstancia, datosComunes);
        router.push(`/instancias/${props.codInstancia}${props.volverAEstudiante ? "?desde=estudiante" : ""}`);
      } else {
        const dto: InstanciaComunCreateInput = {
          ...datosComunes,
          idEstudiante: Number(form.idEstudiante),
        };
        const creada = await createInstancia(dto);
        // Desde la ficha, el detalle muestra "Volver al estudiante" (mismo ?desde=estudiante que usan sus pestañas).
        router.push(`/instancias/${creada.codInstancia}${idEstudianteFijo ? "?desde=estudiante" : ""}`);
      }
    } catch (err) {
      setErrorGeneral(apiErrorMessage(err, "No se pudo guardar la instancia. Probá de nuevo."));
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

        <h1 className="text-xl font-bold mb-4">{esEdicion ? "Editar instancia" : "Nueva instancia"}</h1>

        {errorGeneral ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-4">
            <span>{errorGeneral}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <fieldset className="fieldset space-y-3 p-4 rounded-box border border-base-300">
            <SeccionLegend icon={CalendarClock}>Datos de la instancia</SeccionLegend>

            {esEdicion ? (
              <Field label="Estudiante" fieldKey="estudianteReadOnly">
                {/* Inmutable después de creada: InstanciaComunUpdateDTO no acepta idEstudiante. Se muestra deshabilitado (no oculto) para no perder el contexto de a quién pertenece la instancia. */}
                <input className="input w-full" value={props.instancia.nombreEstudiante} disabled />
              </Field>
            ) : (
              <Field label="Estudiante" fieldKey="idEstudiante" error={errores.idEstudiante}>
                {/* Con idEstudianteFijo (alta desde la ficha) el combo queda bloqueado en ese estudiante: se muestra igual, para que se vea a quién se le crea. */}
                <select
                  className={`select w-full${errores.idEstudiante ? " select-error" : ""}`}
                  value={form.idEstudiante}
                  onChange={(e) => campo("idEstudiante", e.target.value)}
                  disabled={guardando || idEstudianteFijo !== undefined}
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
            )}

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Categoría" fieldKey="idCategoria" error={errores.idCategoria}>
                <select
                  className={`select w-full${errores.idCategoria ? " select-error" : ""}`}
                  value={form.idCategoria}
                  onChange={(e) => campo("idCategoria", e.target.value)}
                  disabled={guardando}
                  required
                >
                  <option value="">Seleccioná una categoría</option>
                  {categorias.map((c) => (
                    <option key={c.idCategoria} value={c.idCategoria}>
                      {c.nomCategoria}
                    </option>
                  ))}
                </select>
              </Field>
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

            <Field label="Canal" fieldKey="canal" error={errores.canal}>
              <input
                className={`input w-full${errores.canal ? " input-error" : ""}`}
                placeholder="Presencial, telefónico, videollamada…"
                value={form.canal}
                maxLength={CANAL_MAX}
                onChange={(e) => campo("canal", e.target.value)}
                disabled={guardando}
              />
            </Field>
          </fieldset>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => router.back()} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? <span className="loading loading-spinner loading-sm" /> : null}
              {esEdicion ? "Guardar cambios" : "Guardar instancia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Idéntico al Field de StudentForm.tsx — se duplica acá porque StudentForm no lo exporta.
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
