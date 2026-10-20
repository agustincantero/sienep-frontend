"use client";

import { useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "@/lib/api";
import { listCategoriasInstancia, type CategoriaInstancia } from "@/lib/categorias-instancia";
import type { InstanciaComun } from "@/lib/instancias";
import { crearInstanciaDesdeRecordatorio, type Recordatorio } from "@/lib/recordatorios";

const TITULO_MAX = 150;
const CANAL_MAX = 50;

type Props = {
  open: boolean;
  recordatorio: Recordatorio;
  onCreada: (instancia: InstanciaComun) => void;
  onCancel: () => void;
};

// RF27: al cumplir un recordatorio se registra la instancia de seguimiento. El backend la crea con el mismo estudiante que la instancia de origen y con la fecha de ahora, así que acá solo se piden la categoría (de instancia), y opcionalmente título y canal. Mismo <dialog> de daisyUI que ConfirmDialog, con un form adentro.
export function InstanciaDesdeRecordatorioDialog({ open, recordatorio, onCreada, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [categorias, setCategorias] = useState<CategoriaInstancia[]>([]);
  const [idCategoria, setIdCategoria] = useState("");
  const [titulo, setTitulo] = useState("");
  const [canal, setCanal] = useState("");
  const [errorCategoria, setErrorCategoria] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const tituloPorDefecto = `Seguimiento: ${recordatorio.titulo}`;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // La categoría requiere VER_CATEGORIAS_INSTANCIA; si falta, el combo queda vacío (mismo caso que InstanciaForm).
    listCategoriasInstancia()
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, [open]);

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError("");
    if (!idCategoria) {
      setErrorCategoria("Elegí una categoría.");
      document.getElementById("seguimiento-categoria")?.focus();
      return;
    }
    setGuardando(true);
    try {
      const creada = await crearInstanciaDesdeRecordatorio(recordatorio.codRecordatorio, {
        idCategoria: Number(idCategoria),
        titulo: titulo.trim() || undefined,
        canal: canal.trim() || undefined,
      });
      onCreada(creada);
    } catch (err) {
      // 409 si este recordatorio ya generó su instancia: el mensaje del backend lo dice.
      setError(apiErrorMessage(err, "No se pudo crear la instancia de seguimiento."));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <dialog ref={ref} className="modal" onClose={onCancel}>
      <div className="modal-box">
        <h3 className="text-lg font-semibold">Registrar instancia de seguimiento</h3>
        <p className="py-3 text-sm text-base-content/70 wrap-anywhere">
          Se crea una instancia con fecha de ahora para el mismo estudiante de &quot;{recordatorio.tituloInstancia}&quot;, y el recordatorio queda como cumplido. Cada recordatorio genera una sola.
        </p>

        {error ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
            <span>{error}</span>
          </div>
        ) : null}

        <form id="form-seguimiento" onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <label className="floating-label">
              <select
                id="seguimiento-categoria"
                className={`select w-full${errorCategoria ? " select-error" : ""}`}
                value={idCategoria}
                onChange={(e) => {
                  setIdCategoria(e.target.value);
                  setErrorCategoria("");
                }}
                disabled={guardando}
                aria-invalid={errorCategoria ? true : undefined}
                aria-describedby={errorCategoria ? "seguimiento-categoria-error" : undefined}
                required
              >
                <option value="">Seleccioná una categoría</option>
                {categorias.map((c) => (
                  <option key={c.idCategoria} value={c.idCategoria}>
                    {c.nomCategoria}
                  </option>
                ))}
              </select>
              <span>Categoría de la instancia</span>
            </label>
            {errorCategoria ? (
              <p id="seguimiento-categoria-error" className="mt-1 text-xs text-error">
                {errorCategoria}
              </p>
            ) : null}
          </div>
          <label className="floating-label">
            <input
              className="input w-full"
              placeholder={tituloPorDefecto}
              value={titulo}
              maxLength={TITULO_MAX}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={guardando}
            />
            <span>Título (opcional)</span>
          </label>
          <label className="floating-label">
            <input
              className="input w-full"
              placeholder="Presencial, telefónico, videollamada…"
              value={canal}
              maxLength={CANAL_MAX}
              onChange={(e) => setCanal(e.target.value)}
              disabled={guardando}
            />
            <span>Canal (opcional)</span>
          </label>
        </form>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onCancel} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-seguimiento" className="btn btn-primary" disabled={guardando}>
            {guardando ? <span className="loading loading-spinner loading-sm" /> : null}
            Crear instancia
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>Cerrar</button>
      </form>
    </dialog>
  );
}
