"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { TABS_CATALOGO, hrefListado, type TabCatalogo } from "@/lib/catalogos-tabs";
import { useSession } from "@/lib/session-context";
import { CarrerasPanel } from "./CarrerasPanel";
import { CATEGORIAS_INSTANCIA, CATEGORIAS_RECORDATORIO } from "./categorias-config";
import { CategoriasPanel } from "./CategoriasPanel";
import { FrecuenciasPanel } from "./FrecuenciasPanel";
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
    case "frecuencias":
      return <FrecuenciasPanel exitoInicial={exitoInicial} />;
  }
}

export function CatalogosView({ catalogo, exitoInicial }: { catalogo: TabCatalogo; exitoInicial?: string }) {
  const router = useRouter();
  const { permisos } = useSession();
  // Solo las pestañas cuyo catálogo el usuario puede ver: la página ya exige ver el actual ([catalogo]/page.tsx).
  const tabs = TABS_CATALOGO.filter((t) => permisos.includes(t.permisos.ver));
  // El ?exito= que deja el formulario al guardar se guarda al montar: la URL se limpia enseguida.
  const [exito] = useState(exitoInicial);

  // Se saca ?exito= de la URL apenas se muestra, para que recargar no repita el mensaje.
  useEffect(() => {
    if (exitoInicial) router.replace(hrefListado(catalogo), { scroll: false });
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actual = TABS_CATALOGO.find((t) => t.id === catalogo)!;
  const puedeCrear = permisos.includes(actual.permisos.crear);

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[1200px] mx-auto w-full px-4 py-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h1 className="text-xl font-bold mb-0">Catálogos</h1>
          {puedeCrear ? (
            <button
              type="button"
              className="btn btn-primary btn-sm gap-1"
              onClick={() => router.push(`/catalogos/${catalogo}/nuevo`)}
            >
              <Plus size={14} aria-hidden />
              {actual.nuevoLabel}
            </button>
          ) : null}
        </div>

        {/* Cada pestaña es un link a su propia ruta (/catalogos/[catalogo]): navegación normal, no un tablist ARIA. */}
        <nav aria-label="Catálogos" className="tabs tabs-border mb-4 flex-nowrap overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={hrefListado(id)}
              scroll={false}
              aria-current={catalogo === id ? "page" : undefined}
              className={`tab gap-1.5 whitespace-nowrap ${catalogo === id ? "tab-active" : "text-base-content/70"}`}
            >
              <Icon size={14} aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        {/* key: las dos pestañas de categorías comparten componente; así cada catálogo arranca con su propio estado (filtros, mensajes). */}
        <div key={catalogo} className="animate-[fade-in_180ms_ease-out]">
          <Panel tab={catalogo} exitoInicial={exito} />
        </div>
      </div>
    </div>
  );
}
