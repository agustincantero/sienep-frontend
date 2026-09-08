"use client";

import { createContext, useContext } from "react";
import type { UsuarioAutenticado } from "./usuario";

// El usuario autenticado se resuelve una vez en el layout del route group (app)
// (server) y se baja por context para que cualquier componente cliente lo lea
// con useSession() sin pasarlo por props nivel a nivel.
const SessionContext = createContext<UsuarioAutenticado | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: UsuarioAutenticado;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSession(): UsuarioAutenticado {
  const user = useContext(SessionContext);
  if (!user) {
    throw new Error("useSession() debe usarse dentro de <SessionProvider> (route group (app)).");
  }
  return user;
}
