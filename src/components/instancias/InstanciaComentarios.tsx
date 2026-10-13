"use client";

import { useEffect, useId, useState } from "react";
import { Ban, Pencil, Send, ShieldAlert, Trash2 } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { formatFechaHora } from "@/lib/format";
import type { ComentarioInstancia } from "@/lib/instancia-comentarios";
import {
  crearComentarioConfidencial,
  crearComentarioNormal,
  editarComentarioConfidencial,
  editarComentarioNormal,
  eliminarComentarioConfidencial,
  eliminarComentarioNormal,
  listComentariosConfidenciales,
  listComentariosNormales,
} from "@/lib/instancia-comentarios";
import { useSession } from "@/lib/session-context";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const CONTENIDO_MAX = 1000;
const CONTENIDO_VACIO_MSG = "El comentario no puede estar vacío.";

// Compartido entre InstanciaDetalle e IncidenciaDetalle: el backend expone comentarios normales/confidenciales sobre /instancias/{codInstancia}/... para ambos subtipos.
export function InstanciaComentarios({ codInstancia }: { codInstancia: number }) {
  const { permisos } = useSession();
  const puedeVerNormal = permisos.includes("VER_COMENTARIO_NORMAL_INSTANCIA");
  const puedeVerConfidencial = permisos.includes("VER_COMENTARIO_CONFIDENCIAL_INSTANCIA");
  const puedeEditarNormal = permisos.includes("EDITAR_COMENTARIO_NORMAL_INSTANCIA");
  const puedeEliminarNormal = permisos.includes("ELIMINAR_COMENTARIO_NORMAL_INSTANCIA");
  const puedeEditarConfidencial = permisos.includes("EDITAR_COMENTARIO_CONFIDENCIAL_INSTANCIA");
  const puedeEliminarConfidencial = permisos.includes("ELIMINAR_COMENTARIO_CONFIDENCIAL_INSTANCIA");

  return (
    <div className="space-y-6 mt-4">
      {/* Sin el permiso la sección no se muestra (ni el listado ni el alta) y no se intenta la llamada, que el backend rechazaría con 403. */}
      {puedeVerNormal ? (
        <ComentarioBox
          titulo="Comentarios"
          codInstancia={codInstancia}
          puedeCrear={permisos.includes("CREAR_COMENTARIO_NORMAL_INSTANCIA")}
          listar={listComentariosNormales}
          crear={crearComentarioNormal}
          acciones={
            puedeEditarNormal || puedeEliminarNormal
              ? {
                  idDe: (c) => c.idComentario,
                  editar: puedeEditarNormal ? editarComentarioNormal : undefined,
                  eliminar: puedeEliminarNormal ? eliminarComentarioNormal : undefined,
                }
              : undefined
          }
        />
      ) : null}

      {/* Sin el permiso, ni se intenta la llamada: es un endpoint aparte que se bloquea entero, el backend igual la rechazaría con 403. */}
      {puedeVerConfidencial ? (
        <ComentarioBox
          titulo="Comentarios confidenciales"
          codInstancia={codInstancia}
          puedeCrear={permisos.includes("CREAR_COMENTARIO_CONFIDENCIAL_INSTANCIA")}
          listar={listComentariosConfidenciales}
          crear={crearComentarioConfidencial}
          acciones={
            puedeEditarConfidencial || puedeEliminarConfidencial
              ? {
                  idDe: (c) => c.idComConfidencial,
                  editar: puedeEditarConfidencial ? editarComentarioConfidencial : undefined,
                  eliminar: puedeEliminarConfidencial ? eliminarComentarioConfidencial : undefined,
                }
              : undefined
          }
          confidencial
        />
      ) : (
        <div role="alert" className="alert alert-soft text-sm">
          <ShieldAlert size={16} aria-hidden />
          <span>No tenés permiso para ver los comentarios confidenciales de esta instancia.</span>
        </div>
      )}
    </div>
  );
}

