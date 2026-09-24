"use client";

import { useEffect, useState } from "react";
import { logout } from "@/lib/auth";
import { useSession } from "@/lib/session-context";
import { SesionExpiradaModal } from "./SesionExpiradaModal";
import { TopBar } from "./TopBar";

// Frame de toda pantalla autenticada: TopBar + contenido. El Sidebar NO va acá:
// solo aparece dentro de las secciones (ver src/app/(app)/(secciones)/layout.tsx),
// como el prototipo — el dashboard en / no tiene sidebar.
export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useSession();
  const [saliendo, setSaliendo] = useState(false);

  // Con "atrás" el navegador puede restaurar la página desde el back/forward cache: una copia en memoria que no vuelve a pedirse al servidor, así que el layout de (app) no llega a verificar la sesión y tras un logout se seguían viendo (y usando) las pantallas anteriores. Si la página vino de ahí, se recarga: con sesión se ve igual que antes, sin sesión el layout redirige a /login.
  useEffect(() => {
    function alMostrar(e: PageTransitionEvent) {
      if (e.persisted) window.location.reload();
    }
    window.addEventListener("pageshow", alMostrar);
    return () => window.removeEventListener("pageshow", alMostrar);
  }, []);

  async function handleLogout() {
    if (saliendo) return;
    setSaliendo(true);
    try {
      await logout();
    } finally {
      // Recarga completa (no el router SPA) para tirar todo el estado en memoria, mismo criterio que el 401 de sesión muerta en src/lib/api.ts.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- ver comentario de arriba
      window.location.href = "/login";
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        userName={`${user.nombre} ${user.apellido}`}
        userRole={user.rol}
        onLogout={handleLogout}
      />
      <main className="flex grow min-h-0">{children}</main>
      <SesionExpiradaModal />
    </div>
  );
}
