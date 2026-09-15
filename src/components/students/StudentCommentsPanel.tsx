"use client";

import { useEffect, useId, useRef, useState } from "react";
import { apiErrorMessage } from "@/lib/api";
import {
  createConfidentialComment,
  createNormalComment,
  listConfidentialComments,
  listNormalComments,
  type StudentComment,
} from "@/lib/comments";
import { formatFechaHora } from "@/lib/format";
import { useSession } from "@/lib/session-context";

// Comentarios normales (ComentarioNormalEstudiante) y observaciones
// confidenciales (ComentarioConfidencialEstudiante) son dos recursos del
// backend, con tablas e IDs propios — un id=5 normal y un id=5 confidencial
// pueden existir a la vez. Acá se muestran mezclados en un único historial
// ordenado por fecha, y `tipo` es lo que evita que se pisen: sirve de
// discriminante para armar una key de React única (`${tipo}-${id}`) y para
// resolver a qué comentario apunta una cita.
type Tipo = "normal" | "confidencial";
type ComentarioConTipo = StudentComment & { tipo: Tipo };

function clave(c: { tipo: Tipo; id: number }): string {
  return `${c.tipo}-${c.id}`;
}

// No hay edición ni borrado (ver decisión más abajo): un comentario, una vez
// publicado, es historia clínica/de seguimiento — se corrige citando, no
// reescribiendo. La única forma de "responder a" o "aclarar" otro comentario
// es citarlo, y el backend no tiene un campo para eso (ComentarioNormal/
// ConfidencialEstudianteRequestDTO solo tienen `contenido` e `idEstudiante`).
// Se resuelve 100% del lado del cliente: la cita viaja codificada como un
// prefijo al principio del propio `contenido`, y se separa de vuelta al
// mostrarlo. Documentado en el doc de hallazgos del Escritorio junto con la
// alternativa de agregar un campo real en el backend.
const CITA_REGEX = /^\[\[cita:(normal|confidencial):(\d+)\]\]\n/;

function parseComentario(contenido: string): { citaTipo: Tipo | null; citaId: number | null; texto: string } {
  const m = CITA_REGEX.exec(contenido);
  if (!m) return { citaTipo: null, citaId: null, texto: contenido };
  return { citaTipo: m[1] as Tipo, citaId: Number(m[2]), texto: contenido.slice(m[0].length) };
}

function previsualizar(c: ComentarioConTipo, largo = 60): string {
  const { texto } = parseComentario(c.contenido);
  return texto.length > largo ? `${texto.slice(0, largo)}…` : texto;
}

function domId(c: { tipo: Tipo; id: number }): string {
  return `comentario-${clave(c)}`;
}

