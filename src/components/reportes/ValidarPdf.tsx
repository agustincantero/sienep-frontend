"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { formatFechaHora } from "@/lib/format";
import { validarReportePdf, type ValidacionReporte } from "@/lib/reportes";

type Resultado = { nombre: string; validacion: ValidacionReporte } | { error: string };

// Sube un PDF exportado desde SIENEP y el backend compara su hash SHA-256 con el guardado al exportar.
export function ValidarPdf() {
  const [validando, setValidando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function alElegir(archivo: File | undefined) {
    if (!archivo) return;
    setValidando(true);
    setResultado(null);
    try {
      setResultado({ nombre: archivo.name, validacion: await validarReportePdf(archivo) });
    } catch (err) {
      setResultado({ error: apiErrorMessage(err, "No se pudo validar el archivo.") });
    } finally {
      setValidando(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <section className="card bg-base-100 border border-base-300">
      <div className="card-body gap-3 p-4">
        <h2 className="card-title text-base">Validar autenticidad de un reporte</h2>
        <p className="text-sm text-base-content/70">
          Subí un PDF exportado desde SIENEP para confirmar que lo generó el sistema y que no se modificó.
        </p>
        <input
          ref={input}
          type="file"
          accept="application/pdf"
          className="file-input file-input-sm w-full max-w-xs"
          aria-label="Archivo PDF a validar"
          disabled={validando}
          onChange={(e) => void alElegir(e.target.files?.[0])}
        />
        {validando ? <span className="loading loading-spinner loading-sm" role="status" aria-label="Validando" /> : null}
        {resultado ? (
          <div
            role={"error" in resultado ? "alert" : "status"}
            className={`alert alert-soft text-sm flex items-center justify-between gap-2 ${"error" in resultado || !resultado.validacion.autentico ? "alert-error" : "alert-success"}`}
          >
            <span>
              {"error" in resultado
                ? resultado.error
                : resultado.validacion.autentico
                  ? `«${resultado.nombre}» es un reporte auténtico generado por SIENEP${resultado.validacion.fechaGeneracion ? ` el ${formatFechaHora(resultado.validacion.fechaGeneracion)}` : ""}.`
                  : `«${resultado.nombre}» no coincide con ningún reporte generado por SIENEP, o fue modificado.`}
            </span>
            <button type="button" className="btn btn-ghost btn-sm btn-circle shrink-0" aria-label="Cerrar resultado" onClick={() => setResultado(null)}>
              <X size={16} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
