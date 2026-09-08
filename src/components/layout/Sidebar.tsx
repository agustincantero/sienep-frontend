"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FUNCIONARIO_NAV, gruposVisibles } from "@/lib/nav-items";
import { useSession } from "@/lib/session-context";
import { BackButton } from "./BackButton";

type SidebarProps = {
  show: boolean;
  onClose: () => void;
};

// Nav lateral de funcionario. Los ítems se filtran por permisos del usuario
// (mismo criterio que el dashboard). Para estudiante no hay sidebar (su nav es
// self-service y va en el propio contenido) -> devuelve null.
// Responsive con el patrón "offcanvas": por debajo de md es un cajón deslizable
// (fixed, oculto, con backdrop); en md y para arriba queda estático.
export function Sidebar({ show, onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useSession();

  if (user.tipo !== "FUNCIONARIO") return null;

  const grupos = gruposVisibles(FUNCIONARIO_NAV, user.permisos);

  return (
    <>
      {show ? <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} /> : null}
      <div
        className={
          "fixed md:static top-0 left-0 z-40 h-full md:h-auto w-[260px] shrink-0 bg-base-200 border-r border-base-300 transform transition-transform duration-200 md:translate-x-0 " +
          (show ? "translate-x-0" : "-translate-x-full")
        }
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-3 border-b border-base-300 md:hidden">
          <h5 className="font-bold">Menú</h5>
          <button type="button" className="btn btn-sm btn-circle btn-ghost" aria-label="Cerrar" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="h-full flex flex-col overflow-auto">
          <div className="h-full flex flex-col p-3 overflow-auto">
            <BackButton href="/inicio" label="Inicio" />
            {grupos.map((group) => (
              <div key={group.label}>
                <h6 className="uppercase text-base-content/60 text-xs font-bold px-2 mb-1 tracking-wide">{group.label}</h6>
                <ul className="flex flex-col gap-1 mb-3">
                  {group.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <li className="list-none" key={item.key}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={
                            "flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm" +
                            (active ? " bg-primary text-primary-content font-medium" : " hover:bg-base-300")
                          }
                        >
                          <item.icon size={15} aria-hidden />
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
