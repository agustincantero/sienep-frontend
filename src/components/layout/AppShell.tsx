"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { useSession } from "@/lib/session-context";
import { TopBar } from "./TopBar";

// Frame de toda pantalla autenticada: TopBar + contenido. El Sidebar NO va acá:
// solo aparece dentro de las secciones (ver src/app/(app)/(secciones)/layout.tsx),
// como el prototipo — /inicio no tiene sidebar.
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useSession();
  const [saliendo, setSaliendo] = useState(false);

  async function handleLogout() {
    if (saliendo) return;
    setSaliendo(true);
    try {
      await logout();
    } finally {
      router.replace("/login");
      router.refresh();
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
