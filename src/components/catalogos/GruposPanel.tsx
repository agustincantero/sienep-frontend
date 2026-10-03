"use client";

import { useMemo, useState } from "react";
import { coincide, compararTexto } from "@/lib/catalogos";
import { deactivateGroup, listGroups, reactivateGroup, type Group } from "@/lib/groups";
import { useSession } from "@/lib/session-context";
import { EstadoBadge } from "@/components/instancias/EstadoBadge";
import { AccionesFila } from "./AccionesFila";
import { CatalogoMarco } from "./CatalogoMarco";
import { useCatalogo, type Sustantivo } from "./useCatalogo";

const SUSTANTIVO: Sustantivo = { singular: "Grupo", plural: "grupos", femenino: false };

export function GruposPanel({ exitoInicial }: { exitoInicial?: string }) {
  const { permisos } = useSession();
  const cat = useCatalogo<Group>({
    listar: listGroups,
    idDe: (g) => g.idGrupo,
    nombreDe: (g) => g.nomGrupo,
    desactivar: deactivateGroup,
    reactivar: reactivateGroup,
    sustantivo: SUSTANTIVO,
    exitoInicial,
  });

  const [texto, setTexto] = useState("");
  const [filtroCarrera, setFiltroCarrera] = useState("");
  const [filtroGeneracion, setFiltroGeneracion] = useState("");

  const opcionesFiltroCarrera = useMemo(
    () => [...new Set(cat.items.map((g) => g.nomCarrera))].sort(compararTexto),
    [cat.items],
  );
  const opcionesFiltroGeneracion = useMemo(
    () => [...new Set(cat.items.map((g) => String(g.generacion)))].sort((a, b) => Number(b) - Number(a)),
    [cat.items],
  );

  const visibles = useMemo(
    () =>
      cat.items
        .filter(
          (g) =>
            coincide(texto, g.nomGrupo, g.nomCarrera) &&
            (!filtroCarrera || g.nomCarrera === filtroCarrera) &&
            (!filtroGeneracion || String(g.generacion) === filtroGeneracion),
        )
        .sort(
          (a, b) =>
            compararTexto(a.nomCarrera, b.nomCarrera) || b.generacion - a.generacion || compararTexto(a.nomGrupo, b.nomGrupo),
        ),
    [cat.items, texto, filtroCarrera, filtroGeneracion],
  );

  const aDesactivar = cat.itemADesactivar;

  return (
    <CatalogoMarco
      buscadorPlaceholder="Buscar por grupo o carrera"
      texto={texto}
      onTextoChange={setTexto}
      filtroEstado={cat.filtroEstado}
      onFiltroEstadoChange={cat.setFiltroEstado}
      filtrosExtra={[
        { label: "Carrera", emptyLabel: "Todas", options: opcionesFiltroCarrera, value: filtroCarrera, onChange: setFiltroCarrera },
        { label: "Generación", emptyLabel: "Todas", options: opcionesFiltroGeneracion, value: filtroGeneracion, onChange: setFiltroGeneracion },
      ]}
      cargando={cat.cargando}
      errorCarga={cat.errorCarga}
      error={cat.error}
      exito={cat.exito}
      vacio="No se encontraron grupos."
      cantidad={visibles.length}
      headers={["Grupo", "Carrera", "Generación", "Estado", ""]}
      confirmacion={{
        open: aDesactivar != null,
        title: "Desactivar grupo",
        message: aDesactivar
          ? `¿Desactivar el grupo ${aDesactivar.nomGrupo} (${aDesactivar.nomCarrera}, ${aDesactivar.generacion})? Deja de ofrecerse al asignar estudiantes. Los que ya lo tienen asignado lo conservan.`
          : "",
        onConfirm: cat.confirmarDesactivar,
        onCancel: cat.cancelarDesactivar,
      }}
    >
      {visibles.map((g) => (
        <tr key={g.idGrupo}>
          <td className="font-semibold text-sm">{g.nomGrupo}</td>
          <td className="text-sm">{g.nomCarrera}</td>
          <td className="text-sm tabular-nums">{g.generacion}</td>
          <td>
            <EstadoBadge estado={g.estado} />
          </td>
          <td className="whitespace-nowrap text-right">
            <AccionesFila
              activo={g.estado === "ACTIVO"}
              nombre={g.nomGrupo}
              enCurso={cat.accionEnCursoId === g.idGrupo}
              puedeEditar={permisos.includes("EDITAR_GRUPO")}
              puedeDesactivar={permisos.includes("DESACTIVAR_GRUPO")}
              puedeReactivar={permisos.includes("REACTIVAR_GRUPO")}
              editarHref={`/catalogos/grupos/${g.idGrupo}/editar`}
              onDesactivar={() => cat.pedirDesactivar(g.idGrupo)}
              onReactivar={() => cat.handleReactivar(g)}
            />
          </td>
        </tr>
      ))}
    </CatalogoMarco>
  );
}
