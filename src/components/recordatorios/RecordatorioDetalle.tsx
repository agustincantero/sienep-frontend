"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { formatFecha, formatFechaHora } from "@/lib/format";
import {
  deactivateRecordatorio,
  describirRepeticion,
  getRecordatorio,
  reactivateRecordatorio,
  TIPOS_RECORDATORIO,
  type Recordatorio,
} from "@/lib/recordatorios";
import { getInstancia } from "@/lib/instancias";
import { useSession } from "@/lib/session-context";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EstadoBadge } from "@/components/instancias/EstadoBadge";
import { BackButton } from "@/components/layout/BackButton";
import { EstadoOperativoBadge } from "./EstadoOperativoBadge";
import { InstanciaDesdeRecordatorioDialog } from "./InstanciaDesdeRecordatorioDialog";

// Mismo esquema que InstanciaDetalle: un único panel de datos con las acciones arriba.
// volverAInstancia: se llegó desde el detalle de la instancia, así que "Volver" regresa ahí en vez de al listado general.
export function RecordatorioDetalle({
  codRecordatorio,
  volverAInstancia = false,
}: {
  codRecordatorio: number;
  volverAInstancia?: boolean;
}) {
  const router = useRouter();
  const { permisos } = useSession();
  const puedeEditar = permisos.includes("EDITAR_RECORDATORIO");
  const puedeDesactivar = permisos.includes("DESACTIVAR_RECORDATORIO");
  const puedeReactivar = permisos.includes("REACTIVAR_RECORDATORIO");
  // POST /recordatorios/{id}/instancias pide CREAR_INSTANCIA (crea una instancia, no toca el recordatorio más que para marcarlo cumplido).
  const puedeCrearSeguimiento = permisos.includes("CREAR_INSTANCIA");

  const [recordatorio, setRecordatorio] = useState<Recordatorio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [error, setError] = useState("");
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);
  const [creandoSeguimiento, setCreandoSeguimiento] = useState(false);
  const [procesando, setProcesando] = useState(false);
  // Identificador de negocio de la instancia (RecordatorioResponseDTO no lo trae). Si no se puede leer, queda solo el título.
  const [idNegInstancia, setIdNegInstancia] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    getRecordatorio(codRecordatorio)
      .then((r) => {
        if (cancelado) return;
        setRecordatorio(r);
        setErrorCarga("");
        getInstancia(r.codInstancia)
          .then((i) => {
            if (!cancelado) setIdNegInstancia(i.idNegInstancia);
          })
          .catch(() => {});
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorCarga(apiErrorMessage(err, "No se pudo cargar el recordatorio."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [codRecordatorio]);

  async function confirmarDesactivar() {
    setConfirmandoBaja(false);
    setProcesando(true);
    setError("");
    try {
      await deactivateRecordatorio(codRecordatorio);
      setRecordatorio((prev) => (prev ? { ...prev, estado: "INACTIVO" } : prev));
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo desactivar el recordatorio."));
    } finally {
      setProcesando(false);
    }
  }

  async function handleReactivar() {
    setProcesando(true);
    setError("");
    try {
      const reactivado = await reactivateRecordatorio(codRecordatorio);
      setRecordatorio(reactivado);
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo reactivar el recordatorio."));
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return (
      <div className="grow overflow-auto flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" role="status" aria-label="Cargando" />
      </div>
    );
  }

  if (errorCarga || !recordatorio) {
    return (
      <div className="grow overflow-auto">
        <div className="max-w-[700px] mx-auto w-full px-4 py-5">
          <BackButton href="/recordatorios" label="Volver a recordatorios" />
          <div role="alert" className="alert alert-error alert-soft text-sm">
            <span>{errorCarga || "Recordatorio no encontrado."}</span>
          </div>
        </div>
      </div>
    );
  }

  const activo = recordatorio.estado === "ACTIVO";
  const query = volverAInstancia ? "?desde=instancia" : "";

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[700px] mx-auto w-full px-4 py-5">
        <BackButton
          href={volverAInstancia ? `/instancias/${recordatorio.codInstancia}` : "/recordatorios"}
          label={volverAInstancia ? "Volver a la instancia" : "Volver a recordatorios"}
        />

        {error ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-4">
            <span>{error}</span>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold mb-1">{recordatorio.titulo}</h1>
            <div className="flex gap-1.5">
              <EstadoBadge estado={recordatorio.estado} />
              <EstadoOperativoBadge estado={recordatorio.estadoOperativo} />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {activo && puedeCrearSeguimiento ? (
              <button
                type="button"
                className="btn btn-primary btn-sm gap-1"
                disabled={procesando}
                onClick={() => setCreandoSeguimiento(true)}
              >
                <CalendarPlus size={14} aria-hidden />
                Registrar seguimiento
              </button>
            ) : null}
            {activo && puedeEditar ? (
              <Link href={`/recordatorios/${codRecordatorio}/editar${query}`} className="btn btn-outline btn-sm">
                Editar
              </Link>
            ) : null}
            {activo && puedeDesactivar ? (
              <button
                type="button"
                className="btn btn-outline btn-error btn-sm"
                disabled={procesando}
                onClick={() => setConfirmandoBaja(true)}
              >
                Desactivar
              </button>
            ) : null}
            {!activo && puedeReactivar ? (
              <button type="button" className="btn btn-outline btn-sm" disabled={procesando} onClick={handleReactivar}>
                Activar
              </button>
            ) : null}
          </div>
        </div>

        <Dl label="Identificador" value={recordatorio.idNegRecordatorio} />
        <Dl
          label="Instancia"
          value={
            <Link href={`/instancias/${recordatorio.codInstancia}`} className="link link-hover link-primary">
              {idNegInstancia ? `${idNegInstancia} · ${recordatorio.tituloInstancia}` : recordatorio.tituloInstancia}
            </Link>
          }
        />
        <Dl label="Tipo" value={TIPOS_RECORDATORIO[recordatorio.tipo] ?? recordatorio.tipo} />
        <Dl label="Categoría" value={recordatorio.nombreCategoria} />
        <Dl label="Fecha y hora" value={formatFechaHora(recordatorio.fechaHora)} />
        <Dl label="Repetición" value={describirRepeticion(recordatorio, formatFecha) ?? "No se repite"} />
        <Dl label="Responsable" value={recordatorio.nombreResponsable} />
      </div>

      <ConfirmDialog
        open={confirmandoBaja}
        title="Desactivar recordatorio"
        message={`¿Desactivar "${recordatorio.titulo}"? Se quita de Google Calendar y deja de aparecer entre los activos, pero se conserva.`}
        confirmLabel="Desactivar"
        destructive
        onConfirm={confirmarDesactivar}
        onCancel={() => setConfirmandoBaja(false)}
      />

      {puedeCrearSeguimiento ? (
        <InstanciaDesdeRecordatorioDialog
          open={creandoSeguimiento}
          recordatorio={recordatorio}
          onCreada={(instancia) => router.push(`/instancias/${instancia.codInstancia}`)}
          onCancel={() => setCreandoSeguimiento(false)}
        />
      ) : null}
    </div>
  );
}

// Mismo componente de campo etiqueta/valor que InstanciaDetalle.Dl.
function Dl({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-base-300 flex flex-wrap gap-x-4 select-none cursor-default">
      <span className="text-base-content/70 w-40 shrink-0">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
