"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession } from "./session-context";
import { getMiPerfil } from "./students";

// Foto del usuario en sesión, compartida entre el TopBar y "Mi perfil" para que, al cambiarla, se actualice en los dos lados sin recargar. Solo los estudiantes tienen foto (Funcionario no la tiene en el modelo): para un funcionario queda siempre null y no se pide nada.
type FotoPerfil = {
  // Ruta para el proxy (/estudiantes/{id}/foto), ya con el sufijo de versión si se cambió en esta sesión.
  urlFoto: string | null;
  actualizarFoto: (urlFoto: string | null) => void;
};

const FotoPerfilContext = createContext<FotoPerfil | null>(null);

export function FotoPerfilProvider({ children }: { children: React.ReactNode }) {
  const { tipo } = useSession();
  const [urlFoto, setUrlFoto] = useState<string | null>(null);

  useEffect(() => {
    if (tipo !== "ESTUDIANTE") return;
    let cancelado = false;
    getMiPerfil()
      .then((perfil) => {
        if (!cancelado) setUrlFoto(perfil.urlFoto);
      })
      // Sin foto en el TopBar no se rompe nada: quedan las iniciales.
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [tipo]);

  // La URL no cambia al reemplazar la foto (/estudiantes/{id}/foto): sin el ?v=, el navegador seguiría mostrando la vieja desde su caché.
  const actualizarFoto = useCallback((nueva: string | null) => {
    setUrlFoto(nueva ? `${nueva}?v=${Date.now()}` : null);
  }, []);

  return (
    <FotoPerfilContext.Provider value={{ urlFoto, actualizarFoto }}>{children}</FotoPerfilContext.Provider>
  );
}

export function useFotoPerfil(): FotoPerfil {
  const ctx = useContext(FotoPerfilContext);
  if (!ctx) {
    throw new Error("useFotoPerfil() debe usarse dentro de <FotoPerfilProvider> (ver AppShell).");
  }
  return ctx;
}
