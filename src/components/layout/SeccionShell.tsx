"use client";

import { useRef, useState } from "react";
import { Menu } from "lucide-react";
import { useSession } from "@/lib/session-context";
import { BackButton } from "./BackButton";
import { Sidebar } from "./Sidebar";

// Chrome de las páginas de módulo (secciones), por dentro del AppShell:
//  - funcionario: Sidebar + toggle de menú mobile + contenido
//  - estudiante:  BackButton a / + contenido, sin sidebar (como el prototipo)
export function SeccionShell({ children }: { children: React.ReactNode }) {
  const user = useSession();
  const [showSidebar, setShowSidebar] = useState(false);
  const botonMenuRef = useRef<HTMLButtonElement>(null);

  // El foco vuelve al botón que abrió el drawer al cerrarlo (con Escape, el backdrop, o un link de la nav) - si no, se pierde en el <body>.
  function cerrarSidebar() {
    setShowSidebar(false);
    botonMenuRef.current?.focus();
  }

  if (user.tipo !== "FUNCIONARIO") {
    return (
      <div className="grow overflow-auto">
        <div className="max-w-[980px] mx-auto w-full px-4 pt-4">
          <BackButton href="/" label="Inicio" />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex grow min-h-0 min-w-0">
      <Sidebar show={showSidebar} onClose={cerrarSidebar} />
      <div className="grow overflow-auto flex flex-col min-w-0">
        <div className="md:hidden border-b border-zinc-200 p-2 flex items-center gap-2 bg-zinc-100 shrink-0">
          <button
            ref={botonMenuRef}
            type="button"
            className="btn btn-outline btn-sm inline-flex items-center gap-1"
            onClick={() => setShowSidebar(true)}
          >
            <Menu size={15} aria-hidden />
            Menú
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
