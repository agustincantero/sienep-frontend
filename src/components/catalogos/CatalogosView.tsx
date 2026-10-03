"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TABS_CATALOGO, hrefListado, type TabCatalogo } from "@/lib/catalogos-tabs";
import { useSession } from "@/lib/session-context";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CarrerasPanel } from "./CarrerasPanel";
import { CATEGORIAS_INSTANCIA, CATEGORIAS_RECORDATORIO } from "./categorias-config";
import { CategoriasPanel } from "./CategoriasPanel";
import { GruposPanel } from "./GruposPanel";
import { ItrsPanel } from "./ItrsPanel";

function Panel({ tab, exitoInicial }: { tab: TabCatalogo; exitoInicial?: string }) {
  switch (tab) {
    case "carreras":
      return <CarrerasPanel exitoInicial={exitoInicial} />;
    case "grupos":
      return <GruposPanel exitoInicial={exitoInicial} />;
    case "itrs":
      return <ItrsPanel exitoInicial={exitoInicial} />;
    case "categorias-instancia":
      return <CategoriasPanel config={CATEGORIAS_INSTANCIA} exitoInicial={exitoInicial} />;
    case "categorias-recordatorio":
      return <CategoriasPanel config={CATEGORIAS_RECORDATORIO} exitoInicial={exitoInicial} />;
  }
}

export function CatalogosView({ tabInicial, exitoInicial }: { tabInicial?: string; exitoInicial?: string }) {
  const router = useRouter();
  const { permisos } = useSession();
  // Solo las pestañas cuyo catálogo el usuario puede ver: la página ya exige al menos una (page.tsx).
  const tabs = TABS_CATALOGO.filter((t) => permisos.includes(t.permisos.ver));
  const [tab, setTab] = useState<TabCatalogo>(
    () => tabs.find((t) => t.id === tabInicial)?.id ?? tabs[0]?.id ?? "carreras",
  );
  // El ?exito= que deja el formulario al guardar solo vale para la pestaña con la que se llegó.
  const [exito] = useState(exitoInicial);

  // Se saca ?exito= de la URL apenas se muestra, para que recargar no repita el mensaje.
  useEffect(() => {
    if (exitoInicial) router.replace(hrefListado(tab), { scroll: false });
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ?tab= en la URL para que recargar o volver con "atrás" deje al usuario en la misma pestaña. replace y no push: cambiar de pestaña no es una navegación nueva en el historial.
  function cambiarTab(id: TabCatalogo) {
    setTab(id);
    router.replace(hrefListado(id), { scroll: false });
  }

  const actual = TABS_CATALOGO.find((t) => t.id === tab)!;
  const puedeCrear = permisos.includes(actual.permisos.crear);

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[1200px] mx-auto w-full px-4 py-5">
        <SectionHeader
          title="Catálogos"
          action={puedeCrear ? `+ ${actual.nuevoLabel}` : undefined}
          onAction={puedeCrear ? () => router.push(`/catalogos/${tab}/nuevo`) : undefined}
        />

        <div role="tablist" aria-label="Catálogos" className="tabs tabs-border mb-4 flex-nowrap overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls="panel-catalogo"
              className={`tab gap-1.5 whitespace-nowrap ${tab === id ? "tab-active" : ""}`}
              onClick={() => cambiarTab(id)}
            >
              <Icon size={14} aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {/* key={tab}: cada pestaña arranca con su propio estado (filtros, mensajes) y las dos de categorías, que comparten componente, no se pisan entre sí. */}
        <div key={tab} id="panel-catalogo" role="tabpanel" aria-labelledby={`tab-${tab}`} className="animate-[fade-in_180ms_ease-out]">
          <Panel tab={tab} exitoInicial={tab === tabInicial ? exito : undefined} />
        </div>
      </div>
    </div>
  );
}
