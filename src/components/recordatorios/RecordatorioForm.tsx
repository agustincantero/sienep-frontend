"use client";

import { cloneElement, isValidElement, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Repeat, User } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { hrefListado } from "@/lib/catalogos-tabs";
import { listCategoriasRecordatorio, type CategoriaRecordatorio } from "@/lib/categorias-recordatorio";
import { ahoraParaInputLocal } from "@/lib/format";
import { listFrecuencias, type Frecuencia } from "@/lib/frecuencias";
import { getInstancia, type InstanciaComun } from "@/lib/instancias";
import {
  createRecordatorio,
  TIPOS_RECORDATORIO,
  updateRecordatorio,
  type Recordatorio,
  type RecordatorioInput,
  type TipoRecordatorio,
} from "@/lib/recordatorios";
import { useSession } from "@/lib/session-context";
import { BackButton } from "@/components/layout/BackButton";
import { etiquetaInstancia, InstanciaSelector } from "./InstanciaSelector";

const TITULO_MAX = 150;
const OCURRENCIAS_MAX = 5;

// Cómo termina un recordatorio que se repite: el backend exige fecha de fin o cantidad de repeticiones (una de las dos).
type FinRepeticion = "fecha" | "ocurrencias";

type FormState = {
  titulo: string;
  tipo: TipoRecordatorio | "";
  idCategoria: string;
  fechaHora: string;
  idFrecuencia: string;
  fin: FinRepeticion;
  fechaFin: string;
  nroOcurrencias: string;
};

function estadoInicial(recordatorio?: Recordatorio): FormState {
  return {
    titulo: recordatorio?.titulo ?? "",
    tipo: recordatorio?.tipo ?? "",
    idCategoria: recordatorio ? String(recordatorio.idCategoria) : "",
    // El backend manda "yyyy-MM-ddTHH:mm:ss"; datetime-local solo entiende hasta los minutos, así que se recorta.
    fechaHora: recordatorio?.fechaHora.slice(0, 16) ?? "",
    idFrecuencia: recordatorio?.idFrecuencia != null ? String(recordatorio.idFrecuencia) : "",
    fin: recordatorio?.nroOcurrencias != null && !recordatorio.fechaFin ? "ocurrencias" : "fecha",
    fechaFin: recordatorio?.fechaFin ?? "",
    nroOcurrencias: recordatorio?.nroOcurrencias != null ? String(recordatorio.nroOcurrencias) : "",
  };
}

// Mismo patrón que SeccionLegend de InstanciaForm/StudentForm.
function SeccionLegend({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <legend className="fieldset-legend text-sm font-semibold text-base-content mb-1 gap-1.5">
      <Icon size={15} aria-hidden className="text-primary" />
      {children}
    </legend>
  );
}

type RecordatorioFormProps =
  // instanciaFija: alta desde el detalle de la instancia, con la instancia preseleccionada y bloqueada (todo recordatorio pertenece a una instancia).
  | { mode: "crear"; instanciaFija?: InstanciaComun }
  | { mode: "editar"; codRecordatorio: number; recordatorio: Recordatorio; volverAInstancia?: boolean };

