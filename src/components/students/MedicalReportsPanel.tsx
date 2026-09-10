"use client";

import { useEffect, useState } from "react";
import { apiErrorMessage } from "@/lib/api";
import {
  attachMedicalReport,
  deleteMedicalReport,
  listMedicalReports,
  type MedicalReport,
} from "@/lib/medical-reports";
import { useSession } from "@/lib/session-context";

const EXTENSIONES_PERMITIDAS = [".pdf", ".jpg", ".jpeg", ".png"];

// RF09 — adjuntar informes médicos a la ficha del estudiante.
export function MedicalReportsPanel({ idEstudiante }: { idEstudiante: number }) {
  const { permisos } = useSession();
  const puedeAdjuntar = permisos.includes("ADJUNTAR_INFORME");
  const puedeEliminar = permisos.includes("ELIMINAR_INFORME");

  const [informes, setInformes] = useState<MedicalReport[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  function cargar() {
    listMedicalReports(idEstudiante)
      .then((res) => {
        setInformes(res.content);
        setError("");
      })
      .catch((err) => setError(apiErrorMessage(err, "No se pudieron cargar los informes.")))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [idEstudiante]);

  async function handleAdjuntar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    // React invalida ev.currentTarget apenas termina la parte síncrona del
    // handler — hay que guardar la referencia al form ANTES del await.
    const form = ev.currentTarget;
    if (!archivo || !nombre.trim()) return;
    setError("");
    setSubiendo(true);
    try {
      await attachMedicalReport(idEstudiante, nombre.trim(), archivo);
      setNombre("");
      setArchivo(null);
      form.reset();
      cargar();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo adjuntar el informe."));
    } finally {
      setSubiendo(false);
    }
  }

  async function handleEliminar(id: number) {
    setEliminandoId(id);
    try {
      await deleteMedicalReport(id);
      setInformes((prev) => prev.filter((i) => i.idInforme !== id));
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo eliminar el informe."));
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div role="alert" className="alert alert-error alert-soft text-sm">
          <span>{error}</span>
        </div>
      ) : null}

      {cargando ? (
        <div className="flex justify-center py-6">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : informes.length === 0 ? (
        <p className="text-base-content/60 text-sm">Todavía no hay informes adjuntos.</p>
      ) : (
        <ul className="divide-y divide-base-300">
          {informes.map((inf) => (
            <li key={inf.idInforme} className="py-2 flex items-center justify-between gap-3">
              <a
                href={`/api${inf.urlDescarga}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-hover text-sm truncate"
              >
                {inf.nombre}
              </a>
              {puedeEliminar ? (
                <button
                  type="button"
                  className="btn btn-link btn-sm btn-error shrink-0"
                  disabled={eliminandoId === inf.idInforme}
                  onClick={() => handleEliminar(inf.idInforme)}
                >
                  Eliminar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {puedeAdjuntar ? (
        <form onSubmit={handleAdjuntar} className="flex flex-wrap items-end gap-2 pt-2 border-t border-base-300">
          <div className="flex-1 min-w-[180px]">
            <label className="floating-label">
              <input
                className="input input-sm w-full"
                placeholder="Nombre del informe"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={subiendo}
                required
              />
              <span>Nombre del informe</span>
            </label>
          </div>
          <input
            type="file"
            accept={EXTENSIONES_PERMITIDAS.join(",")}
            className="file-input file-input-sm max-w-xs"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            disabled={subiendo}
            required
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={subiendo || !archivo}>
            {subiendo ? <span className="loading loading-spinner loading-xs" /> : null}
            Adjuntar
          </button>
        </form>
      ) : null}
    </div>
  );
}
