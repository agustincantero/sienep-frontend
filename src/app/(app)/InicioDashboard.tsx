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

// Tarjeta de acceso a un módulo. Toda la tarjeta es el link (patrón del prototipo docs/prototipo.html, LauncherCard).
function TarjetaAcceso({ item, nivelTitulo }: { item: NavItem; nivelTitulo: "h2" | "h3" }) {
  const Titulo = nivelTitulo;
  return (
    <Link
      href={item.href}
      className="card bg-base-100 border border-base-content/30 hover:border-primary/40 transition-colors"
    >
      <div className="card-body">
        <div className="flex items-center gap-2 mb-1">
          <item.icon size={20} className="text-primary shrink-0" aria-hidden />
          <Titulo className="card-title text-base">{item.title}</Titulo>
        </div>
        <p className="text-sm text-base-content/70">{item.desc}</p>
      </div>
    </Link>
  );
}

// Franja horaria: 05–11:59 días, 12–19:59 tardes, 20–04:59 noches.
function saludoPorHora(hora: number): string {
  if (hora >= 5 && hora < 12) return "Buenos días";
  if (hora >= 12 && hora < 20) return "Buenas tardes";
  return "Buenas noches";
}

const noSuscribir = () => () => {};

// El server no conoce la hora local del usuario -> "Hola" en el HTML inicial; el cliente ya resuelve la franja según su reloj. useSyncExternalStore hace que React acepte los dos valores sin warning de hidratación.
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
      <div className="max-w-[980px] mx-auto w-full px-4 py-5 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">
          {saludo}, {primerNombre}
        </h1>

        {user.tipo === "ESTUDIANTE" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ESTUDIANTE_NAV.map((item) => (
              <TarjetaAcceso key={item.key} item={item} nivelTitulo="h2" />
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
      <p className="text-base-content/70">
        Tu usuario no tiene acceso a ningún módulo todavía. Contactá al administrador.
      </p>
    );
  }

  return (
    <>
      {grupos.map((group) => (
        <div key={group.label}>
          <h2 className="uppercase text-base-content/70 text-xs font-bold mb-2 tracking-wide">
            {group.label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {group.items.map((item) => (
              <TarjetaAcceso key={item.key} item={item} nivelTitulo="h3" />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
