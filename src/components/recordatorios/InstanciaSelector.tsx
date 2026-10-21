"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { coincideTexto, todasLasInstanciasActivas } from "@/lib/buscar-estudiante";
import { formatFecha } from "@/lib/format";
import type { InstanciaComun } from "@/lib/instancias";

const MIN_CARACTERES = 2;
const MAX_RESULTADOS = 8;
const ESPERA_MS = 300;

// Lo que se muestra en el input con una instancia elegida: el identificador de negocio (como en el listado y el detalle de instancias) y el título.
export function etiquetaInstancia(i: Pick<InstanciaComun, "codInstancia" | "idNegInstancia" | "titulo">): string {
  return `${i.idNegInstancia ?? `#${i.codInstancia}`} · ${i.titulo}`;
}

type InstanciaSelectorProps = {
  label: string;
  // Id del input: el form lo usa para enfocar el primer campo con error.
  fieldKey: string;
  value: InstanciaComun | null;
  onChange: (instancia: InstanciaComun | null) => void;
  error?: string;
  disabled?: boolean;
};

// Selector de instancia con buscador, mismo comportamiento que EstudianteSelector: se escribe el identificador (INST-…), el título o el estudiante y se elige de las coincidencias, en vez de recorrer un <select> con todas las instancias.
export function InstanciaSelector({ label, fieldKey, value, onChange, error, disabled }: InstanciaSelectorProps) {
  const listId = useId();
  const errorId = `${fieldKey}-error`;
  const inputRef = useRef<HTMLInputElement>(null);

  // Texto tipeado mientras no hay ninguna elegida; con una elegida el input muestra su etiqueta.
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  // Lo que efectivamente se busca: sigue a `texto` con demora, para no filtrar en cada tecla.
  const [consulta, setConsulta] = useState("");
  const [respuesta, setRespuesta] = useState<{ consulta: string; filas: InstanciaComun[]; error: string } | null>(null);

  const textoLimpio = texto.trim();

  useEffect(() => {
    const id = setTimeout(() => setConsulta(textoLimpio), ESPERA_MS);
    return () => clearTimeout(id);
  }, [textoLimpio]);

  useEffect(() => {
    if (consulta.length < MIN_CARACTERES) return;
    let cancelado = false;
    // /instancias no filtra por texto: se baja la lista (memorizada unos segundos) y se busca acá, ya ordenada de la más reciente a la más antigua.
    todasLasInstanciasActivas()
      .then((todas) => {
        const filas = todas
          .filter((i) => coincideTexto(consulta, i.idNegInstancia, i.titulo, i.nombreEstudiante, i.documentoEstudiante, i.nombreCategoria))
          .slice(0, MAX_RESULTADOS);
        if (!cancelado) setRespuesta({ consulta, filas, error: "" });
      })
      .catch((err) => {
        if (!cancelado) setRespuesta({ consulta, filas: [], error: apiErrorMessage(err, "No se pudo buscar instancias.") });
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

  function elegir(i: InstanciaComun) {
    onChange(i);
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
          placeholder="Identificador, título o estudiante"
          value={value ? etiquetaInstancia(value) : texto}
          title={value ? `${etiquetaInstancia(value)} — ${value.nombreEstudiante}` : undefined}
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
          aria-label="Quitar instancia"
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
              <span className="text-sm">Escribí al menos {MIN_CARACTERES} letras del identificador, el título o el estudiante.</span>
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
              <span className="text-sm">No se encontraron instancias.</span>
            </li>
          ) : (
            filas.map((i, idx) => (
              <li key={i.codInstancia} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${idx}`}
                  role="option"
                  aria-selected={idx === indiceActivo}
                  className={`flex flex-col items-start gap-0.5${idx === indiceActivo ? " menu-active" : ""}`}
                  // Sin esto el click le saca el foco al input, y el blur cerraría la lista antes de elegir.
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => elegir(i)}
                >
                  <span className="font-medium">{etiquetaInstancia(i)}</span>
                  <span className="text-xs text-base-content/60">
                    {i.nombreEstudiante} · {formatFecha(i.fechaHora.slice(0, 10))}
                  </span>
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
