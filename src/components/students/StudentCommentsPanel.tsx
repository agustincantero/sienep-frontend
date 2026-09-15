"use client";

import { useEffect, useId, useRef, useState } from "react";
import { apiErrorMessage } from "@/lib/api";
import {
  createConfidentialComment,
  createNormalComment,
  deleteConfidentialComment,
  deleteNormalComment,
  listConfidentialComments,
  listNormalComments,
  updateConfidentialComment,
  updateNormalComment,
  type StudentComment,
} from "@/lib/comments";
import { formatFechaHora } from "@/lib/format";
import { useSession } from "@/lib/session-context";
import { ConfirmDialog } from "./ConfirmDialog";

// Comentarios normales (ComentarioNormalEstudiante) y observaciones
// confidenciales (ComentarioConfidencialEstudiante) son dos recursos del
// backend, con tablas e IDs propios — un id=5 normal y un id=5 confidencial
// pueden existir a la vez. Acá se muestran mezclados en un único historial
// ordenado por fecha (para no tener que ir comparando fechas entre dos
// listas separadas), y `tipo` es lo que evita que se pisen: sirve de
// discriminante para saber a qué endpoint pegarle en editar/eliminar, y para
// armar una key de React única (`${tipo}-${id}`).
type Tipo = "normal" | "confidencial";
type ComentarioConTipo = StudentComment & { tipo: Tipo };

// @CreationTimestamp/@UpdateTimestamp (Hibernate) capturan el reloj en dos
// llamadas separadas al insertar, así que createdAt/updatedAt casi nunca
// coinciden ni al crear — comparar por igualdad exacta marca "(editado)" en
// TODOS los comentarios. Un margen de un par de segundos absorbe ese jitter
// sin dejar de detectar una edición real (que en la práctica pasa minutos u
// horas después, no milisegundos).
const MARGEN_EDICION_MS = 2000;
function fueEditado(c: StudentComment): boolean {
  return Math.abs(new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) > MARGEN_EDICION_MS;
}

function clave(c: { tipo: Tipo; id: number }): string {
  return `${c.tipo}-${c.id}`;
}

