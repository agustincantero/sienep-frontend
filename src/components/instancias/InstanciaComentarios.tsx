"use client";

import { useEffect, useState } from "react";
import { Send, ShieldAlert } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { formatFechaHora } from "@/lib/format";
import type { ComentarioInstancia } from "@/lib/instancia-comentarios";
import {
  crearComentarioConfidencial,
  crearComentarioNormal,
  listComentariosConfidenciales,
  listComentariosNormales,
} from "@/lib/instancia-comentarios";
import { useSession } from "@/lib/session-context";

const CONTENIDO_MAX = 1000;

// Compartido entre InstanciaDetalle e IncidenciaDetalle: el backend expone comentarios normales/confidenciales sobre /instancias/{codInstancia}/... para ambos subtipos.
export function InstanciaComentarios({ codInstancia }: { codInstancia: number }) {
  const { permisos } = useSession();
  const puedeVerConfidencial = permisos.includes("VER_COMENTARIO_CONFIDENCIAL_INSTANCIA");

  return (
    <div className="space-y-6 mt-4">
      <ComentarioBox
        titulo="Comentarios"
        codInstancia={codInstancia}
        puedeCrear={permisos.includes("CREAR_COMENTARIO_NORMAL_INSTANCIA")}
        listar={listComentariosNormales}
        crear={crearComentarioNormal}
      />

      {/* Sin el permiso, ni se intenta la llamada: es un endpoint aparte que se bloquea entero, el backend igual la rechazaría con 403. */}
      {puedeVerConfidencial ? (
        <ComentarioBox
          titulo="Comentarios confidenciales"
          codInstancia={codInstancia}
          puedeCrear={permisos.includes("CREAR_COMENTARIO_CONFIDENCIAL_INSTANCIA")}
          listar={listComentariosConfidenciales}
          crear={crearComentarioConfidencial}
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

function ComentarioBox({
  titulo,
  codInstancia,
  puedeCrear,
  listar,
  crear,
  confidencial,
}: {
  titulo: string;
  codInstancia: number;
  puedeCrear: boolean;
  listar: (codInstancia: number) => Promise<{ content: ComentarioInstancia[] }>;
  crear: (codInstancia: number, contenido: string) => Promise<ComentarioInstancia>;
  confidencial?: boolean;
}) {
  const [comentarios, setComentarios] = useState<ComentarioInstancia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [contenido, setContenido] = useState("");
  const [enviando, setEnviando] = useState(false);

  function cargar() {
    listar(codInstancia)
      .then((res) => {
        setComentarios(res.content);
        setError("");
      })
      .catch((err) => setError(apiErrorMessage(err, "No se pudieron cargar los comentarios.")))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [codInstancia]); // eslint-disable-line react-hooks/exhaustive-deps -- listar/crear son estables (imports)

  async function handleComentar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const texto = contenido.trim();
    if (!texto) return;
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
        <p className="text-base-content/60 text-sm mb-3">Todavía no hay comentarios.</p>
      ) : (
        <ul className="divide-y divide-base-300 mb-3">
          {comentarios.map((c, idx) => (
            <li key={idx} className="py-2">
              <div className="flex justify-between gap-3 text-xs text-base-content/60 mb-0.5">
                <span className="font-medium">{c.nombreAutor}</span>
                <span>{formatFechaHora(c.createdAt)}</span>
              </div>
              <p className="text-sm">{c.contenido}</p>
            </li>
          ))}
        </ul>
      )}

      {puedeCrear ? (
        <form onSubmit={handleComentar} noValidate className="flex gap-2 items-start">
          <textarea
            className="textarea w-full"
            placeholder="Escribir un comentario…"
            rows={2}
            maxLength={CONTENIDO_MAX}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            disabled={enviando}
          />
          <button type="submit" className="btn btn-primary btn-sm gap-1" disabled={enviando || !contenido.trim()}>
            {enviando ? <span className="loading loading-spinner loading-xs" /> : <Send size={14} aria-hidden />}
            Comentar
          </button>
        </form>
      ) : null}
    </div>
  );
}
