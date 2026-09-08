"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ESTUDIANTE_NAV,
  FUNCIONARIO_NAV,
  gruposVisibles,
  type NavItem,
} from "@/lib/nav-items";
import { useSession } from "@/lib/session-context";

// Tarjeta de acceso a un módulo. Toda la tarjeta es el link (patrón del
// prototipo docs/prototipo.html, LauncherCard).
function TarjetaAcceso({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      className="card bg-base-100 border border-base-content/20 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="card-body">
        <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center mb-3">
          <item.icon size={20} aria-hidden />
        </span>
        <h2 className="card-title text-base">{item.title}</h2>
        <p className="text-sm text-base-content/60">{item.desc}</p>
      </div>
    </Link>
  );
}

// Franja horaria (convención rioplatense): 05–11:59 días, 12–19:59 tardes,
// 20–04:59 noches.
function saludoPorHora(hora: number): string {
  if (hora >= 5 && hora < 12) return "Buenos días";
  if (hora >= 12 && hora < 20) return "Buenas tardes";
  return "Buenas noches";
}

const noSuscribir = () => () => {};

// El server no conoce la hora local del usuario -> "Hola" en el HTML inicial;
// el cliente ya resuelve la franja según su reloj. useSyncExternalStore hace
// que React acepte los dos valores sin warning de hidratación.
function useSaludo(): string {
  const hora = useSyncExternalStore(
    noSuscribir,
    () => new Date().getHours(),
    () => null,
  );
  return hora === null ? "Hola" : saludoPorHora(hora);
}

export function InicioDashboard() {
  const user = useSession();
  const primerNombre = user.nombre.split(" ")[0];
  const saludo = useSaludo();

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[980px] mx-auto w-full px-4 py-5">
        <h1 className="text-2xl font-bold mb-1">
          {saludo}, {primerNombre}
        </h1>

        {user.tipo === "ESTUDIANTE" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ESTUDIANTE_NAV.map((item) => (
              <TarjetaAcceso key={item.key} item={item} />
            ))}
          </div>
        ) : (
          <ModulosFuncionario permisos={user.permisos} />
        )}
      </div>
    </div>
  );
}

function ModulosFuncionario({ permisos }: { permisos: string[] }) {
  const grupos = gruposVisibles(FUNCIONARIO_NAV, permisos);

  if (grupos.length === 0) {
    return (
      <p className="text-base-content/60">
        Tu usuario no tiene acceso a ningún módulo todavía. Contactá al administrador.
      </p>
    );
  }

  return (
    <>
      {grupos.map((group) => (
        <div key={group.label}>
          <h2 className="uppercase text-base-content/60 text-xs font-bold mt-4 mb-2 tracking-wide">
            {group.label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {group.items.map((item) => (
              <TarjetaAcceso key={item.key} item={item} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
