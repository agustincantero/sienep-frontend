"use client";

import { useState } from "react";
import { logout } from "@/lib/auth";
import { useSession } from "@/lib/session-context";
import { TopBar } from "./TopBar";

// Frame de toda pantalla autenticada: TopBar + contenido. El Sidebar NO va acá:
// solo aparece dentro de las secciones (ver src/app/(app)/(secciones)/layout.tsx),
// como el prototipo — /inicio no tiene sidebar.
export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useSession();
  const [saliendo, setSaliendo] = useState(false);

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
      {children}
    </div>
  );
}
