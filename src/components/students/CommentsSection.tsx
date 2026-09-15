"use client";

import { useEffect, useId, useRef, useState } from "react";
import { apiErrorMessage } from "@/lib/api";
import type { StudentComment } from "@/lib/comments";
import { formatFechaHora } from "@/lib/format";
import type { Page } from "@/lib/students";
import { useSession } from "@/lib/session-context";
import { ConfirmDialog } from "./ConfirmDialog";

// Un solo componente para "Comentarios" (ComentarioNormalEstudiante) y
// "Observaciones confidenciales" (ComentarioConfidencialEstudiante): mismo
// contrato de datos (StudentComment) y misma UI, pero cada uno le pega a un
// recurso del backend distinto y exige sus propios cuatro permisos — por eso
// `api` y los cuatro `permiso*` vienen parametrizados en vez de hardcodeados.
type ComentariosApi = {
  list: (idEstudiante: number) => Promise<Page<StudentComment>>;
  create: (idEstudiante: number, contenido: string) => Promise<StudentComment>;
  update: (id: number, contenido: string) => Promise<StudentComment>;
  delete: (id: number) => Promise<void>;
};

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

type CommentsSectionProps = {
  idEstudiante: number;
  titulo: string;
  placeholder: string;
  permisoVer: string;
  permisoCrear: string;
  permisoEditar: string;
  permisoEliminar: string;
  api: ComentariosApi;
};

export function CommentsSection({
  idEstudiante,
  titulo,
  placeholder,
  permisoVer,
  permisoCrear,
  permisoEditar,
  permisoEliminar,
  api,
}: CommentsSectionProps) {
  const { permisos } = useSession();
  const puedeVer = permisos.includes(permisoVer);
  const puedeCrear = permisos.includes(permisoCrear);
  const puedeEditar = permisos.includes(permisoEditar);
  const puedeEliminar = permisos.includes(permisoEliminar);
  const idNuevo = useId();

  const [comentarios, setComentarios] = useState<StudentComment[]>([]);
  const [cargando, setCargando] = useState(puedeVer);
  // error: falla al cargar la lista O al publicar/editar/eliminar — se
  // muestra junto al contenido ya cargado, mismo patrón que MedicalReportsPanel.
  const [error, setError] = useState("");
  const [contenidoNuevo, setContenidoNuevo] = useState("");
  const [errorNuevo, setErrorNuevo] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [contenidoEdicion, setContenidoEdicion] = useState("");
  const [errorEdicion, setErrorEdicion] = useState("");
  const [guardandoEdicionId, setGuardandoEdicionId] = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [comentarioAEliminar, setComentarioAEliminar] = useState<StudentComment | null>(null);

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
    api
      .list(idAlPedir)
      .then((res) => {
        if (idEstudianteRef.current !== idAlPedir) return;
        setComentarios(res.content);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- puedeVer/api no cambian durante la vida del componente, solo idEstudiante
  }, [idEstudiante]);

  function iniciarEdicion(c: StudentComment) {
    setEditandoId(c.id);
    setContenidoEdicion(c.contenido);
    setErrorEdicion("");
  }

  function cancelarEdicion() {
    setEditandoId(null);
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
      await api.create(idEstudiante, contenido);
      setContenidoNuevo("");
      cargar();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo publicar el comentario."));
    } finally {
      setPublicando(false);
    }
  }

  async function handleGuardarEdicion(id: number) {
    const contenido = contenidoEdicion.trim();
    if (!contenido) {
      setErrorEdicion("El comentario no puede estar vacío.");
      return;
    }
    setErrorEdicion("");
    setGuardandoEdicionId(id);
    try {
      await api.update(id, contenido);
      cancelarEdicion();
      cargar();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo guardar el cambio."));
    } finally {
      setGuardandoEdicionId(null);
    }
  }

  async function confirmarEliminar() {
    if (!comentarioAEliminar) return;
    const id = comentarioAEliminar.id;
    setComentarioAEliminar(null);
    setEliminandoId(id);
    try {
      await api.delete(id);
      setComentarios((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo eliminar el comentario."));
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold mb-2">{titulo}</h2>

      {!puedeVer ? (
        <p className="text-base-content/60 text-sm">No tenés permiso para ver esta información.</p>
      ) : (
        <>
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
              {comentarios.map((c) => (
                <li key={c.id} className="py-2">
                  {editandoId === c.id ? (
                    <div>
                      <textarea
                        className={`textarea textarea-sm w-full${errorEdicion ? " textarea-error" : ""}`}
                        rows={2}
                        value={contenidoEdicion}
                        onChange={(e) => {
                          setContenidoEdicion(e.target.value);
                          if (errorEdicion) setErrorEdicion("");
                        }}
                        disabled={guardandoEdicionId === c.id}
                        aria-invalid={errorEdicion ? true : undefined}
                        autoFocus
                      />
                      {errorEdicion ? <p className="mt-1 text-xs text-error">{errorEdicion}</p> : null}
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          className="btn btn-primary btn-xs"
                          onClick={() => handleGuardarEdicion(c.id)}
                          disabled={guardandoEdicionId === c.id}
                        >
                          {guardandoEdicionId === c.id ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : null}
                          Guardar
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={cancelarEdicion}
                          disabled={guardandoEdicionId === c.id}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">{c.nombreAutor}</span>
                          <span className="text-xs text-base-content/50">
                            {formatFechaHora(c.createdAt)}
                            {fueEditado(c) ? " (editado)" : ""}
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {puedeEditar ? (
                            <button
                              type="button"
                              className="btn btn-link btn-xs no-underline"
                              onClick={() => iniciarEdicion(c)}
                              disabled={eliminandoId === c.id}
                            >
                              Editar
                            </button>
                          ) : null}
                          {puedeEliminar ? (
                            <button
                              type="button"
                              className="btn btn-link btn-xs btn-error no-underline"
                              onClick={() => setComentarioAEliminar(c)}
                              disabled={eliminandoId === c.id}
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
              ))}
            </ul>
          )}

          {/* noValidate: mismo motivo que en StudentForm/MedicalReportsPanel —
              sin esto el required nativo corta el submit antes de correr
              validar() y nunca se ve el mensaje propio. */}
          {puedeCrear ? (
            <form
              onSubmit={handleComentar}
              noValidate
              className="pt-2 border-t border-base-300"
            >
              <label className="floating-label">
                <textarea
                  id={idNuevo}
                  className={`textarea textarea-sm w-full${errorNuevo ? " textarea-error" : ""}`}
                  placeholder={placeholder}
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
                <span>{placeholder}</span>
              </label>
              {errorNuevo ? <p className="mt-1 text-xs text-error">{errorNuevo}</p> : null}
              <div className="flex justify-end mt-1">
                <button type="submit" className="btn btn-primary btn-sm" disabled={publicando}>
                  {publicando ? <span className="loading loading-spinner loading-xs" /> : null}
                  Comentar
                </button>
              </div>
            </form>
          ) : null}
        </>
      )}

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
