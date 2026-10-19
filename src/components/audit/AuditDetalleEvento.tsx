import { ArrowRight } from "lucide-react";
import { type AuditAction, type AuditEvent } from "@/lib/audit";
import { formatFechaHora } from "@/lib/format";

// Clases completas a mano: un template literal armado en runtime no lo detecta el escaneo estático de Tailwind.
const BORDE_ACCION: Record<AuditAction, string> = {
  INSERT: "border-l-success",
  UPDATE: "border-l-primary",
  DELETE: "border-l-error",
  LOGIN: "border-l-neutral",
  LOGOUT: "border-l-base-300",
};

// created_at / updated_at (o createdAt / updatedAt) cambian en casi todo UPDATE y tapan lo que realmente se editó.
const CAMPO_DE_TIEMPO = /^(created|updated)_?at$/i;

const FECHA_HORA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

// "fecha_hora_ultimo_login" -> "Fecha hora ultimo login": los nombres vienen tal cual de las columnas de la tabla.
function etiquetaCampo(campo: string): string {
  if (CAMPO_DE_TIEMPO.test(campo)) return campo.toLowerCase().startsWith("created") ? "Fecha de creación" : "Última actualización";
  const palabras = campo
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase();
  return palabras.charAt(0).toUpperCase() + palabras.slice(1);
}

type Valor = { texto: string; vacio: boolean };

// null/undefined -> "Sin valor" (el campo no existe de ese lado del diff); fechas ISO -> dd/mm/aaaa hh:mm; booleanos -> Sí/No; objetos -> JSON.
function formatValor(valor: unknown): Valor {
  if (valor === null || valor === undefined || valor === "") return { texto: "Sin valor", vacio: true };
  if (typeof valor === "boolean") return { texto: valor ? "Sí" : "No", vacio: false };
  if (typeof valor === "object") return { texto: JSON.stringify(valor), vacio: false };
  if (typeof valor === "string" && FECHA_HORA_ISO.test(valor)) return { texto: formatFechaHora(valor), vacio: false };
  return { texto: String(valor), vacio: false };
}

function ValorTexto({ valor, className = "" }: { valor: Valor; className?: string }) {
  return <span className={`wrap-anywhere ${valor.vacio ? "italic text-base-content/50" : ""} ${className}`}>{valor.texto}</span>;
}

// Lista de pares campo/valor para los campos que no cambiaron (o para todo el registro en un alta o una baja).
function ListaDeValores({ campos, fila }: { campos: string[]; fila: Record<string, unknown> }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {campos.map((campo) => (
        <div key={campo} className="flex flex-col min-w-0">
          <dt className="text-xs text-base-content/70">{etiquetaCampo(campo)}</dt>
          <dd className="text-sm">
            <ValorTexto valor={formatValor(fila[campo])} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function FilaDeCambio({ campo, anterior, nuevo }: { campo: string; anterior: Valor; nuevo: Valor }) {
  return (
    <li className="grid gap-1 py-2 sm:grid-cols-[minmax(9rem,13rem)_1fr] sm:gap-x-4">
      <span className="text-sm font-medium">{etiquetaCampo(campo)}</span>
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm min-w-0">
        <span className="sr-only">Antes:</span>
        <ValorTexto valor={anterior} className={anterior.vacio ? "" : "line-through text-base-content/70"} />
        <ArrowRight size={14} aria-hidden className="shrink-0 self-center text-base-content/50" />
        <span className="sr-only">Después:</span>
        <ValorTexto valor={nuevo} className={nuevo.vacio ? "" : "font-semibold"} />
      </span>
    </li>
  );
}

// valorAnterior/valorNuevo son la FILA ENTERA (to_jsonb(OLD)/to_jsonb(NEW) del trigger), no solo el campo que cambió: en una edición se muestra primero lo que difiere y el resto queda plegado.
export function AuditDetalleEvento({ evento }: { evento: AuditEvent }) {
  const { valorAnterior, valorNuevo, accion } = evento;
  // LOGIN/LOGOUT no traen valores y la lista no ofrece el detalle para ellos.
  if (!valorAnterior && !valorNuevo) return null;

  let cuerpo: React.ReactNode;

  if (!valorAnterior || !valorNuevo) {
    // Alta o baja: solo existe un lado, no hay nada que comparar.
    const fila = (valorNuevo ?? valorAnterior) as Record<string, unknown>;
    cuerpo = (
      <>
        <h4 className="text-sm font-semibold mb-3">{valorNuevo ? "Valores registrados" : "Valores que tenía el registro"}</h4>
        <ListaDeValores campos={Object.keys(fila)} fila={fila} />
      </>
    );
  } else {
    const campos = [...new Set([...Object.keys(valorAnterior), ...Object.keys(valorNuevo)])];
    const cambiaron = campos.filter((c) => formatValor(valorAnterior[c]).texto !== formatValor(valorNuevo[c]).texto);
    const iguales = campos.filter((c) => !cambiaron.includes(c));
    const principales = cambiaron.filter((c) => !CAMPO_DE_TIEMPO.test(c));
    const detalleTiempo = cambiaron.filter((c) => CAMPO_DE_TIEMPO.test(c));

    cuerpo = (
      <>
        {cambiaron.length === 0 ? (
          <p className="text-sm text-base-content/70">El evento no registra diferencias entre los valores anteriores y los nuevos.</p>
        ) : (
          <>
            <h4 className="text-sm font-semibold">
              {principales.length > 0
                ? `${principales.length === 1 ? "Cambió 1 campo" : `Cambiaron ${principales.length} campos`}`
                : "Solo cambió la marca de tiempo"}
            </h4>
            <ul className="divide-y divide-base-300">
              {[...principales, ...detalleTiempo].map((campo) => (
                <FilaDeCambio
                  key={campo}
                  campo={campo}
                  anterior={formatValor(valorAnterior[campo])}
                  nuevo={formatValor(valorNuevo[campo])}
                />
              ))}
            </ul>
          </>
        )}

        {iguales.length > 0 ? (
          <details className="collapse collapse-arrow border border-base-300 rounded-box mt-4">
            <summary className="collapse-title min-h-0 py-2 text-sm font-medium">
              {iguales.length === 1 ? "Ver el campo sin cambios" : `Ver los ${iguales.length} campos sin cambios`}
            </summary>
            <div className="collapse-content">
              <ListaDeValores campos={iguales} fila={valorNuevo} />
            </div>
          </details>
        ) : null}
      </>
    );
  }

  return (
    <section
      aria-label={`Detalle del evento ${evento.idAuditoria}`}
      className={`bg-base-100 border border-base-300 border-l-4 ${BORDE_ACCION[accion]} rounded-box p-4 sm:p-5`}
    >
      {cuerpo}
    </section>
  );
}
