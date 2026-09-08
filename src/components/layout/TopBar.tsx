"use client";

import { ChevronLeft } from "lucide-react";
import { Logo } from "./Logo";

type TopBarProps = {
  userName: string;
  userRole: string;
  onLogout: () => void;
};

export function TopBar({ userName, userRole, onLogout }: TopBarProps) {
  const iniciales = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <nav className="navbar bg-neutral-700 text-white">
      <div className="flex items-center justify-between w-full px-4 flex-wrap gap-2">
        <span className="inline-flex items-center h-7">
          <Logo />
        </span>

        <div className="dropdown dropdown-end ml-auto">
          <div tabIndex={0} role="button" className="flex items-center gap-2 cursor-pointer">
            <span className="w-8 h-8 text-xs rounded-full bg-primary/10 text-primary inline-flex items-center justify-center font-semibold">
              {iniciales}
            </span>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-semibold">{userName}</div>
              <div className="text-white/60 text-xs">{userRole}</div>
            </div>
            <ChevronLeft size={12} aria-hidden className="hidden sm:inline-block -rotate-90 text-white/50" />
          </div>
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 border border-base-300 rounded-box z-10 w-52 p-2 shadow-md mt-2">
            <li>
              <a onClick={onLogout} className="text-error">
                Cerrar sesión
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