export function StudentCommentsPanel({ idEstudiante }: { idEstudiante: number }) {
  const { permisos } = useSession();
  const puedeVerNormal = permisos.includes("VER_COMENTARIO_NORMAL_ESTUDIANTE");
  const puedeVerConfidencial = permisos.includes("VER_COMENTARIO_CONFIDENCIAL_ESTUDIANTE");
  const puedeVer = puedeVerNormal || puedeVerConfidencial;
  const puedeCrearNormal = permisos.includes("CREAR_COMENTARIO_NORMAL_ESTUDIANTE");
  const puedeCrearConfidencial = permisos.includes("CREAR_COMENTARIO_CONFIDENCIAL_ESTUDIANTE");
  const puedeCrear = puedeCrearNormal || puedeCrearConfidencial;
  const idNuevo = useId();

  const [comentarios, setComentarios] = useState<ComentarioConTipo[]>([]);
  const [cargando, setCargando] = useState(puedeVer);
  // error: falla al cargar la lista O al publicar — se muestra junto al
  // contenido ya cargado, mismo patrón que MedicalReportsPanel.
  const [error, setError] = useState("");
  const [contenidoNuevo, setContenidoNuevo] = useState("");
  const [esConfidencialNuevo, setEsConfidencialNuevo] = useState(false);
  const [citando, setCitando] = useState<ComentarioConTipo | null>(null);
  const [errorNuevo, setErrorNuevo] = useState("");
  const [publicando, setPublicando] = useState(false);
  // Comentario al que se acaba de saltar desde una cita: se resalta un rato
  // para que quede claro cuál es, sin depender del hash de la URL.
  const [resaltado, setResaltado] = useState<string | null>(null);

  // Mismo motivo que en MedicalReportsPanel: si el usuario navega a otra
  // ficha mientras un pedido sigue en vuelo, la respuesta vieja no debe
  // pisar el estado del estudiante nuevo.
  const idEstudianteRef = useRef(idEstudiante);
  useEffect(() => {
    idEstudianteRef.current = idEstudiante;
  }, [idEstudiante]);

  // Nunca se llama si !puedeVer: el formulario de alta (único otro punto que
  // la invoca) ni siquiera se renderiza en ese caso, ver el return de abajo.
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

  // Si el citado es confidencial, el default es marcar la respuesta también
  // como confidencial — citar su contenido (aunque sea parcialmente, en la
  // previsualización) en un comentario público sería filtrar información
  // confidencial. El usuario puede destildarlo a mano si igual quiere que
  // sea público.
  function iniciarCita(c: ComentarioConTipo) {
    setCitando(c);
    if (c.tipo === "confidencial" && puedeCrearNormal && puedeCrearConfidencial) {
      setEsConfidencialNuevo(true);
    }
    document.getElementById(idNuevo)?.focus();
  }

  function irAComentario(c: ComentarioConTipo) {
    const el = document.getElementById(domId(c));
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const claveDestino = clave(c);
    setResaltado(claveDestino);
    setTimeout(() => setResaltado((actual) => (actual === claveDestino ? null : actual)), 1500);
  }

  async function handleComentar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const textoNuevo = contenidoNuevo.trim();
    if (!textoNuevo) {
      setErrorNuevo("El comentario no puede estar vacío.");
      return;
    }
    setErrorNuevo("");
    setError("");
    setPublicando(true);
    const prefijoCita = citando ? `[[cita:${citando.tipo}:${citando.id}]]\n` : "";
    try {
      // Con los dos permisos, manda lo que haya elegido en el checkbox. Con
      // uno solo, no hay checkbox (ver el form más abajo) y va directo al
      // único tipo que el usuario puede crear.
      const esConfidencial = puedeCrearNormal && puedeCrearConfidencial ? esConfidencialNuevo : puedeCrearConfidencial;
      const contenidoFinal = prefijoCita + textoNuevo;
      if (esConfidencial) await createConfidentialComment(idEstudiante, contenidoFinal);
      else await createNormalComment(idEstudiante, contenidoFinal);
      setContenidoNuevo("");
      setEsConfidencialNuevo(false);
      setCitando(null);
      cargar();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo publicar el comentario."));
    } finally {
      setPublicando(false);
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
            const { citaTipo, citaId, texto } = parseComentario(c.contenido);
            const citado =
              citaTipo && citaId != null ? comentarios.find((x) => x.tipo === citaTipo && x.id === citaId) : undefined;
            return (
              <li
                key={claveActual}
                id={domId(c)}
                className={`py-2 transition-colors duration-700 ${resaltado === claveActual ? "bg-warning/20" : ""}`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{c.nombreAutor}</span>
                    {c.tipo === "confidencial" ? <span className="badge badge-warning badge-sm">Confidencial</span> : null}
                    <span className="text-xs text-base-content/50">{formatFechaHora(c.createdAt)}</span>
                  </div>
                  {puedeCrear ? (
                    <button
                      type="button"
                      className="btn btn-link btn-xs no-underline shrink-0"
                      onClick={() => iniciarCita(c)}
                    >
                      Citar
                    </button>
                  ) : null}
                </div>
                {/* citaTipo !== null: este comentario cita a otro. El flag es
                    clickeable y lleva hasta el comentario citado (si sigue
                    visible para este usuario — un comentario confidencial
                    citado no aparece acá para quien no tiene permiso de
                    verlo, aunque sí vea que "cita algo"). */}
                {citaTipo && citaId != null ? (
                  <button
                    type="button"
                    className="mt-1 flex w-full items-start gap-1.5 rounded-field border-l-2 border-primary/50 bg-base-200 px-2 py-1 text-left text-xs text-base-content/70 hover:bg-base-300 disabled:cursor-default disabled:hover:bg-base-200"
                    onClick={() => citado && irAComentario(citado)}
                    disabled={!citado}
                  >
                    <span aria-hidden>↩</span>
                    {citado ? (
                      <span>
                        Responde a <span className="font-semibold">{citado.nombreAutor}</span>: “{previsualizar(citado)}”
                      </span>
                    ) : (
                      <span>Responde a un comentario que no está disponible acá.</span>
                    )}
                  </button>
                ) : null}
                <p className="text-sm whitespace-pre-wrap mt-1">{texto}</p>
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
          {citando ? (
            <div className="mb-1 flex items-start justify-between gap-2 rounded-field bg-base-200 px-2 py-1 text-xs">
              <button
                type="button"
                className="link link-hover text-left"
                onClick={() => citando && irAComentario(citando)}
              >
                Citando a <span className="font-semibold">{citando.nombreAutor}</span>: “{previsualizar(citando)}”
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs shrink-0"
                onClick={() => setCitando(null)}
                aria-label="Quitar cita"
              >
                ✕
              </button>
            </div>
          ) : null}
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
    </div>
  );
}
