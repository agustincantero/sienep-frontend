"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { TOPE_LISTADO } from "@/lib/buscar-estudiante";
import { listRecordatoriosDeInstancia, type Recordatorio } from "@/lib/recordatorios";
import { useSession } from "@/lib/session-context";
import { RecordatoriosTabla } from "./RecordatoriosTabla";

// Recordatorios activos de una instancia, dentro de su detalle. Solo lectura más los links a cada uno: la baja y la edición se hacen desde el detalle del recordatorio, para no duplicar acá los diálogos del listado.
export function InstanciaRecordatorios({ codInstancia, instanciaActiva }: { codInstancia: number; instanciaActiva: boolean }) {
  const { permisos } = useSession();
  // El backend solo acepta recordatorios sobre instancias activas.
  const puedeCrear = permisos.includes("CREAR_RECORDATORIO") && instanciaActiva;
  const puedeEditar = permisos.includes("EDITAR_RECORDATORIO");

  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    listRecordatoriosDeInstancia(codInstancia, { size: TOPE_LISTADO, sort: "fechaHora,asc" })
      .then((p) => {
        if (!cancelado) setRecordatorios(p.content);
      })
      .catch((err) => {
        if (!cancelado) setError(apiErrorMessage(err, "No se pudieron cargar los recordatorios."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [codInstancia]);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h6 className="text-sm font-semibold">Recordatorios</h6>
        {puedeCrear ? (
          <Link href={`/recordatorios/nuevo?instancia=${codInstancia}`} className="btn btn-outline btn-xs gap-1">
            <Plus size={13} aria-hidden />
            Nuevo recordatorio
          </Link>
        ) : null}
      </div>

      {error ? (
        <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
          <span>{error}</span>
        </div>
      ) : null}

      {cargando ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner loading-sm" />
        </div>
      ) : recordatorios.length === 0 ? (
        error ? null : <p className="text-base-content/60 text-sm mb-3">Todavía no hay recordatorios.</p>
      ) : (
        <RecordatoriosTabla filas={recordatorios} query="?desde=instancia" sinInstancia puedeEditar={puedeEditar} />
      )}
    </div>
  );
}
