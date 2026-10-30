"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiErrorMessage, ApiError } from "@/lib/api";
import { BackButton } from "@/components/layout/BackButton";
import { validarEstudiante, type EstudianteFormState } from "@/lib/validaciones-estudiante";
import {
  createStudent,
  updateStudent,
  type Student,
  type StudentCreateInput,
  type StudentUpdateInput,
} from "@/lib/students";
import { DatosPersonalesSeccion } from "./formulario/DatosPersonalesSeccion";
import { DireccionSeccion } from "./formulario/DireccionSeccion";
import { TelefonosSeccion } from "./formulario/TelefonosSeccion";
import { SelectorGrupos } from "./formulario/SelectorGrupos";
import { SaludSeccion } from "./formulario/SaludSeccion";

function estadoInicial(estudiante?: Student): EstudianteFormState {
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
    idGrupos: estudiante?.idGrupos ?? [],
    informacionSalud: estudiante?.informacionSalud ?? "",
    sistemaSalud: estudiante?.sistemaSalud ?? "",
    motivoDerivacion: estudiante?.motivoDerivacion ?? "",
  };
}

type StudentFormProps =
  | { mode: "crear" }
  | { mode: "editar"; estudianteId: number; estudiante: Student };

// Alta y edición de estudiante. El estado del formulario vive acá; cada sección (carpeta formulario/) solo lo pinta.
export function StudentForm(props: StudentFormProps) {
  const router = useRouter();
  const esEdicion = props.mode === "editar";

  const [form, setForm] = useState<EstudianteFormState>(() =>
    estadoInicial(esEdicion ? props.estudiante : undefined),
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const errorGeneralRef = useRef<HTMLDivElement>(null);

  // El banner de error general puede quedar fuera de la vista si el usuario
  // ya scrolleó hacia una sección más abajo del form (5 fieldsets).
  useEffect(() => {
    if (errorGeneral) errorGeneralRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [errorGeneral]);

  function campo<K extends keyof EstudianteFormState>(key: K, value: EstudianteFormState[K]) {
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

  function cambiarGrupos(valor: React.SetStateAction<number[]>) {
    setForm((f) => ({ ...f, idGrupos: typeof valor === "function" ? valor(f.idGrupos) : valor }));
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setErrorGeneral("");

    const erroresValidacion = validarEstudiante(form, esEdicion);
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

  const seccion = { form, errores, guardando, onCampo: campo };

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[720px] mx-auto w-full px-4 py-5">
        <BackButton onClick={() => router.back()} label="Cancelar" />

        <h1 className="text-xl font-bold mb-1">{esEdicion ? "Editar estudiante" : "Nuevo estudiante"}</h1>
        {!esEdicion ? (
          <p className="text-sm text-base-content/70 mb-4">
            Al guardar, el estudiante queda pendiente de activación hasta que ponga su contraseña.
          </p>
        ) : null}

        {errorGeneral ? (
          <div ref={errorGeneralRef} role="alert" className="alert alert-error alert-soft text-sm mb-4">
            <span>{errorGeneral}</span>
          </div>
        ) : null}

        {/* noValidate: sin esto, la validación nativa del navegador (required,
            min/max) intercepta el submit ANTES de que corra validarEstudiante() — el
            foco salta al campo inválido pero nunca se ve el mensaje propio
            ni queda enganchado a aria-describedby. Todo pasa por validarEstudiante(). */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <DatosPersonalesSeccion {...seccion} esEdicion={esEdicion} />
          <DireccionSeccion {...seccion} />
          <TelefonosSeccion
            telefonos={form.telefonos}
            errores={errores}
            guardando={guardando}
            onAgregar={agregarTelefono}
            onQuitar={quitarTelefono}
            onCambiar={cambiarTelefono}
          />
          <SelectorGrupos
            idGrupos={form.idGrupos}
            onChange={cambiarGrupos}
            guardando={guardando}
          />
          <SaludSeccion {...seccion} />

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
              {guardando ? <span className="loading loading-spinner loading-sm" aria-hidden /> : null}
              {esEdicion ? "Guardar cambios" : "Guardar estudiante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
