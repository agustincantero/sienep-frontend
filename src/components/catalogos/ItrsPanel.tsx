"use client";

import { useMemo, useState } from "react";
import { coincide, compararTexto } from "@/lib/catalogos";
import { deactivateItr, listItrs, reactivateItr, type Itr } from "@/lib/itrs";
import { useSession } from "@/lib/session-context";
import { EstadoBadge } from "@/components/instancias/EstadoBadge";
import { AccionesFila } from "./AccionesFila";
import { CatalogoMarco } from "./CatalogoMarco";
import { useCatalogo, type Sustantivo } from "./useCatalogo";

const SUSTANTIVO: Sustantivo = { singular: "ITR", plural: "ITRs", femenino: false };

export function ItrsPanel({ exitoInicial }: { exitoInicial?: string }) {
  const { permisos } = useSession();
  const cat = useCatalogo<Itr>({
    listar: listItrs,
    idDe: (i) => i.idItr,
    nombreDe: (i) => i.nomItr,
    desactivar: deactivateItr,
    reactivar: reactivateItr,
    sustantivo: SUSTANTIVO,
    exitoInicial,
  });

  const [texto, setTexto] = useState("");
  const [filtroCarrera, setFiltroCarrera] = useState("");

  const opcionesFiltroCarrera = useMemo(
    () => [...new Set(cat.items.flatMap((i) => i.carreras))].sort(compararTexto),
    [cat.items],
  );

  const visibles = useMemo(
    () =>
      cat.items
        .filter((i) => coincide(texto, i.nomItr, ...i.carreras) && (!filtroCarrera || i.carreras.includes(filtroCarrera)))
        .sort((a, b) => compararTexto(a.nomItr, b.nomItr)),
    [cat.items, texto, filtroCarrera],
  );

  const aDesactivar = cat.itemADesactivar;

  return (
    <CatalogoMarco
      buscadorPlaceholder="Buscar por ITR o carrera"
      texto={texto}
      onTextoChange={setTexto}
      filtroEstado={cat.filtroEstado}
      onFiltroEstadoChange={cat.setFiltroEstado}
      filtrosExtra={[
        { label: "Carrera", emptyLabel: "Todas", options: opcionesFiltroCarrera, value: filtroCarrera, onChange: setFiltroCarrera },
      ]}
      cargando={cat.cargando}
      errorCarga={cat.errorCarga}
      error={cat.error}
      exito={cat.exito}
      vacio="No se encontraron ITRs."
      cantidad={visibles.length}
      headers={["ITR", "Carreras que dicta", "Estado", ""]}
      confirmacion={{
        open: aDesactivar != null,
        title: "Desactivar ITR",
        message: aDesactivar
          ? `¿Desactivar el ${aDesactivar.nomItr}? Deja de ofrecerse al dar de alta estudiantes. Sus carreras y grupos no se modifican.`
          : "",
        onConfirm: cat.confirmarDesactivar,
        onCancel: cat.cancelarDesactivar,
      }}
    >
      {visibles.map((i) => (
        <tr key={i.idItr}>
          <td className="font-semibold text-sm">{i.nomItr}</td>
          <td>
            {i.carreras.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {[...i.carreras].sort(compararTexto).map((c) => (
                  <span key={c} className="badge badge-outline badge-sm whitespace-nowrap">
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-base-content/60 text-sm">Sin carreras asociadas</span>
            )}
          </td>
          <td>
            <EstadoBadge estado={i.estado} />
          </td>
          <td className="whitespace-nowrap text-right">
            <AccionesFila
              activo={i.estado === "ACTIVO"}
              nombre={i.nomItr}
              enCurso={cat.accionEnCursoId === i.idItr}
              puedeEditar={permisos.includes("EDITAR_ITR")}
              puedeDesactivar={permisos.includes("DESACTIVAR_ITR")}
              puedeReactivar={permisos.includes("REACTIVAR_ITR")}
              editarHref={`/catalogos/itrs/${i.idItr}/editar`}
              onDesactivar={() => cat.pedirDesactivar(i.idItr)}
              onReactivar={() => cat.handleReactivar(i)}
            />
          </td>
        </tr>
      ))}
    </CatalogoMarco>
  );
}
