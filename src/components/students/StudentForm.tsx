"use client";

import { cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import { apiErrorMessage, ApiError } from "@/lib/api";
import { isValidUruguayanCi } from "@/lib/document-validation";
import { listGroups, type Group } from "@/lib/groups";
import {
  createStudent,
  updateStudent,
  type Student,
  type StudentCreateInput,
  type StudentUpdateInput,
} from "@/lib/students";

// Subconjunto corto de países frecuentes para SIENEP — el enum real del
// backend tiene ~195 códigos ISO3, mapearlos todos a nombres no vale la pena acá.
const PAISES = [
  { codigo: "URY", nombre: "Uruguay" },
  { codigo: "ARG", nombre: "Argentina" },
  { codigo: "BRA", nombre: "Brasil" },
  { codigo: "PRY", nombre: "Paraguay" },
  { codigo: "CHL", nombre: "Chile" },
  { codigo: "BOL", nombre: "Bolivia" },
  { codigo: "PER", nombre: "Perú" },
];

// Mismo patrón para nombre/apellido/ciudad/departamento/calle/sistemaSalud —
// EstudianteRequestDTO/UpdateDTO usan exactamente este regex en los seis.
const TEXTO_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 ]+$/;
const DOCUMENTO_REGEX = /^[A-Za-z0-9]+$/;
const TELEFONO_REGEX = /^[0-9]{8,12}$/;
const TEXTO_INVALIDO_MSG = "Solo se permiten letras, números y espacios.";

type FormState = {
  nombre: string;
  apellido: string;
  documento: string;
  paisDocumento: string;
  email: string;
  fechaNacimiento: string;
  ciudad: string;
  departamento: string;
  calle: string;
  nroPuerta: string;
  telefonos: string[];
  idGrupos: number[];
  informacionSalud: string;
  sistemaSalud: string;
  motivoDerivacion: string;
};

function estadoInicial(estudiante?: Student): FormState {
  return {
    nombre: estudiante?.nombre ?? "",
    apellido: estudiante?.apellido ?? "",
    documento: estudiante?.documento ?? "",
    paisDocumento: estudiante?.paisDocumento ?? "URY",
    email: estudiante?.email ?? "",
    fechaNacimiento: estudiante?.fechaNacimiento ?? "",
    ciudad: estudiante?.ciudad ?? "",
    departamento: estudiante?.departamento ?? "",
    calle: estudiante?.calle ?? "",
    nroPuerta: estudiante?.nroPuerta != null ? String(estudiante.nroPuerta) : "",
    telefonos: estudiante?.telefonos && estudiante.telefonos.length > 0 ? estudiante.telefonos : [""],
    idGrupos: [],
    informacionSalud: estudiante?.informacionSalud ?? "",
    sistemaSalud: estudiante?.sistemaSalud ?? "",
    motivoDerivacion: estudiante?.motivoDerivacion ?? "",
  };
}

// Rango de fecha de nacimiento aceptado (18 a 100 años), para el date picker.
const HOY = new Date();
const FECHA_MAX = new Date(HOY.getFullYear() - 18, HOY.getMonth(), HOY.getDate()).toISOString().slice(0, 10);
const FECHA_MIN = new Date(HOY.getFullYear() - 100, HOY.getMonth(), HOY.getDate()).toISOString().slice(0, 10);

// Encabezado de sección del form: sentence case con peso real — el estilo
// tracked-out en mayúscula queda reservado para rótulos secundarios como el
// del Sidebar, no para cinco títulos apilados en la misma pantalla.
function SeccionLegend({ children }: { children: React.ReactNode }) {
  return <legend className="fieldset-legend text-sm font-semibold text-base-content mb-1">{children}</legend>;
}

type StudentFormProps =
  | { mode: "crear" }
  | { mode: "editar"; estudianteId: number; estudiante: Student };

