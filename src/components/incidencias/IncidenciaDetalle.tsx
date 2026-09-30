"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { formatFechaHora } from "@/lib/format";
import { deactivateIncidencia, getIncidencia, reactivateIncidencia, type Incidencia } from "@/lib/incidencias";
import { useSession } from "@/lib/session-context";
import { ConfirmDialog } from "@/components/instancias/ConfirmDialog";
import { EstadoBadge } from "@/components/instancias/EstadoBadge";
import { InstanciaComentarios } from "@/components/instancias/InstanciaComentarios";
import { InvolucradosPanel } from "./InvolucradosPanel";

// Mismo esqueleto que InstanciaDetalle (sin tabs), más lugar e Involucrados.
// Los comentarios se reusan de components/instancias/ tal cual — ver esa
// carpeta para el porqué del componente compartido.
export function IncidenciaDetalle({ codInstancia }: { codInstancia: number }) {
  const { permisos } = useSession();
  const puedeEditar = permisos.includes("EDITAR_INCIDENCIA");
  const puedeDesactivar = permisos.includes("DESACTIVAR_INCIDENCIA");
  const puedeReactivar = permisos.includes("REACTIVAR_INCIDENCIA");

  const [incidencia, setIncidencia] = useState<Incidencia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [error, setError] = useState("");
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    getIncidencia(codInstancia)
      .then((i) => {
        if (cancelado) return;
        setIncidencia(i);
        setErrorCarga("");
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorCarga(apiErrorMessage(err, "No se pudo cargar la incidencia."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [codInstancia]);

  async function confirmarDesactivar() {
    setConfirmandoBaja(false);
    setProcesando(true);
    setError("");
    try {
      await deactivateIncidencia(codInstancia);
      setIncidencia((prev) => (prev ? { ...prev, estado: "INACTIVO" } : prev));
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo desactivar la incidencia."));
    } finally {
      setProcesando(false);
    }
  }

  async function handleReactivar() {
    setProcesando(true);
    setError("");
    try {
      await reactivateIncidencia(codInstancia);
      setIncidencia((prev) => (prev ? { ...prev, estado: "ACTIVO" } : prev));
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo reactivar la incidencia."));
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return (
      <div className="grow overflow-auto flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (errorCarga || !incidencia) {
    return (
      <div className="grow overflow-auto">
        <div className="max-w-[700px] mx-auto w-full px-4 py-5">
          <Link href="/incidencias" className="btn btn-link no-underline mb-3 gap-1">
            <ArrowLeft size={16} aria-hidden />
            Volver a incidencias
          </Link>
          <div role="alert" className="alert alert-error alert-soft text-sm">
            <span>{errorCarga || "Incidencia no encontrada."}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[700px] mx-auto w-full px-4 py-5">
        <Link href="/incidencias" className="btn btn-link no-underline mb-3 gap-1">
          <ArrowLeft size={16} aria-hidden />
          Volver a incidencias
        </Link>

        {error ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-4">
            <span>{error}</span>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold mb-1">{incidencia.titulo}</h1>
            <EstadoBadge estado={incidencia.estado} />
          </div>
          <div className="flex gap-2">
            {puedeEditar ? (
              <Link href={`/incidencias/${codInstancia}/editar`} className="btn btn-outline btn-sm">
                Editar
              </Link>
            ) : null}
            {incidencia.estado === "ACTIVO" && puedeDesactivar ? (
              <button
                type="button"
                className="btn btn-outline btn-error btn-sm"
                disabled={procesando}
                onClick={() => setConfirmandoBaja(true)}
              >
                Desactivar
              </button>
            ) : null}
            {incidencia.estado === "INACTIVO" && puedeReactivar ? (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={procesando}
                onClick={handleReactivar}
              >
                Activar
              </button>
            ) : null}
          </div>
        </div>

        <Dl label="Identificador" value={incidencia.idNegInstancia} />
        <Dl label="Estudiante" value={incidencia.nombreEstudiante} />
        <Dl label="Lugar" value={incidencia.lugar} />
        <Dl label="Fecha y hora" value={formatFechaHora(incidencia.fechaHora)} />
        <Dl label="Canal" value={incidencia.canal} />
        <Dl label="Responsable" value={incidencia.nombreFuncionario} />

        <InvolucradosPanel codInstancia={codInstancia} />
        <InstanciaComentarios codInstancia={codInstancia} />
      </div>

      <ConfirmDialog
        open={confirmandoBaja}
        title="Desactivar incidencia"
        message={`¿Desactivar "${incidencia.titulo}"? Va a dejar de aparecer en las búsquedas activas, pero se conserva.`}
        confirmLabel="Desactivar"
        destructive
        onConfirm={confirmarDesactivar}
        onCancel={() => setConfirmandoBaja(false)}
      />
    </div>
  );
}

function Dl({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-base-300 flex flex-wrap gap-x-4 select-none cursor-default">
      <span className="text-base-content/60 w-40 shrink-0">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
