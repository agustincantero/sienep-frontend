"use client";

import { useMemo, useState } from "react";
import { coincide, compararTexto } from "@/lib/catalogos";
import {
  deactivateFrecuencia,
  describirRegla,
  listFrecuencias,
  reactivateFrecuencia,
  TIPOS_FRECUENCIA,
  type Frecuencia,
} from "@/lib/frecuencias";
import { useSession } from "@/lib/session-context";
import { EstadoBadge } from "@/components/instancias/EstadoBadge";
import { AccionesFila } from "./AccionesFila";
import { CatalogoMarco } from "./CatalogoMarco";
import { useCatalogo } from "./useCatalogo";

export function FrecuenciasPanel({ exitoInicial }: { exitoInicial?: string }) {
  const { permisos } = useSession();

  const cat = useCatalogo<Frecuencia>({
    listar: listFrecuencias,
    idDe: (f) => f.idFrecuencia,
    nombreDe: (f) => f.descripcion,
    desactivar: deactivateFrecuencia,
    reactivar: reactivateFrecuencia,
    sustantivo: { singular: "Frecuencia", plural: "frecuencias", femenino: true },
    exitoInicial,
  });
  const [texto, setTexto] = useState("");

  const visibles = useMemo(
    () =>
      cat.items
        .filter((f) => coincide(texto, f.descripcion, TIPOS_FRECUENCIA[f.tipo], describirRegla(f)))
        .sort((a, b) => compararTexto(a.descripcion, b.descripcion)),
    [cat.items, texto],
  );

  const aDesactivar = cat.itemADesactivar;

  return (
    <CatalogoMarco
      buscadorPlaceholder="Buscar por descripción o tipo"
      texto={texto}
      onTextoChange={setTexto}
      filtroEstado={cat.filtroEstado}
      onFiltroEstadoChange={cat.setFiltroEstado}
      cargando={cat.cargando}
      errorCarga={cat.errorCarga}
      error={cat.error}
      exito={cat.exito}
      vacio="No se encontraron frecuencias."
      cantidad={visibles.length}
      headers={["Frecuencia", "Tipo", "Se repite", "Estado", ""]}
      confirmacion={{
        open: aDesactivar != null,
        title: "Desactivar frecuencia",
        // El backend rechaza la baja (409) si algún recordatorio activo la usa; ese mensaje se muestra como error del listado.
        message: aDesactivar
          ? `¿Desactivar la frecuencia ${aDesactivar.descripcion}? Deja de ofrecerse al crear recordatorios. Si algún recordatorio activo la usa, no se va a poder desactivar.`
          : "",
        onConfirm: cat.confirmarDesactivar,
        onCancel: cat.cancelarDesactivar,
      }}
    >
      {visibles.map((f) => (
        <tr key={f.idFrecuencia}>
          <td className="font-semibold text-sm wrap-anywhere">{f.descripcion}</td>
          <td className="text-sm whitespace-nowrap">{TIPOS_FRECUENCIA[f.tipo] ?? f.tipo}</td>
          <td className="text-base-content/70 text-sm">{describirRegla(f)}</td>
          <td>
            <EstadoBadge estado={f.estado} />
          </td>
          <td className="whitespace-nowrap text-right">
            <AccionesFila
              activo={f.estado === "ACTIVO"}
              nombre={f.descripcion}
              enCurso={cat.accionEnCursoId === f.idFrecuencia}
              puedeEditar={permisos.includes("EDITAR_RECORDATORIO")}
              puedeDesactivar={permisos.includes("DESACTIVAR_RECORDATORIO")}
              puedeReactivar={permisos.includes("REACTIVAR_RECORDATORIO")}
              editarHref={`/catalogos/frecuencias/${f.idFrecuencia}/editar`}
              onDesactivar={() => cat.pedirDesactivar(f.idFrecuencia)}
              onReactivar={() => cat.handleReactivar(f)}
            />
          </td>
        </tr>
      ))}
    </CatalogoMarco>
  );
}
