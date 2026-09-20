"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { House } from "lucide-react";
import { usePathname } from "next/navigation";
import { FUNCIONARIO_NAV, gruposVisibles } from "@/lib/nav-items";
import { useSession } from "@/lib/session-context";
import { Logo } from "./Logo";

// Clases compartidas por todos los ítems de la nav (Inicio + los de FUNCIONARIO_NAV), para que "Inicio" sea un destino más de la lista y no un botón de volver — misma altura, mismo hover, mismo estado activo.
const CLASE_ITEM = "flex items-center gap-2 w-full text-left px-3 py-2 rounded-field text-sm";
const CLASE_ITEM_ACTIVO = "bg-primary text-primary-content font-medium";
const CLASE_ITEM_INACTIVO = "text-base-content/70 hover:text-base-content hover:bg-zinc-500/15";

type SidebarProps = {
  show: boolean;
  onClose: () => void;
};

// Nav lateral de funcionario. Los ítems se filtran por permisos del usuario. Responsive con el patrón "offcanvas": por debajo de md es un cajón deslizable (fixed, oculto, con backdrop); en md y para arriba queda estático.
export function Sidebar({ show, onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useSession();
  const panelRef = useRef<HTMLDivElement>(null);
  const idBase = useId();

  // Solo corre en mobile. Al abrir, mueve el foco al panel; Escape cierra; Tab/Shift+Tab quedan atrapados adentro para que no se pueda tabular al contenido de atrás, tapado por el backdrop.
  useEffect(() => {
    if (!show) return;
    panelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusables.length === 0) return;
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [show, onClose]);

  if (user.tipo !== "FUNCIONARIO") return null;

  const grupos = gruposVisibles(FUNCIONARIO_NAV, user.permisos);

  return (
    <>
      {show ? <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} /> : null}
      <div
        ref={panelRef}
        role={show ? "dialog" : undefined}
        aria-modal={show ? true : undefined}
        aria-label={show ? "Menú" : undefined}
        className={
          "fixed md:static top-0 left-0 z-40 h-full md:h-auto w-[260px] shrink-0 bg-zinc-100 border-r border-zinc-200 transform duration-200 md:translate-x-0 " +
          (show ? "translate-x-0 transition-transform" : "-translate-x-full max-md:invisible transition-[transform,visibility]")
        }
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-3 border-b border-zinc-500/15 md:hidden">
          <Logo variant="negro" className="h-5 w-auto" />
          <button type="button" className="btn btn-sm btn-circle btn-ghost" aria-label="Cerrar" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="h-full flex flex-col overflow-auto">
          <nav aria-label="Principal" className="h-full flex flex-col p-3 overflow-auto">
            <ul className="flex flex-col gap-1 pb-3 mb-3 border-b border-zinc-500/15">
              <li className="list-none">
                <Link
                  href="/"
                  onClick={onClose}
                  aria-current={pathname === "/" ? "page" : undefined}
                  className={CLASE_ITEM + " " + (pathname === "/" ? CLASE_ITEM_ACTIVO : CLASE_ITEM_INACTIVO)}
                >
                  <House size={15} aria-hidden />
                  Inicio
                </Link>
              </li>
            </ul>
            {grupos.map((group, i) => (
              <div key={group.label}>
                <p id={`${idBase}-${i}`} className="uppercase text-base-content/70 text-xs font-bold px-2 mb-1 tracking-wide">
                  {group.label}
                </p>
                <ul aria-labelledby={`${idBase}-${i}`} className="flex flex-col gap-1 mb-3">
                  {group.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <li className="list-none" key={item.key}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className={CLASE_ITEM + " " + (active ? CLASE_ITEM_ACTIVO : CLASE_ITEM_INACTIVO)}
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
          </nav>
        </div>
      </div>
    </>
  );
}
