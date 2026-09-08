"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useSession } from "@/lib/session-context";
import { BackButton } from "./BackButton";
import { Sidebar } from "./Sidebar";

// Chrome de las páginas de módulo (secciones), por dentro del AppShell:
//  - funcionario: Sidebar + toggle de menú mobile + contenido
//  - estudiante:  BackButton a /inicio + contenido, sin sidebar (como el prototipo)
export function SeccionShell({ children }: { children: React.ReactNode }) {
  const user = useSession();
  const [showSidebar, setShowSidebar] = useState(false);

  if (user.tipo !== "FUNCIONARIO") {
    return (
      <div className="grow overflow-auto">
        <div className="max-w-[980px] mx-auto w-full px-4 pt-4">
          <BackButton href="/inicio" label="Inicio" />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex grow min-h-0">
      <Sidebar show={showSidebar} onClose={() => setShowSidebar(false)} />
      <div className="grow overflow-auto flex flex-col">
        <div className="md:hidden border-b border-base-300 p-2 flex items-center gap-2 bg-base-200 shrink-0">
          <button
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