function ComentarioBox<T extends ComentarioInstancia>({
  titulo,
  codInstancia,
  puedeCrear,
  listar,
  crear,
  acciones,
  confidencial,
}: {
  titulo: string;
  codInstancia: number;
  puedeCrear: boolean;
  listar: (codInstancia: number) => Promise<{ content: T[] }>;
  crear: (codInstancia: number, contenido: string) => Promise<T>;
  // Solo se pasa si el usuario puede editar o eliminar, y cada acción solo si tiene su permiso: sin esto, los comentarios se muestran sin "Editar" ni "Eliminar".
  acciones?: {
    idDe: (comentario: T) => number;
    editar?: (codInstancia: number, idComentario: number, contenido: string) => Promise<T>;
    eliminar?: (codInstancia: number, idComentario: number) => Promise<void>;
  };
  confidencial?: boolean;
}) {
  const [comentarios, setComentarios] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  // true si la última carga falló: no se sabe si hay comentarios, así que no se afirma que no los hay.
  const [cargaFallida, setCargaFallida] = useState(false);
  const [contenido, setContenido] = useState("");
  const [enviando, setEnviando] = useState(false);
  // Mensajes de validación de cada textarea (alta y edición). Los botones no se deshabilitan por contenido
  // vacío: se deja intentar y se avisa por qué no se guardó.
  const [errorContenido, setErrorContenido] = useState("");
  const [errorEdicion, setErrorEdicion] = useState("");
  // Hay un ComentarioBox por tipo de comentario en la misma pantalla: los ids no pueden ser fijos.
  const idBase = useId();
  const idErrorContenido = `${idBase}-contenido-error`;
  const idErrorEdicion = `${idBase}-edicion-error`;
  // Comentario en edición (uno a la vez) y su texto en curso.
  const [idEnEdicion, setIdEnEdicion] = useState<number | null>(null);
  const [contenidoEditado, setContenidoEditado] = useState("");
  const [guardando, setGuardando] = useState(false);
  // Comentario pendiente de confirmar su eliminación, y el que se está eliminando.
  const [idAEliminar, setIdAEliminar] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);

  function cargar() {
    listar(codInstancia)
      .then((res) => {
        setComentarios(res.content);
        setCargaFallida(false);
        setError("");
      })
      .catch((err) => {
        setCargaFallida(true);
        setError(apiErrorMessage(err, "No se pudieron cargar los comentarios."));
      })
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [codInstancia]); // eslint-disable-line react-hooks/exhaustive-deps -- listar/crear son estables (imports)

  async function handleComentar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const texto = contenido.trim();
    if (!texto) {
      setErrorContenido(CONTENIDO_VACIO_MSG);
      return;
    }
    setEnviando(true);
    setError("");
    try {
      await crear(codInstancia, texto);
      setContenido("");
      cargar();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo agregar el comentario."));
    } finally {
      setEnviando(false);
    }
  }

  function iniciarEdicion(id: number, contenidoActual: string) {
    setIdEnEdicion(id);
    setContenidoEditado(contenidoActual);
    setErrorEdicion("");
    setError("");
  }

  async function handleGuardarEdicion(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const texto = contenidoEditado.trim();
    if (!acciones?.editar || idEnEdicion == null) return;
    if (!texto) {
      setErrorEdicion(CONTENIDO_VACIO_MSG);
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await acciones.editar(codInstancia, idEnEdicion, texto);
      setIdEnEdicion(null);
      cargar();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo editar el comentario."));
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    if (!acciones?.eliminar || idAEliminar == null) return;
    const id = idAEliminar;
    setIdAEliminar(null);
    setEliminando(true);
    setError("");
    try {
      await acciones.eliminar(codInstancia, id);
      cargar();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo eliminar el comentario."));
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div>
      <h6 className="text-sm font-semibold mb-2">{titulo}</h6>
      {confidencial ? (
        <div role="note" className="alert alert-soft text-sm mb-3">
          <span>Bloque confidencial — visible solo para quienes tienen permiso de verlo.</span>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
          <span>{error}</span>
        </div>
      ) : null}

      {cargando ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner loading-sm" />
        </div>
      ) : comentarios.length === 0 ? (
        cargaFallida ? null : (
          <p className="text-base-content/60 text-sm mb-3">Todavía no hay comentarios.</p>
        )
      ) : (
        <ul className="divide-y divide-base-300 mb-3">
          {comentarios.map((c, idx) => {
            const id = acciones?.idDe(c);
            // Eliminado: queda la marca (autor, fecha y cuándo se eliminó) sin el texto ni acciones, para que
            // quien lee el seguimiento sepa que ahí hubo un comentario.
            if (c.estado === "ELIMINADO") {
              return (
                <li key={id ?? idx} className="py-2">
                  <div className="flex justify-between gap-3 text-xs text-base-content/60 mb-0.5">
                    <span className="font-medium">{c.nombreAutor}</span>
                    <span>{formatFechaHora(c.createdAt)}</span>
                  </div>
                  <p className="text-sm italic text-base-content/60 flex items-center gap-1">
                    <Ban size={13} aria-hidden />
                    Comentario eliminado el {formatFechaHora(c.updatedAt)}
                  </p>
                </li>
              );
            }
            const contenidoActual = c.contenido ?? "";
            return (
              <li key={id ?? idx} className="py-2">
                <div className="flex justify-between gap-3 text-xs text-base-content/60 mb-0.5">
                  <span className="font-medium">{c.nombreAutor}</span>
                  <span>
                    {formatFechaHora(c.createdAt)}
                    {c.editado ? ` · editado el ${formatFechaHora(c.updatedAt)}` : null}
                  </span>
                </div>
                {id != null && id === idEnEdicion ? (
                  <form onSubmit={handleGuardarEdicion} noValidate className="space-y-2">
                    <textarea
                      className={`textarea w-full${errorEdicion ? " textarea-error" : ""}`}
                      aria-label="Editar comentario"
                      rows={2}
                      maxLength={CONTENIDO_MAX}
                      value={contenidoEditado}
                      onChange={(e) => {
                        setContenidoEditado(e.target.value);
                        if (errorEdicion) setErrorEdicion("");
                      }}
                      disabled={guardando}
                      aria-invalid={errorEdicion ? true : undefined}
                      aria-describedby={errorEdicion ? idErrorEdicion : undefined}
                      autoFocus
                    />
                    {errorEdicion ? (
                      <p id={idErrorEdicion} className="text-xs text-error">
                        {errorEdicion}
                      </p>
                    ) : null}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => setIdEnEdicion(null)}
                        disabled={guardando}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-xs gap-1"
                        disabled={guardando || contenidoEditado.trim() === contenidoActual}
                      >
                        {guardando ? <span className="loading loading-spinner loading-xs" /> : null}
                        Guardar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm min-w-0">{contenidoActual}</p>
                    {id != null ? (
                      <div className="inline-flex gap-1 shrink-0">
                        {acciones?.editar ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs gap-1"
                            onClick={() => iniciarEdicion(id, contenidoActual)}
                            disabled={guardando || eliminando}
                          >
                            <Pencil size={13} aria-hidden />
                            Editar
                          </button>
                        ) : null}
                        {acciones?.eliminar ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs gap-1 text-error"
                            onClick={() => setIdAEliminar(id)}
                            disabled={guardando || eliminando}
                          >
                            <Trash2 size={13} aria-hidden />
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {puedeCrear ? (
        <form onSubmit={handleComentar} noValidate className="flex gap-2 items-start">
          <div className="grow">
            <textarea
              className={`textarea w-full${errorContenido ? " textarea-error" : ""}`}
              placeholder="Escribir un comentario…"
              rows={2}
              maxLength={CONTENIDO_MAX}
              value={contenido}
              onChange={(e) => {
                setContenido(e.target.value);
                if (errorContenido) setErrorContenido("");
              }}
              disabled={enviando}
              aria-invalid={errorContenido ? true : undefined}
              aria-describedby={errorContenido ? idErrorContenido : undefined}
            />
            {errorContenido ? (
              <p id={idErrorContenido} className="mt-1 text-xs text-error">
                {errorContenido}
              </p>
            ) : null}
          </div>
          <button type="submit" className="btn btn-primary btn-sm gap-1" disabled={enviando}>
            {enviando ? <span className="loading loading-spinner loading-xs" /> : <Send size={14} aria-hidden />}
            Comentar
          </button>
        </form>
      ) : null}

      {acciones?.eliminar ? (
        <ConfirmDialog
          open={idAEliminar != null}
          title="Eliminar comentario"
          message="¿Eliminar este comentario? Su texto deja de verse, pero en el seguimiento queda la marca de que fue eliminado."
          confirmLabel="Eliminar"
          destructive
          onConfirm={confirmarEliminar}
          onCancel={() => setIdAEliminar(null)}
        />
      ) : null}
    </div>
  );
}
