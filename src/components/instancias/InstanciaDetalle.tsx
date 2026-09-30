"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { formatFechaHora } from "@/lib/format";
import { deactivateInstancia, getInstancia, reactivateInstancia, type InstanciaComun } from "@/lib/instancias";
import { useSession } from "@/lib/session-context";
import { ConfirmDialog } from "./ConfirmDialog";
import { EstadoBadge } from "./EstadoBadge";
import { InstanciaComentarios } from "./InstanciaComentarios";

// Sin tabs, a diferencia de la ficha de Estudiante (StudentProfile): acá es
// un único panel de datos + comentarios, siguiendo el mock (InstanciaDetalle).
export function InstanciaDetalle({ codInstancia }: { codInstancia: number }) {
  const { permisos } = useSession();
  const puedeEditar = permisos.includes("EDITAR_INSTANCIA");
  const puedeDesactivar = permisos.includes("DESACTIVAR_INSTANCIA");
  const puedeReactivar = permisos.includes("REACTIVAR_INSTANCIA");

  const [instancia, setInstancia] = useState<InstanciaComun | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [error, setError] = useState("");
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    getInstancia(codInstancia)
      .then((i) => {
        if (cancelado) return;
        setInstancia(i);
        setErrorCarga("");
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorCarga(apiErrorMessage(err, "No se pudo cargar la instancia."));
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
      await deactivateInstancia(codInstancia);
      setInstancia((prev) => (prev ? { ...prev, estado: "INACTIVO" } : prev));
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo desactivar la instancia."));
    } finally {
      setProcesando(false);
    }
  }

  async function handleReactivar() {
    setProcesando(true);
    setError("");
    try {
      await reactivateInstancia(codInstancia);
      setInstancia((prev) => (prev ? { ...prev, estado: "ACTIVO" } : prev));
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo reactivar la instancia."));
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

  if (errorCarga || !instancia) {
    return (
      <div className="grow overflow-auto">
        <div className="max-w-[700px] mx-auto w-full px-4 py-5">
          <Link href="/instancias" className="btn btn-link no-underline mb-3 gap-1">
            <ArrowLeft size={16} aria-hidden />
            Volver a instancias
          </Link>
          <div role="alert" className="alert alert-error alert-soft text-sm">
            <span>{errorCarga || "Instancia no encontrada."}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[700px] mx-auto w-full px-4 py-5">
        <Link href="/instancias" className="btn btn-link no-underline mb-3 gap-1">
          <ArrowLeft size={16} aria-hidden />
          Volver a instancias
        </Link>

        {error ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-4">
            <span>{error}</span>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold mb-1">{instancia.titulo}</h1>
            <EstadoBadge estado={instancia.estado} />
          </div>
          <div className="flex gap-2">
            {puedeEditar ? (
              <Link href={`/instancias/${codInstancia}/editar`} className="btn btn-outline btn-sm">
                Editar
              </Link>
            ) : null}
            {instancia.estado === "ACTIVO" && puedeDesactivar ? (
              <button
                type="button"
                className="btn btn-outline btn-error btn-sm"
                disabled={procesando}
                onClick={() => setConfirmandoBaja(true)}
              >
                Desactivar
              </button>
            ) : null}
            {instancia.estado === "INACTIVO" && puedeReactivar ? (
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

        <Dl label="Identificador" value={instancia.idNegInstancia} />
        <Dl label="Estudiante" value={instancia.nombreEstudiante} />
        <Dl label="Categoría" value={instancia.nombreCategoria} />
        <Dl label="Fecha y hora" value={formatFechaHora(instancia.fechaHora)} />
        <Dl label="Canal" value={instancia.canal} />
        <Dl label="Responsable" value={instancia.nombreFuncionario} />

        <InstanciaComentarios codInstancia={codInstancia} />
      </div>

      <ConfirmDialog
        open={confirmandoBaja}
        title="Desactivar instancia"
        message={`¿Desactivar "${instancia.titulo}"? Va a dejar de aparecer en las búsquedas activas, pero se conserva.`}
        confirmLabel="Desactivar"
        destructive
        onConfirm={confirmarDesactivar}
        onCancel={() => setConfirmandoBaja(false)}
      />
    </div>
  );
}

// Mismo componente de campo etiqueta/valor que StudentProfile.Dato, con otro
// nombre (Dl, como en el mock) para no importar algo privado de components/students.
function Dl({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-base-300 flex flex-wrap gap-x-4 select-none cursor-default">
      <span className="text-base-content/60 w-40 shrink-0">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
