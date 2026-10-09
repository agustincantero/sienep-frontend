"use client";

import type { Carrera } from "@/lib/carreras";
import type { TabCatalogo } from "@/lib/catalogos-tabs";
import type { Group } from "@/lib/groups";
import type { Itr } from "@/lib/itrs";
import { CarreraForm } from "./CarreraForm";
import { CATEGORIAS_INSTANCIA, CATEGORIAS_RECORDATORIO, type Categoria } from "./categorias-config";
import { CategoriaForm } from "./CategoriaForm";
import { GrupoForm } from "./GrupoForm";
import { ItrForm } from "./ItrForm";

// Elige el formulario según el catálogo de la URL (/catalogos/[catalogo]/nuevo y /[id]/editar). `item` es lo que devolvió el GET /{id} server-side en la edición; en el alta no viene.
export function CatalogoForm({ catalogo, item }: { catalogo: TabCatalogo; item?: unknown }) {
  switch (catalogo) {
    case "carreras":
      return <CarreraForm carrera={item as Carrera | undefined} />;
    case "grupos":
      return <GrupoForm grupo={item as Group | undefined} />;
    case "itrs":
      return <ItrForm itr={item as Itr | undefined} />;
    case "categorias-instancia":
      return <CategoriaForm config={CATEGORIAS_INSTANCIA} categoria={item as Categoria | undefined} />;
    case "categorias-recordatorio":
      return <CategoriaForm config={CATEGORIAS_RECORDATORIO} categoria={item as Categoria | undefined} />;
  }
}
