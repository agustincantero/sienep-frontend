"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Repeat } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { hrefListado } from "@/lib/catalogos-tabs";
import {
  createFrecuencia,
  DIAS_SEMANA,
  describirRegla,
  TIPOS_FRECUENCIA,
  updateFrecuencia,
  type DiaSemana,
  type Frecuencia,
  type FrecuenciaInput,
  type TipoFrecuencia,
} from "@/lib/frecuencias";
import { CatalogoFormLayout } from "./CatalogoFormLayout";
import { Campo } from "./Campo";

const MAX_DESCRIPCION = 50;
// FrecuenciaRequestDTO: intDias entre 1 y 31.
const DIAS_MIN = 1;
const DIAS_MAX = 31;

type FormState = { descripcion: string; tipo: TipoFrecuencia | ""; diaSemana: DiaSemana | ""; intDias: string };
type Errores = Partial<Record<keyof FormState, string>>;

export function FrecuenciaForm({ frecuencia }: { frecuencia?: Frecuencia }) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    descripcion: frecuencia?.descripcion ?? "",
    tipo: frecuencia?.tipo ?? "",
    diaSemana: frecuencia?.diaSemana ?? "",
    intDias: frecuencia?.intDias != null ? String(frecuencia.intDias) : "",
  });
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  function campo<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }));
  }

  function validar(): Errores {
    const e: Errores = {};
    const descripcion = form.descripcion.trim();
    if (!descripcion) e.descripcion = "La descripción es obligatoria.";
    else if (descripcion.length > MAX_DESCRIPCION) e.descripcion = `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres.`;
    if (!form.tipo) e.tipo = "Elegí cómo se repite.";
    if (form.tipo === "SEMANAL" && !form.diaSemana) e.diaSemana = "Elegí el día de la semana.";
    if (form.tipo === "PERSONALIZADA") {
      const dias = Number(form.intDias);
      if (!form.intDias.trim() || !Number.isInteger(dias) || dias < DIAS_MIN || dias > DIAS_MAX) {
        e.intDias = `Ingresá un número de días entre ${DIAS_MIN} y ${DIAS_MAX}.`;
      }
    }
    return e;
  }

  async function guardar() {
    setErrorGeneral("");
    const e = validar();
    setErrores(e);
    const primero = (Object.keys(e) as (keyof FormState)[]).find((k) => e[k]);
    if (primero) {
      document.getElementById(`frecuencia-${primero}`)?.focus();
      return;
    }

    const tipo = form.tipo as TipoFrecuencia;
    const descripcion = form.descripcion.trim();
    // El backend rechaza (400) los campos que no corresponden al tipo: solo se manda el que usa cada uno.
    const dto: FrecuenciaInput = {
      descripcion,
      tipo,
      diaSemana: tipo === "SEMANAL" ? (form.diaSemana as DiaSemana) : undefined,
      intDias: tipo === "PERSONALIZADA" ? Number(form.intDias) : undefined,
    };
    setGuardando(true);
    try {
      if (frecuencia) {
        await updateFrecuencia(frecuencia.idFrecuencia, dto);
      } else {
        await createFrecuencia(dto);
      }
      router.push(hrefListado("frecuencias", `Frecuencia ${frecuencia ? "actualizada" : "creada"}: ${descripcion}.`));
    } catch (err) {
      setErrorGeneral(apiErrorMessage(err, "No se pudo guardar la frecuencia. Probá de nuevo."));
      setGuardando(false);
    }
  }

  const vistaPrevia =
    form.tipo && (form.tipo !== "SEMANAL" || form.diaSemana) && (form.tipo !== "PERSONALIZADA" || Number(form.intDias) >= DIAS_MIN)
      ? describirRegla({
          tipo: form.tipo,
          diaSemana: form.diaSemana || null,
          intDias: form.intDias ? Number(form.intDias) : null,
        })
      : null;

  return (
    <CatalogoFormLayout
      titulo={frecuencia ? "Editar frecuencia" : "Nueva frecuencia"}
      leyenda={
        <>
          <p>Formas de repetir un recordatorio que se ofrecen al crearlo o editarlo (por ejemplo, &quot;Semanal los lunes&quot; o &quot;Cada 15 días&quot;).</p>
          <p>Cuándo termina la repetición (en una fecha o tras una cantidad de veces) se elige en cada recordatorio.</p>
        </>
      }
      seccion={{ icon: Repeat, titulo: "Datos de la frecuencia" }}
      submitLabel={frecuencia ? "Guardar cambios" : "Crear frecuencia"}
      guardando={guardando}
      errorGeneral={errorGeneral}
      onSubmit={guardar}
    >
      <Campo
        id="frecuencia-descripcion"
        label="Descripción"
        value={form.descripcion}
        onChange={(v) => campo("descripcion", v)}
        error={errores.descripcion}
        ayuda="Es el nombre que se ve al elegirla en un recordatorio."
        maxLength={MAX_DESCRIPCION}
        disabled={guardando}
        required
      />

      <Selector
        id="frecuencia-tipo"
        label="Se repite *"
        value={form.tipo}
        onChange={(v) => campo("tipo", v as TipoFrecuencia | "")}
        error={errores.tipo}
        disabled={guardando}
        vacio="Seleccioná cómo se repite"
        opciones={TIPOS_FRECUENCIA}
      />

      {form.tipo === "SEMANAL" ? (
        <Selector
          id="frecuencia-diaSemana"
          label="Día de la semana *"
          value={form.diaSemana}
          onChange={(v) => campo("diaSemana", v as DiaSemana | "")}
          error={errores.diaSemana}
          disabled={guardando}
          vacio="Seleccioná un día"
          opciones={DIAS_SEMANA}
        />
      ) : null}

      {form.tipo === "PERSONALIZADA" ? (
        <Campo
          id="frecuencia-intDias"
          label={`Cada cuántos días (${DIAS_MIN} a ${DIAS_MAX})`}
          type="number"
          min={DIAS_MIN}
          max={DIAS_MAX}
          value={form.intDias}
          onChange={(v) => campo("intDias", v)}
          error={errores.intDias}
          disabled={guardando}
          required
        />
      ) : null}

      {vistaPrevia ? (
        <p className="text-xs text-base-content/70">
          Se va a repetir: <span className="font-semibold">{vistaPrevia.toLowerCase()}</span>.
        </p>
      ) : null}
    </CatalogoFormLayout>
  );
}

// Select con floating-label, mismo marcado que el de carrera en GrupoForm.
function Selector({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  vacio,
  opciones,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  vacio: string;
  opciones: Record<string, string>;
}) {
  return (
    <div>
      <label className="floating-label">
        <select
          id={id}
          className={`select w-full${error ? " select-error" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          required
        >
          <option value="">{vacio}</option>
          {Object.entries(opciones).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
        <span>{label}</span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
