"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { listStudents, type StudentSummary } from "@/lib/students";

export type EstudianteElegido = { id: number; nombre: string; documento?: string };

const MIN_CARACTERES = 2;
const MAX_RESULTADOS = 8;
const ESPERA_MS = 300;

function etiqueta(e: EstudianteElegido) {
  return e.documento ? `${e.nombre} · ${e.documento}` : e.nombre;
}

type EstudianteSelectorProps = {
  label: string;
  // Id del input: el form lo usa para enfocar el primer campo con error.
  fieldKey: string;
  value: EstudianteElegido | null;
  onChange: (estudiante: EstudianteElegido | null) => void;
  error?: string;
  disabled?: boolean;
};

// Selector de estudiante con buscador: se escribe nombre, apellido o documento, se consulta al backend (mismo ?texto= que /estudiantes, que requiere BUSCAR_ESTUDIANTE) y se elige de la lista de coincidencias. Reemplaza al <select> que cargaba hasta 1000 estudiantes de una vez.
export function EstudianteSelector({ label, fieldKey, value, onChange, error, disabled }: EstudianteSelectorProps) {
  const listId = useId();
  const errorId = `${fieldKey}-error`;
  const inputRef = useRef<HTMLInputElement>(null);

  // Texto tipeado mientras no hay nadie elegido; con alguien elegido el input muestra su etiqueta.
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  // Lo que efectivamente se busca: sigue a `texto` con demora, para no pedir al backend en cada tecla.
  const [consulta, setConsulta] = useState("");
  const [respuesta, setRespuesta] = useState<{ consulta: string; filas: StudentSummary[]; error: string } | null>(null);

  const textoLimpio = texto.trim();

  useEffect(() => {
    const id = setTimeout(() => setConsulta(textoLimpio), ESPERA_MS);
    return () => clearTimeout(id);
  }, [textoLimpio]);

  useEffect(() => {
    if (consulta.length < MIN_CARACTERES) return;
    let cancelado = false;
    listStudents({ texto: consulta, size: MAX_RESULTADOS })
      .then((res) => {
        if (!cancelado) setRespuesta({ consulta, filas: res.content, error: "" });
      })
      .catch((err) => {
        if (!cancelado) setRespuesta({ consulta, filas: [], error: apiErrorMessage(err, "No se pudo buscar estudiantes.") });
      });
    return () => {
      cancelado = true;
    };
  }, [consulta]);

  const hayConsulta = textoLimpio.length >= MIN_CARACTERES;
  const respuestaVigente = respuesta && respuesta.consulta === consulta && consulta === textoLimpio ? respuesta : null;
  const buscando = hayConsulta && !respuestaVigente;
  const filas = respuestaVigente?.filas ?? [];
  const visible = abierto && !disabled && !value;
  const indiceActivo = Math.min(activo, filas.length - 1);

  function elegir(s: StudentSummary) {
    onChange({ id: s.idUsuario, nombre: `${s.nombre} ${s.apellido}`, documento: s.documento });
    setTexto("");
    setActivo(-1);
    setAbierto(false);
  }

  function limpiar() {
    onChange(null);
    setTexto("");
    setActivo(-1);
    setAbierto(true);
    inputRef.current?.focus();
  }

  function handleKeyDown(ev: React.KeyboardEvent<HTMLInputElement>) {
    if (ev.key === "Escape") {
      setAbierto(false);
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setAbierto(true);
      setActivo(Math.min(indiceActivo + 1, filas.length - 1));
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setActivo(Math.max(indiceActivo - 1, 0));
    } else if (ev.key === "Enter" && visible && filas.length > 0) {
      // Con la lista abierta, Enter elige (no envía el formulario).
      ev.preventDefault();
      elegir(filas[indiceActivo >= 0 ? indiceActivo : 0]);
    }
  }

  return (
    <div
      className="relative"
      onBlur={(ev) => {
        if (!ev.currentTarget.contains(ev.relatedTarget as Node | null)) setAbierto(false);
      }}
    >
      <label className="floating-label">
        <input
          ref={inputRef}
          id={fieldKey}
          role="combobox"
          aria-expanded={visible}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={visible && indiceActivo >= 0 ? `${listId}-${indiceActivo}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          className={`input w-full pr-8${error ? " input-error" : ""}`}
          placeholder="Nombre, apellido o documento"
          value={value ? etiqueta(value) : texto}
          readOnly={value !== null}
          disabled={disabled}
          onFocus={() => setAbierto(true)}
          onChange={(ev) => {
            setTexto(ev.target.value);
            setActivo(-1);
            setAbierto(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <span>{label}</span>
      </label>

      {!disabled && (value || texto) ? (
        <button
          type="button"
          className="btn btn-ghost btn-circle btn-xs absolute right-1 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
          onClick={limpiar}
          aria-label="Quitar estudiante"
        >
          <X size={13} aria-hidden />
        </button>
      ) : null}

      {visible ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={`Resultados de ${label}`}
          className="menu bg-base-100 rounded-box border border-base-300 shadow-md absolute left-0 right-0 top-full z-20 mt-1 p-1 max-h-72 overflow-auto flex-nowrap"
        >
          {!hayConsulta ? (
            <li className="menu-disabled" role="presentation">
              <span className="text-sm">Escribí al menos {MIN_CARACTERES} letras del nombre, apellido o documento.</span>
            </li>
          ) : buscando ? (
            <li className="menu-disabled" role="presentation">
              <span className="text-sm">
                <span className="loading loading-spinner loading-xs" aria-hidden />
                Buscando…
              </span>
            </li>
          ) : respuestaVigente?.error ? (
            <li className="menu-disabled" role="presentation">
              <span className="text-sm text-error">{respuestaVigente.error}</span>
            </li>
          ) : filas.length === 0 ? (
            <li className="menu-disabled" role="presentation">
              <span className="text-sm">No se encontraron estudiantes.</span>
            </li>
          ) : (
            filas.map((s, idx) => (
              <li key={s.idUsuario} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${idx}`}
                  role="option"
                  aria-selected={idx === indiceActivo}
                  className={`flex items-baseline justify-between gap-3${idx === indiceActivo ? " menu-active" : ""}`}
                  // Sin esto el click le saca el foco al input, y el blur cerraría la lista antes de elegir.
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => elegir(s)}
                >
                  <span className="font-medium">
                    {s.nombre} {s.apellido}
                  </span>
                  <span className="text-xs text-base-content/60">{s.documento}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {error ? (
        <p id={errorId} className="mt-1 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
