"use client";

import { useMemo, useState } from "react";
import { coincide, compararTexto } from "@/lib/catalogos";
import { buscarCatalogo } from "@/lib/catalogos-tabs";
import { useSession } from "@/lib/session-context";
import { EstadoBadge } from "@/components/instancias/EstadoBadge";
import { AccionesFila } from "./AccionesFila";
import { CatalogoMarco } from "./CatalogoMarco";
import type { Categoria, ConfigCategoria } from "./categorias-config";
import { useCatalogo } from "./useCatalogo";

export function CategoriasPanel({ config, exitoInicial }: { config: ConfigCategoria; exitoInicial?: string }) {
  const { permisos } = useSession();
  const puedeEditar = permisos.includes(buscarCatalogo(config.tab)!.permisos.editar);

  const cat = useCatalogo<Categoria>({
    listar: config.listar,
    idDe: (c) => c.idCategoria,
    nombreDe: (c) => c.nomCategoria,
    desactivar: config.desactivar,
    reactivar: config.reactivar,
    sustantivo: config.sustantivo,
    exitoInicial,
  });
  const [texto, setTexto] = useState("");

  const visibles = useMemo(
    () =>
      cat.items
        .filter((c) => coincide(texto, c.nomCategoria, c.descripcion))
        .sort((a, b) => compararTexto(a.nomCategoria, b.nomCategoria)),
    [cat.items, texto],
  );

  const aDesactivar = cat.itemADesactivar;

  return (
    <CatalogoMarco
      buscadorPlaceholder="Buscar por nombre o descripción"
      texto={texto}
      onTextoChange={setTexto}
      filtroEstado={cat.filtroEstado}
      onFiltroEstadoChange={cat.setFiltroEstado}
      cargando={cat.cargando}
      errorCarga={cat.errorCarga}
      error={cat.error}
      exito={cat.exito}
      vacio="No se encontraron categorías."
      cantidad={visibles.length}
      headers={["Categoría", "Descripción", "Estado", ""]}
      confirmacion={{
        open: aDesactivar != null,
        title: "Desactivar categoría",
        // El backend rechaza la baja (409) si la categoría está en uso; ese mensaje se muestra como error del listado.
        message: aDesactivar
          ? `¿Desactivar la categoría ${aDesactivar.nomCategoria}? ${config.efectoBaja} Si está en uso por registros activos, no se va a poder desactivar.`
          : "",
        onConfirm: cat.confirmarDesactivar,
        onCancel: cat.cancelarDesactivar,
      }}
    >
      {visibles.map((c) => (
        <tr key={c.idCategoria}>
          <td className="font-semibold text-sm wrap-anywhere">{c.nomCategoria}</td>
          <td className="text-base-content/70 text-sm wrap-anywhere">{c.descripcion || "—"}</td>
          <td>
            <EstadoBadge estado={c.estado} />
          </td>
          <td className="whitespace-nowrap text-right">
            <AccionesFila
              activo={c.estado === "ACTIVO"}
              nombre={c.nomCategoria}
              enCurso={cat.accionEnCursoId === c.idCategoria}
              puedeEditar={puedeEditar}
              puedeDesactivar={permisos.includes(config.permisos.desactivar)}
              puedeReactivar={permisos.includes(config.permisos.reactivar)}
              editarHref={`/catalogos/${config.tab}/${c.idCategoria}/editar`}
              onDesactivar={() => cat.pedirDesactivar(c.idCategoria)}
              onReactivar={() => cat.handleReactivar(c)}
            />
          </td>
        </tr>
      ))}
    </CatalogoMarco>
  );
}
