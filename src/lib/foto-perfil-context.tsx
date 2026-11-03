"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useSession } from "./session-context";
import { getMiPerfil } from "./students";

// Foto del usuario en sesión, compartida entre el TopBar y "Mi perfil" para que, al cambiarla, se actualice en los dos lados sin recargar. El estudiante la pide a su perfil; el funcionario arranca con la urlFoto que ya trae GET /auth/me.
type FotoPerfil = {
  // Ruta para el proxy (/estudiantes/{id}/foto o /funcionarios/{id}/foto), ya con el sufijo de versión si se cambió en esta sesión.
  urlFoto: string | null;
  actualizarFoto: (urlFoto: string | null) => void;
};

const FotoPerfilContext = createContext<FotoPerfil | null>(null);

export function FotoPerfilProvider({ children }: { children: React.ReactNode }) {
  const { tipo, urlFoto: urlFotoSesion } = useSession();
  // Sin foto en el TopBar no se rompe nada: quedan las iniciales. Por eso el error de carga no se muestra (mensajeError vacío).
  const { data: urlFotoEstudiante, setData: setUrlFotoEstudiante } = useApi(() => getMiPerfil().then((perfil) => perfil.urlFoto), [tipo], {
    inicial: null as string | null,
    mensajeError: "",
    esperar: tipo !== "ESTUDIANTE",
  });
  const [urlFotoFuncionario, setUrlFotoFuncionario] = useState<string | null>(urlFotoSesion ?? null);
  const esEstudiante = tipo === "ESTUDIANTE";
  const urlFoto = esEstudiante ? urlFotoEstudiante : urlFotoFuncionario;

  // La URL no cambia al reemplazar la foto (/estudiantes/{id}/foto o /funcionarios/{id}/foto): sin el ?v=, el navegador seguiría mostrando la vieja desde su caché.
  const actualizarFoto = useCallback((nueva: string | null) => {
    const versionada = nueva ? `${nueva}?v=${Date.now()}` : null;
    if (esEstudiante) setUrlFotoEstudiante(versionada);
    else setUrlFotoFuncionario(versionada);
  }, [esEstudiante, setUrlFotoEstudiante]);

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
