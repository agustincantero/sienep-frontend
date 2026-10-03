"use client";

import { useMemo, useState } from "react";
import { deactivateCarrera, listCarreras, reactivateCarrera, type Carrera } from "@/lib/carreras";
import { coincide, compararTexto } from "@/lib/catalogos";
import { useSession } from "@/lib/session-context";
import { EstadoBadge } from "@/components/instancias/EstadoBadge";
import { AccionesFila } from "./AccionesFila";
import { CatalogoMarco } from "./CatalogoMarco";
import { useCatalogo, type Sustantivo } from "./useCatalogo";

const SUSTANTIVO: Sustantivo = { singular: "Carrera", plural: "carreras", femenino: true };

export function CarrerasPanel({ exitoInicial }: { exitoInicial?: string }) {
  const { permisos } = useSession();
  const cat = useCatalogo<Carrera>({
    listar: listCarreras,
    idDe: (c) => c.idCarrera,
    nombreDe: (c) => c.nomCarrera,
    desactivar: deactivateCarrera,
    reactivar: reactivateCarrera,
    sustantivo: SUSTANTIVO,
    exitoInicial,
  });
  const [texto, setTexto] = useState("");

  const visibles = useMemo(
    () =>
      cat.items
        .filter((c) => coincide(texto, c.nomCarrera, ...(c.itrs ?? []).map((i) => i.nomItr)))
        .sort((a, b) => compararTexto(a.nomCarrera, b.nomCarrera)),
    [cat.items, texto],
  );

  const aDesactivar = cat.itemADesactivar;

  return (
    <CatalogoMarco
      buscadorPlaceholder="Buscar por carrera o ITR"
      texto={texto}
      onTextoChange={setTexto}
      filtroEstado={cat.filtroEstado}
      onFiltroEstadoChange={cat.setFiltroEstado}
      cargando={cat.cargando}
      errorCarga={cat.errorCarga}
      error={cat.error}
      exito={cat.exito}
      vacio="No se encontraron carreras."
      cantidad={visibles.length}
      headers={["Carrera", "Se dicta en", "Estado", ""]}
      confirmacion={{
        open: aDesactivar != null,
        title: "Desactivar carrera",
        message: aDesactivar
          ? `¿Desactivar la carrera ${aDesactivar.nomCarrera}? Deja de ofrecerse al crear grupos y al asociarla a un ITR. Sus grupos y estudiantes no se modifican.`
          : "",
        onConfirm: cat.confirmarDesactivar,
        onCancel: cat.cancelarDesactivar,
      }}
    >
      {visibles.map((c) => (
        <tr key={c.idCarrera}>
          <td className="font-semibold text-sm">{c.nomCarrera}</td>
          <td>
            {c.itrs && c.itrs.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {c.itrs.map((i) => (
                  <span key={i.idItr} className="badge badge-outline badge-sm whitespace-nowrap">
                    {i.nomItr}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-base-content/60 text-sm">Sin ITR asignado</span>
            )}
          </td>
          <td>
            <EstadoBadge estado={c.estado} />
          </td>
          <td className="whitespace-nowrap text-right">
            <AccionesFila
              activo={c.estado === "ACTIVO"}
              nombre={c.nomCarrera}
              enCurso={cat.accionEnCursoId === c.idCarrera}
              puedeEditar={permisos.includes("EDITAR_CARRERA")}
              puedeDesactivar={permisos.includes("DESACTIVAR_CARRERA")}
              puedeReactivar={permisos.includes("REACTIVAR_CARRERA")}
              editarHref={`/catalogos/carreras/${c.idCarrera}/editar`}
              onDesactivar={() => cat.pedirDesactivar(c.idCarrera)}
              onReactivar={() => cat.handleReactivar(c)}
            />
          </td>
        </tr>
      ))}
    </CatalogoMarco>
  );
}