export function RecordatorioForm(props: RecordatorioFormProps) {
  const router = useRouter();
  const { idUsuario, permisos } = useSession();
  const esEdicion = props.mode === "editar";
  const instanciaFija = props.mode === "crear" ? props.instanciaFija : undefined;
  const recordatorio = esEdicion ? props.recordatorio : undefined;
  // El backend exige idResponsable, pero no se elige ni se muestra en el formulario: es quien crea el recordatorio, y al editar se conserva el que ya tenía. Se ve en el detalle.
  const idResponsable = recordatorio?.idResponsable ?? idUsuario;
  const puedeGestionarFrecuencias = permisos.includes("CREAR_RECORDATORIO");

  const [form, setForm] = useState<FormState>(() => estadoInicial(recordatorio));
  // Instancia elegida en el buscador; fija si se llegó desde la instancia.
  const [instancia, setInstancia] = useState<InstanciaComun | null>(instanciaFija ?? null);
  // Al editar, la instancia no se puede cambiar: se lee solo para mostrar su identificador de negocio (RecordatorioResponseDTO no lo trae).
  const [instanciaActual, setInstanciaActual] = useState<InstanciaComun | null>(null);
  const [categorias, setCategorias] = useState<CategoriaRecordatorio[]>([]);
  const [frecuencias, setFrecuencias] = useState<Frecuencia[] | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const ahora = ahoraParaInputLocal();
  // El backend exige fecha futura también al editar (aunque no cambie): un recordatorio vencido solo se guarda si se lo pasa a una fecha nueva.
  const vencido = recordatorio != null && recordatorio.fechaHora.slice(0, 16) <= ahora;

  useEffect(() => {
    if (recordatorio) {
      getInstancia(recordatorio.codInstancia)
        .then(setInstanciaActual)
        .catch(() => {});
    }
    // La categoría requiere VER_CATEGORIAS_RECORDATORIO — si el rol no lo tiene, el combo queda vacío (mismo caso que las categorías de instancia en InstanciaForm). No se rompe la pantalla por eso.
    listCategoriasRecordatorio()
      .then(setCategorias)
      .catch(() => setCategorias([]));
    // Sin frecuencias activas (o si la llamada falla), la sección de repetición avisa que no hay y dónde se cargan.
    listFrecuencias()
      .then(setFrecuencias)
      .catch(() => setFrecuencias([]));
  }, [recordatorio]);

  function campo<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }));
  }

  // Mismo criterio de orden que InstanciaForm.validar(): define qué campo se enfoca si falla, sigue el orden en pantalla.
  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!esEdicion && !instancia) {
      e.codInstancia = "Elegí la instancia a la que pertenece.";
    }
    if (!form.titulo.trim()) {
      e.titulo = "El título es obligatorio.";
    } else if (form.titulo.trim().length > TITULO_MAX) {
      e.titulo = `Máximo ${TITULO_MAX} caracteres.`;
    }
    if (!form.tipo) {
      e.tipo = "Elegí un tipo.";
    }
    if (!form.idCategoria) {
      e.idCategoria = "Elegí una categoría.";
    }
    if (!form.fechaHora) {
      e.fechaHora = "La fecha y hora son obligatorias.";
    } else if (form.fechaHora <= ahoraParaInputLocal()) {
      e.fechaHora = "La fecha y hora tienen que ser futuras.";
    }
    if (form.idFrecuencia) {
      if (form.fin === "fecha") {
        if (!form.fechaFin) {
          e.fechaFin = "Indicá hasta cuándo se repite.";
        } else if (form.fechaHora && form.fechaFin < form.fechaHora.slice(0, 10)) {
          e.fechaFin = "Tiene que ser igual o posterior a la fecha del recordatorio.";
        }
      } else {
        const n = Number(form.nroOcurrencias);
        if (!Number.isInteger(n) || n < 1 || n > OCURRENCIAS_MAX) {
          e.nroOcurrencias = `Entre 1 y ${OCURRENCIAS_MAX} repeticiones.`;
        }
      }
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

    const repite = form.idFrecuencia !== "";
    const dto: RecordatorioInput = {
      titulo: form.titulo.trim(),
      tipo: form.tipo as TipoRecordatorio,
      fechaHora: form.fechaHora,
      codInstancia: recordatorio ? recordatorio.codInstancia : instancia!.codInstancia,
      idCategoria: Number(form.idCategoria),
      idResponsable,
      // Sin frecuencia no se manda el fin: el PUT es un reemplazo total, así que omitirlos también borra una repetición que se quitó.
      idFrecuencia: repite ? Number(form.idFrecuencia) : undefined,
      fechaFin: repite && form.fin === "fecha" ? form.fechaFin : undefined,
      nroOcurrencias: repite && form.fin === "ocurrencias" ? Number(form.nroOcurrencias) : undefined,
    };

    setGuardando(true);
    try {
      if (esEdicion) {
        await updateRecordatorio(props.codRecordatorio, dto);
        router.push(`/recordatorios/${props.codRecordatorio}${props.volverAInstancia ? "?desde=instancia" : ""}`);
      } else {
        const creado = await createRecordatorio(dto);
        // Desde el detalle de la instancia, el del recordatorio muestra "Volver a la instancia".
        router.push(`/recordatorios/${creado.codRecordatorio}${instanciaFija ? "?desde=instancia" : ""}`);
      }
    } catch (err) {
      setErrorGeneral(apiErrorMessage(err, "No se pudo guardar el recordatorio. Probá de nuevo."));
    } finally {
      setGuardando(false);
    }
  }

  // La frecuencia guardada puede haberse dado de baja: se muestra igual para no perderla al editar.
  const activas = (frecuencias ?? []).map((f) => ({ id: f.idFrecuencia, label: f.descripcion }));
  const opcionesFrecuencia =
    recordatorio?.idFrecuencia != null && !activas.some((f) => f.id === recordatorio.idFrecuencia)
      ? [...activas, { id: recordatorio.idFrecuencia, label: recordatorio.descripcionFrecuencia ?? "Frecuencia actual" }]
      : activas;

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[600px] mx-auto w-full px-4 py-5">
        <BackButton onClick={() => router.back()} label="Cancelar" />

        <h1 className="text-xl font-bold mb-4">{esEdicion ? "Editar recordatorio" : "Nuevo recordatorio"}</h1>

        {vencido ? (
          <div role="status" className="alert alert-info alert-soft text-sm mb-4">
            <span>Este recordatorio ya venció: para guardar cambios, elegí una fecha y hora futuras.</span>
          </div>
        ) : null}

        {errorGeneral ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-4">
            <span>{errorGeneral}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <fieldset className="fieldset space-y-3 p-4 rounded-box border border-base-300">
            <SeccionLegend icon={Bell}>Datos del recordatorio</SeccionLegend>

            <div>
              {esEdicion || instanciaFija ? (
                <Field label="Instancia asociada" fieldKey="instanciaReadOnly">
                  {/* Inmutable después de creado (el backend responde 409), y fija si se llegó desde la instancia: se muestra deshabilitada para no perder el contexto. */}
                  <input
                    className="input w-full"
                    value={
                      instanciaFija
                        ? `${etiquetaInstancia(instanciaFija)} — ${instanciaFija.nombreEstudiante}`
                        : instanciaActual
                          ? `${etiquetaInstancia(instanciaActual)} — ${instanciaActual.nombreEstudiante}`
                          : recordatorio!.tituloInstancia
                    }
                    disabled
                  />
                </Field>
              ) : (
                <InstanciaSelector
                  label="Instancia asociada"
                  fieldKey="codInstancia"
                  value={instancia}
                  onChange={(i) => {
                    setInstancia(i);
                    if (errores.codInstancia) setErrores((e) => ({ ...e, codInstancia: "" }));
                  }}
                  error={errores.codInstancia}
                  disabled={guardando}
                />
              )}
              <p className="mt-1 text-xs text-base-content/70">Todo recordatorio tiene que estar asociado a una instancia.</p>
            </div>

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
              <Field label="Tipo" fieldKey="tipo" error={errores.tipo}>
                <select
                  className={`select w-full${errores.tipo ? " select-error" : ""}`}
                  value={form.tipo}
                  onChange={(e) => campo("tipo", e.target.value as TipoRecordatorio | "")}
                  disabled={guardando}
                  required
                >
                  <option value="">Seleccioná un tipo</option>
                  {Object.entries(TIPOS_RECORDATORIO).map(([valor, label]) => (
                    <option key={valor} value={valor}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
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
            </div>

            <Field label="Fecha y hora" fieldKey="fechaHora" error={errores.fechaHora}>
              <input
                type="datetime-local"
                className={`input w-full${errores.fechaHora ? " input-error" : ""}`}
                value={form.fechaHora}
                min={ahora}
                suppressHydrationWarning
                onChange={(e) => campo("fechaHora", e.target.value)}
                disabled={guardando}
                required
              />
            </Field>
          </fieldset>

          <fieldset className="fieldset space-y-3 p-4 rounded-box border border-base-300">
            <SeccionLegend icon={Repeat}>Repetición</SeccionLegend>

            {frecuencias == null ? (
              <span className="loading loading-spinner loading-sm" role="status" aria-label="Cargando frecuencias" />
            ) : opcionesFrecuencia.length === 0 ? (
              <p className="text-sm text-base-content/70">
                No hay frecuencias cargadas, así que el recordatorio no se repite.
                {puedeGestionarFrecuencias ? (
                  <>
                    {" "}Se agregan en{" "}
                    <Link href={hrefListado("frecuencias")} className="link link-primary">
                      Catálogos › Frecuencias
                    </Link>
                    .
                  </>
                ) : null}
              </p>
            ) : (
              <>
                <Field label="Frecuencia" fieldKey="idFrecuencia">
                  <select
                    className="select w-full"
                    value={form.idFrecuencia}
                    onChange={(e) => campo("idFrecuencia", e.target.value)}
                    disabled={guardando}
                  >
                    <option value="">No se repite</option>
                    {opcionesFrecuencia.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {form.idFrecuencia ? (
                  <div className="space-y-3">
                    <div role="radiogroup" aria-label="Termina" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          className="radio radio-sm"
                          name="fin"
                          checked={form.fin === "fecha"}
                          onChange={() => campo("fin", "fecha")}
                          disabled={guardando}
                        />
                        Termina en una fecha
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          className="radio radio-sm"
                          name="fin"
                          checked={form.fin === "ocurrencias"}
                          onChange={() => campo("fin", "ocurrencias")}
                          disabled={guardando}
                        />
                        Termina tras una cantidad de veces
                      </label>
                    </div>

                    {form.fin === "fecha" ? (
                      <Field label="Se repite hasta el" fieldKey="fechaFin" error={errores.fechaFin}>
                        <input
                          type="date"
                          className={`input w-full${errores.fechaFin ? " input-error" : ""}`}
                          value={form.fechaFin}
                          min={(form.fechaHora || ahora).slice(0, 10)}
                          suppressHydrationWarning
                          onChange={(e) => campo("fechaFin", e.target.value)}
                          disabled={guardando}
                          required
                        />
                      </Field>
                    ) : (
                      <Field label={`Cantidad de veces (1 a ${OCURRENCIAS_MAX})`} fieldKey="nroOcurrencias" error={errores.nroOcurrencias}>
                        <input
                          type="number"
                          className={`input w-full${errores.nroOcurrencias ? " input-error" : ""}`}
                          placeholder={`Cantidad de veces (1 a ${OCURRENCIAS_MAX})`}
                          min={1}
                          max={OCURRENCIAS_MAX}
                          value={form.nroOcurrencias}
                          onChange={(e) => campo("nroOcurrencias", e.target.value)}
                          disabled={guardando}
                          required
                        />
                      </Field>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </fieldset>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => router.back()} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? <span className="loading loading-spinner loading-sm" aria-hidden /> : null}
              {esEdicion ? "Guardar cambios" : "Guardar recordatorio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Idéntico al Field de InstanciaForm.tsx — se duplica acá porque InstanciaForm no lo exporta.
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
