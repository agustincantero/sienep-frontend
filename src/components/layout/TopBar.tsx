"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Logo } from "./Logo";

type TopBarProps = {
  userName: string;
  userRole: string;
  onLogout: () => void;
};

export function TopBar({ userName, userRole, onLogout }: TopBarProps) {
  const [abierto, setAbierto] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const iniciales = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAbierto(false);
      botonRef.current?.focus();
    };
    const alHacerClic = (e: PointerEvent) => {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("keydown", alTeclear);
    document.addEventListener("pointerdown", alHacerClic);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.removeEventListener("pointerdown", alHacerClic);
    };
  }, [abierto]);

  return (
    <header className="navbar bg-zinc-700 text-white">
      <div className="flex items-center justify-between w-full px-4 flex-wrap gap-2">
        <span className="inline-flex items-center h-7">
          <Logo />
        </span>

        {/* Patrón disclosure (no role="menu"): un rol menu exigiría navegación con flechas. Se cierra con Escape, clic afuera o al sacar el foco. */}
        <div
          ref={contenedorRef}
          className="relative ml-auto"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setAbierto(false);
          }}
        >
          <button
            ref={botonRef}
            type="button"
            aria-expanded={abierto}
            aria-controls={menuId}
            aria-label={`Menú de usuario: ${userName}, ${userRole}`}
            onClick={() => setAbierto((v) => !v)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="w-8 h-8 text-xs rounded-full bg-primary text-primary-content inline-flex items-center justify-center font-semibold">
              {iniciales}
            </span>
            <div className="hidden sm:block leading-tight text-left">
              <div className="text-sm font-semibold">{userName}</div>
              <div className="text-white/60 text-xs">{userRole}</div>
            </div>
            <ChevronLeft
              size={12}
              aria-hidden
              className={`hidden sm:inline-block text-white/50 transition-transform ${abierto ? "rotate-90" : "-rotate-90"}`}
            />
          </button>
          <ul
            id={menuId}
            hidden={!abierto}
            className="menu absolute right-0 top-full mt-2 z-10 w-52 p-2 bg-base-100 text-base-content border border-base-300 rounded-box shadow-md"
          >
            <li>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  onLogout();
                }}
                className="text-error"
              >
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