export function StudentForm(props: StudentFormProps) {
  const router = useRouter();
  const esEdicion = props.mode === "editar";

  const [form, setForm] = useState<FormState>(() =>
    estadoInicial(esEdicion ? props.estudiante : undefined),
  );
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const errorGeneralRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listGroups()
      .then(setGrupos)
      .catch(() => setGrupos([]));
  }, []);

  // Los grupos actuales del estudiante llegan como nombres (EstudianteResponseDTO.grupos),
  // hay que resolverlos a id una vez que el catálogo de grupos está cargado.
  useEffect(() => {
    if (!esEdicion || grupos.length === 0) return;
    const nombresActuales = new Set(props.estudiante.grupos);
    const ids = grupos.filter((g) => nombresActuales.has(g.nomGrupo)).map((g) => g.idGrupo);
    setForm((f) => ({ ...f, idGrupos: ids }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr cuando el catálogo de grupos llega
  }, [grupos]);

  // El banner de error general puede quedar fuera de la vista si el usuario
  // ya scrolleó hacia una sección más abajo del form (5 fieldsets).
  useEffect(() => {
    if (errorGeneral) errorGeneralRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [errorGeneral]);

  function campo<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }));
  }

  function agregarTelefono() {
    setForm((f) => ({ ...f, telefonos: [...f.telefonos, ""] }));
  }

  function quitarTelefono(idx: number) {
    setForm((f) => ({ ...f, telefonos: f.telefonos.filter((_, i) => i !== idx) }));
  }

  function cambiarTelefono(idx: number, value: string) {
    setForm((f) => ({ ...f, telefonos: f.telefonos.map((t, i) => (i === idx ? value : t)) }));
    const key = `telefono-${idx}`;
    if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }));
  }

  function alternarGrupo(idGrupo: number) {
    setForm((f) => ({
      ...f,
      idGrupos: f.idGrupos.includes(idGrupo)
        ? f.idGrupos.filter((id) => id !== idGrupo)
        : [...f.idGrupos, idGrupo],
    }));
  }

  // El orden de los checks importa: define qué campo se enfoca cuando falla
  // la validación (el primero insertado acá), así que sigue el mismo orden
  // en que los campos aparecen en la pantalla.
  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.nombre.trim() || !TEXTO_REGEX.test(form.nombre)) {
      e.nombre = "Ingresá un nombre válido (solo letras, números y espacios).";
    }
    if (!form.apellido.trim() || !TEXTO_REGEX.test(form.apellido)) {
      e.apellido = "Ingresá un apellido válido (solo letras, números y espacios).";
    }
    if (!esEdicion) {
      if (!form.documento.trim() || !DOCUMENTO_REGEX.test(form.documento)) {
        e.documento = "El documento debe ser alfanumérico, sin espacios.";
      } else if (form.paisDocumento === "URY" && !isValidUruguayanCi(form.documento)) {
        e.documento = "La cédula uruguaya ingresada no es válida (dígito verificador incorrecto).";
      }
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      e.email = "Ingresá un email válido.";
    }
    if (!form.fechaNacimiento) {
      e.fechaNacimiento = "La fecha de nacimiento es obligatoria.";
    } else if (form.fechaNacimiento > FECHA_MAX) {
      e.fechaNacimiento = "El estudiante debe ser mayor de edad (mínimo 18 años).";
    } else if (form.fechaNacimiento < FECHA_MIN) {
      e.fechaNacimiento = "La fecha de nacimiento no puede ser mayor a 100 años.";
    }
    if (form.calle.trim() && !TEXTO_REGEX.test(form.calle)) {
      e.calle = TEXTO_INVALIDO_MSG;
    }
    if (form.nroPuerta) {
      const n = Number(form.nroPuerta);
      if (!Number.isInteger(n) || n < 1 || n > 9999) {
        e.nroPuerta = "Tiene que ser un número entero entre 1 y 9999.";
      }
    }
    if (form.ciudad.trim() && !TEXTO_REGEX.test(form.ciudad)) {
      e.ciudad = TEXTO_INVALIDO_MSG;
    }
    if (form.departamento.trim() && !TEXTO_REGEX.test(form.departamento)) {
      e.departamento = TEXTO_INVALIDO_MSG;
    }
    form.telefonos.forEach((tel, idx) => {
      if (tel.trim() && !TELEFONO_REGEX.test(tel.trim())) {
        e[`telefono-${idx}`] = "Tiene que tener entre 8 y 12 dígitos numéricos.";
      }
    });
    if (form.sistemaSalud.trim() && !TEXTO_REGEX.test(form.sistemaSalud)) {
      e.sistemaSalud = TEXTO_INVALIDO_MSG;
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
      // .focus() ya hace scroll-into-view en los navegadores modernos.
      document.getElementById(primerCampoError)?.focus();
      return;
    }

    const telefonos = form.telefonos.map((t) => t.trim()).filter(Boolean);
    const datosComunes = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      fechaNacimiento: form.fechaNacimiento,
      ciudad: form.ciudad.trim() || undefined,
      departamento: form.departamento.trim() || undefined,
      calle: form.calle.trim() || undefined,
      nroPuerta: form.nroPuerta ? Number(form.nroPuerta) : undefined,
      informacionSalud: form.informacionSalud.trim() || undefined,
      sistemaSalud: form.sistemaSalud.trim() || undefined,
      motivoDerivacion: form.motivoDerivacion.trim() || undefined,
      telefonos,
      idGrupos: form.idGrupos,
    } satisfies StudentUpdateInput;

    setGuardando(true);
    try {
      if (esEdicion) {
        await updateStudent(props.estudianteId, datosComunes);
        router.push(`/estudiantes/${props.estudianteId}`);
      } else {
        const dto: StudentCreateInput = {
          ...datosComunes,
          documento: form.documento.trim(),
          paisDocumento: form.paisDocumento,
        };
        const creado = await createStudent(dto);
        // advertencia: el alta se guardó bien pero el email con la contraseña
        // temporal no se pudo mandar (ver EstudianteService.crear en el backend).
        // Solo viaja en ESTA respuesta, no en consultas posteriores — hay que
        // pasarlo a la ficha por query param para no perderlo.
        const destino = creado.advertencia
          ? `/estudiantes/${creado.idUsuario}?aviso=${encodeURIComponent(creado.advertencia)}`
          : `/estudiantes/${creado.idUsuario}`;
        router.push(destino);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // EstudianteService.crear() tira dos 409 distintos según el campo
        // duplicado ("...ese documento." / "...ese email.") — se detecta por
        // el texto para marcar el error solo en el campo que corresponde.
        const campo = err.message.toLowerCase().includes("documento") ? "documento" : "email";
        setErrores((e) => ({ ...e, [campo]: err.message }));
      } else {
        setErrorGeneral(apiErrorMessage(err, "No se pudo guardar el estudiante. Probá de nuevo."));
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[720px] mx-auto w-full px-4 py-5">
        <button
          type="button"
          className="btn btn-link btn-sm pl-0 no-underline mb-2 gap-1"
          onClick={() => router.back()}
        >
          <ArrowLeft size={14} aria-hidden />
          Cancelar
        </button>

        <h1 className="text-xl font-bold mb-1">{esEdicion ? "Editar estudiante" : "Nuevo estudiante"}</h1>
        {!esEdicion ? (
          <p className="text-sm text-base-content/60 mb-4">
            Al guardar, el estudiante queda pendiente de activación hasta que ponga su contraseña.
          </p>
        ) : null}

        {errorGeneral ? (
          <div ref={errorGeneralRef} role="alert" className="alert alert-error alert-soft text-sm mb-4">
            <span>{errorGeneral}</span>
          </div>
        ) : null}

        {/* noValidate: sin esto, la validación nativa del navegador (required,
            min/max) intercepta el submit ANTES de que corra validar() — el
            foco salta al campo inválido pero nunca se ve el mensaje propio
            ni queda enganchado a aria-describedby. Todo pasa por validar(). */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <fieldset className="fieldset space-y-3 p-0 border-0">
            <SeccionLegend>Datos personales</SeccionLegend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre" fieldKey="nombre" error={errores.nombre}>
                <input
                  className={`input w-full${errores.nombre ? " input-error" : ""}`}
                  placeholder="Nombre"
                  value={form.nombre}
                  maxLength={30}
                  onChange={(e) => campo("nombre", e.target.value)}
                  disabled={guardando}
                  required
                />
              </Field>
              <Field label="Apellido" fieldKey="apellido" error={errores.apellido}>
                <input
                  className={`input w-full${errores.apellido ? " input-error" : ""}`}
                  placeholder="Apellido"
                  value={form.apellido}
                  maxLength={30}
                  onChange={(e) => campo("apellido", e.target.value)}
                  disabled={guardando}
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Documento" fieldKey="documento" error={errores.documento}>
                <input
                  className={`input w-full${errores.documento ? " input-error" : ""}`}
                  placeholder="Documento"
                  value={form.documento}
                  maxLength={12}
                  onChange={(e) => campo("documento", e.target.value)}
                  disabled={guardando || esEdicion}
                  required
                />
              </Field>
              <Field label="País del documento" fieldKey="paisDocumento">
                <select
                  className="select w-full"
                  value={form.paisDocumento}
                  onChange={(e) => campo("paisDocumento", e.target.value)}
                  disabled={guardando || esEdicion}
                >
                  {PAISES.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha de nacimiento" fieldKey="fechaNacimiento" error={errores.fechaNacimiento}>
                <input
                  type="date"
                  className={`input w-full${errores.fechaNacimiento ? " input-error" : ""}`}
                  value={form.fechaNacimiento}
                  min={FECHA_MIN}
                  max={FECHA_MAX}
                  onChange={(e) => campo("fechaNacimiento", e.target.value)}
                  disabled={guardando}
                  required
                />
              </Field>
            </div>

            <Field label="Email" fieldKey="email" error={errores.email}>
              <input
                type="email"
                className={`input w-full${errores.email ? " input-error" : ""}`}
                placeholder="Email"
                value={form.email}
                onChange={(e) => campo("email", e.target.value)}
                disabled={guardando}
                required
              />
            </Field>
          </fieldset>

          <fieldset className="fieldset space-y-3 p-0 border-0">
            <SeccionLegend>Dirección</SeccionLegend>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <Field label="Calle" fieldKey="calle" error={errores.calle}>
                  <input
                    className={`input w-full${errores.calle ? " input-error" : ""}`}
                    placeholder="Calle"
                    value={form.calle}
                    maxLength={160}
                    onChange={(e) => campo("calle", e.target.value)}
                    disabled={guardando}
                  />
                </Field>
              </div>
              <Field label="Número" fieldKey="nroPuerta" error={errores.nroPuerta}>
                <input
                  type="number"
                  className={`input w-full${errores.nroPuerta ? " input-error" : ""}`}
                  placeholder="Número"
                  value={form.nroPuerta}
                  min={1}
                  max={9999}
                  step={1}
                  onChange={(e) => campo("nroPuerta", e.target.value)}
                  disabled={guardando}
                />
              </Field>
              <Field label="Ciudad" fieldKey="ciudad" error={errores.ciudad}>
                <input
                  className={`input w-full${errores.ciudad ? " input-error" : ""}`}
                  placeholder="Ciudad"
                  value={form.ciudad}
                  maxLength={50}
                  onChange={(e) => campo("ciudad", e.target.value)}
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
                onChange={(e) => campo("departamento", e.target.value)}
                disabled={guardando}
              />
            </Field>
          </fieldset>

          <fieldset className="fieldset space-y-2 p-0 border-0">
            <SeccionLegend>Teléfonos</SeccionLegend>
            {form.telefonos.map((tel, idx) => {
              const key = `telefono-${idx}`;
              const errorId = `${key}-error`;
              const errorTel = errores[key];
              return (
                <div key={idx}>
                  <div className="flex gap-2">
                    <input
                      id={key}
                      className={`input w-full max-w-xs${errorTel ? " input-error" : ""}`}
                      placeholder="099123456"
                      value={tel}
                      maxLength={12}
                      onChange={(e) => cambiarTelefono(idx, e.target.value)}
                      disabled={guardando}
                      aria-invalid={errorTel ? true : undefined}
                      aria-describedby={errorTel ? errorId : undefined}
                    />
                    {form.telefonos.length > 1 ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => quitarTelefono(idx)}
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
              className="btn btn-link btn-sm pl-0 gap-1"
              onClick={agregarTelefono}
              disabled={guardando}
            >
              <Plus size={14} aria-hidden />
              Agregar teléfono
            </button>
          </fieldset>

          {grupos.length > 0 ? (
            <fieldset className="fieldset space-y-2 p-0 border-0">
              <SeccionLegend>Grupos</SeccionLegend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {grupos.map((g) => (
                  <label key={g.idGrupo} className="label cursor-pointer gap-2 justify-start">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={form.idGrupos.includes(g.idGrupo)}
                      onChange={() => alternarGrupo(g.idGrupo)}
                      disabled={guardando}
                    />
                    <span>
                      {g.nomGrupo} — {g.nomCarrera}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <fieldset className="fieldset space-y-3 p-0 border-0">
            <SeccionLegend>Información de salud</SeccionLegend>
            <div role="note" className="alert alert-soft text-sm">
              <span>Esta información solo la ven funcionarios con el permiso VER_BLOQUE_CONFIDENCIAL.</span>
            </div>
            <Field label="Información de salud" fieldKey="informacionSalud">
              <textarea
                className="textarea w-full"
                placeholder="Información de salud"
                rows={2}
                value={form.informacionSalud}
                onChange={(e) => campo("informacionSalud", e.target.value)}
                disabled={guardando}
              />
            </Field>
            <Field label="Motivo de derivación" fieldKey="motivoDerivacion">
              <textarea
                className="textarea w-full"
                placeholder="Motivo de derivación"
                rows={2}
                value={form.motivoDerivacion}
                onChange={(e) => campo("motivoDerivacion", e.target.value)}
                disabled={guardando}
              />
            </Field>
            <Field label="Sistema de salud" fieldKey="sistemaSalud" error={errores.sistemaSalud}>
              <input
                className={`input w-full${errores.sistemaSalud ? " input-error" : ""}`}
                placeholder="Sistema de salud"
                value={form.sistemaSalud}
                maxLength={80}
                onChange={(e) => campo("sistemaSalud", e.target.value)}
                disabled={guardando}
              />
            </Field>
          </fieldset>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => router.back()}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? <span className="loading loading-spinner loading-sm" /> : null}
              {esEdicion ? "Guardar cambios" : "Guardar estudiante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// floating-label de daisyUI 5: el input va PRIMERO (con placeholder propio),
// el <span> con la etiqueta después. `fieldKey` se usa como id del control
// (así handleSubmit puede enfocar el primer campo inválido con
// document.getElementById) y arma el id del <p> de error para
// aria-describedby — un lector de pantalla que tabula a un campo inválido
// necesita esa asociación, no alcanza con el color rojo.
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