export function StudentCommentsPanel({ idEstudiante }: { idEstudiante: number }) {
  const { permisos } = useSession();
  const puedeVerNormal = permisos.includes("VER_COMENTARIO_NORMAL_ESTUDIANTE");
  const puedeVerConfidencial = permisos.includes("VER_COMENTARIO_CONFIDENCIAL_ESTUDIANTE");
  const puedeVer = puedeVerNormal || puedeVerConfidencial;
  const puedeCrearNormal = permisos.includes("CREAR_COMENTARIO_NORMAL_ESTUDIANTE");
  const puedeCrearConfidencial = permisos.includes("CREAR_COMENTARIO_CONFIDENCIAL_ESTUDIANTE");
  const puedeCrear = puedeCrearNormal || puedeCrearConfidencial;
  const puedeEditarNormal = permisos.includes("EDITAR_COMENTARIO_NORMAL_ESTUDIANTE");
  const puedeEditarConfidencial = permisos.includes("EDITAR_COMENTARIO_CONFIDENCIAL_ESTUDIANTE");
  const puedeEliminarNormal = permisos.includes("ELIMINAR_COMENTARIO_NORMAL_ESTUDIANTE");
  const puedeEliminarConfidencial = permisos.includes("ELIMINAR_COMENTARIO_CONFIDENCIAL_ESTUDIANTE");
  const idNuevo = useId();

  const [comentarios, setComentarios] = useState<ComentarioConTipo[]>([]);
  const [cargando, setCargando] = useState(puedeVer);
  // error: falla al cargar la lista O al publicar/editar/eliminar — se
  // muestra junto al contenido ya cargado, mismo patrón que MedicalReportsPanel.
  const [error, setError] = useState("");
  const [contenidoNuevo, setContenidoNuevo] = useState("");
  const [esConfidencialNuevo, setEsConfidencialNuevo] = useState(false);
  const [errorNuevo, setErrorNuevo] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [editandoClave, setEditandoClave] = useState<string | null>(null);
  const [contenidoEdicion, setContenidoEdicion] = useState("");
  const [errorEdicion, setErrorEdicion] = useState("");
  const [guardandoClave, setGuardandoClave] = useState<string | null>(null);
  const [eliminandoClave, setEliminandoClave] = useState<string | null>(null);
  const [comentarioAEliminar, setComentarioAEliminar] = useState<ComentarioConTipo | null>(null);

  // Mismo motivo que en MedicalReportsPanel: si el usuario navega a otra
  // ficha mientras un pedido sigue en vuelo, la respuesta vieja no debe
  // pisar el estado del estudiante nuevo.
  const idEstudianteRef = useRef(idEstudiante);
  useEffect(() => {
    idEstudianteRef.current = idEstudiante;
  }, [idEstudiante]);

  // Nunca se llama si !puedeVer: el formulario de alta (único otro punto que
  // la invoca) ni siquiera se renderiza en ese caso, ver el return de abajo.
  // No hace setCargando(true) acá (mismo patrón que MedicalReportsPanel): el
  // spinner es solo para la carga inicial, un recargo tras publicar/editar/
  // eliminar actualiza la lista sin taparla de nuevo.
  function cargar() {
    const idAlPedir = idEstudiante;
    const pedidos: Promise<ComentarioConTipo[]>[] = [];
    if (puedeVerNormal) {
      pedidos.push(
        listNormalComments(idAlPedir).then((res) => res.content.map((c) => ({ ...c, tipo: "normal" as const }))),
      );
    }
    if (puedeVerConfidencial) {
      pedidos.push(
        listConfidentialComments(idAlPedir).then((res) =>
          res.content.map((c) => ({ ...c, tipo: "confidencial" as const })),
        ),
      );
    }
    Promise.all(pedidos)
      .then((listas) => {
        if (idEstudianteRef.current !== idAlPedir) return;
        // Más nuevo primero: es lo que arma el "orden" que se pidió, sin
        // depender de que el usuario compare fechas entre dos listas.
        const todos = listas.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setComentarios(todos);
        setError("");
      })
      .catch((err) => {
        if (idEstudianteRef.current !== idAlPedir) return;
        setError(apiErrorMessage(err, "No se pudieron cargar los comentarios."));
      })
      .finally(() => {
        if (idEstudianteRef.current === idAlPedir) setCargando(false);
      });
  }

  useEffect(() => {
    if (puedeVer) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- puedeVer* no cambian durante la vida del componente, solo idEstudiante
  }, [idEstudiante]);

  function iniciarEdicion(c: ComentarioConTipo) {
    setEditandoClave(clave(c));
    setContenidoEdicion(c.contenido);
    setErrorEdicion("");
  }

  function cancelarEdicion() {
    setEditandoClave(null);
    setContenidoEdicion("");
    setErrorEdicion("");
  }

  async function handleComentar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const contenido = contenidoNuevo.trim();
    if (!contenido) {
      setErrorNuevo("El comentario no puede estar vacío.");
      return;
    }
    setErrorNuevo("");
    setError("");
    setPublicando(true);
    try {
      // Con los dos permisos, manda lo que haya elegido en el checkbox. Con
      // uno solo, no hay checkbox (ver el form más abajo) y va directo al
      // único tipo que el usuario puede crear.
      const esConfidencial = puedeCrearNormal && puedeCrearConfidencial ? esConfidencialNuevo : puedeCrearConfidencial;
      if (esConfidencial) await createConfidentialComment(idEstudiante, contenido);
      else await createNormalComment(idEstudiante, contenido);
      setContenidoNuevo("");
      setEsConfidencialNuevo(false);
      cargar();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo publicar el comentario."));
    } finally {
      setPublicando(false);
    }
  }

  async function handleGuardarEdicion(c: ComentarioConTipo) {
    const contenido = contenidoEdicion.trim();
    if (!contenido) {
      setErrorEdicion("El comentario no puede estar vacío.");
      return;
    }
    setErrorEdicion("");
    setGuardandoClave(clave(c));
    try {
      const actualizar = c.tipo === "normal" ? updateNormalComment : updateConfidentialComment;
      await actualizar(c.id, contenido);
      cancelarEdicion();
      cargar();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo guardar el cambio."));
    } finally {
      setGuardandoClave(null);
    }
  }

  async function confirmarEliminar() {
    if (!comentarioAEliminar) return;
    const c = comentarioAEliminar;
    const claveEliminada = clave(c);
    setComentarioAEliminar(null);
    setEliminandoClave(claveEliminada);
    try {
      const eliminar = c.tipo === "normal" ? deleteNormalComment : deleteConfidentialComment;
      await eliminar(c.id);
      setComentarios((prev) => prev.filter((x) => clave(x) !== claveEliminada));
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo eliminar el comentario."));
    } finally {
      setEliminandoClave(null);
    }
  }

  if (!puedeVer) {
    return <p className="text-base-content/60 text-sm">No tenés permiso para ver los comentarios de este estudiante.</p>;
  }

  return (
    <div>
      {error ? (
        <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
          <span>{error}</span>
        </div>
      ) : null}

      {cargando ? (
        <div className="flex justify-center py-6">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : comentarios.length === 0 ? (
        <p className="text-base-content/60 text-sm">Todavía no hay comentarios.</p>
      ) : (
        <ul className="divide-y divide-base-300 mb-3">
          {comentarios.map((c) => {
            const claveActual = clave(c);
            const puedeEditarEste = c.tipo === "normal" ? puedeEditarNormal : puedeEditarConfidencial;
            const puedeEliminarEste = c.tipo === "normal" ? puedeEliminarNormal : puedeEliminarConfidencial;
            return (
              <li key={claveActual} className="py-2">
                {editandoClave === claveActual ? (
                  <div>
                    <textarea
                      className={`textarea textarea-sm w-full${errorEdicion ? " textarea-error" : ""}`}
                      rows={2}
                      value={contenidoEdicion}
                      onChange={(e) => {
                        setContenidoEdicion(e.target.value);
                        if (errorEdicion) setErrorEdicion("");
                      }}
                      disabled={guardandoClave === claveActual}
                      aria-invalid={errorEdicion ? true : undefined}
                      autoFocus
                    />
                    {errorEdicion ? <p className="mt-1 text-xs text-error">{errorEdicion}</p> : null}
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => handleGuardarEdicion(c)}
                        disabled={guardandoClave === claveActual}
                      >
                        {guardandoClave === claveActual ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : null}
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={cancelarEdicion}
                        disabled={guardandoClave === claveActual}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{c.nombreAutor}</span>
                        {c.tipo === "confidencial" ? (
                          <span className="badge badge-warning badge-sm">Confidencial</span>
                        ) : null}
                        <span className="text-xs text-base-content/50">
                          {formatFechaHora(c.createdAt)}
                          {fueEditado(c) ? " (editado)" : ""}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {puedeEditarEste ? (
                          <button
                            type="button"
                            className="btn btn-link btn-xs no-underline"
                            onClick={() => iniciarEdicion(c)}
                            disabled={eliminandoClave === claveActual}
                          >
                            Editar
                          </button>
                        ) : null}
                        {puedeEliminarEste ? (
                          <button
                            type="button"
                            className="btn btn-link btn-xs btn-error no-underline"
                            onClick={() => setComentarioAEliminar(c)}
                            disabled={eliminandoClave === claveActual}
                          >
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap mt-1">{c.contenido}</p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* noValidate: mismo motivo que en StudentForm/MedicalReportsPanel —
          sin esto el required nativo corta el submit antes de correr
          validar() y nunca se ve el mensaje propio. */}
      {puedeCrear ? (
        <form onSubmit={handleComentar} noValidate className="pt-2 border-t border-base-300">
          <label className="floating-label">
            <textarea
              id={idNuevo}
              className={`textarea textarea-sm w-full${errorNuevo ? " textarea-error" : ""}`}
              placeholder="Escribir un comentario"
              rows={2}
              value={contenidoNuevo}
              onChange={(e) => {
                setContenidoNuevo(e.target.value);
                if (errorNuevo) setErrorNuevo("");
              }}
              disabled={publicando}
              aria-invalid={errorNuevo ? true : undefined}
              required
            />
            <span>Escribir un comentario</span>
          </label>
          {errorNuevo ? <p className="mt-1 text-xs text-error">{errorNuevo}</p> : null}
          <div className="flex items-center justify-between mt-1">
            {puedeCrearNormal && puedeCrearConfidencial ? (
              <label className="label cursor-pointer gap-2 justify-start p-0">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={esConfidencialNuevo}
                  onChange={(e) => setEsConfidencialNuevo(e.target.checked)}
                  disabled={publicando}
                />
                <span className="text-sm">Marcar como confidencial</span>
              </label>
            ) : (
              <span />
            )}
            <button type="submit" className="btn btn-primary btn-sm" disabled={publicando}>
              {publicando ? <span className="loading loading-spinner loading-xs" /> : null}
              Comentar
            </button>
          </div>
        </form>
      ) : null}

      <ConfirmDialog
        open={comentarioAEliminar != null}
        title="Eliminar comentario"
        message="¿Eliminar este comentario? Esta acción no se puede deshacer desde la ficha."
        confirmLabel="Eliminar"
        destructive
        onConfirm={confirmarEliminar}
        onCancel={() => setComentarioAEliminar(null)}
      />
    </div>
  );
}
