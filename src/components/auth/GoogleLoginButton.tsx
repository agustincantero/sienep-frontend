"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ApiError } from "@/lib/api";
import { loginWithGoogle } from "@/lib/auth";
import { GoogleIcon } from "./GoogleIcon";

// OAuth Client ID de Google (valor público; el mismo que verifica el backend).
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type GoogleCredentialResponse = { credential?: string };

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      width?: number;
      locale?: string;
    },
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

type GoogleLoginButtonProps = {
  onSuccess: () => void;
  onError: (message: string) => void;
};

// Botón "Iniciar sesión con Google" con el diseño del prototipo (daisyUI
// btn-outline + GoogleIcon). El flujo de ID token de Google Identity Services
// obliga a usar el botón que renderiza su SDK, así que se lo superpone invisible
// sobre el botón visual: el usuario ve el nuestro, el click cae en el de Google,
// y en el callback llega el ID token (credential) que mandamos a POST /auth/google.
export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gisRef = useRef<HTMLDivElement>(null);
  const anchoRef = useRef(0);
  const cbRef = useRef({ onSuccess, onError });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cbRef.current = { onSuccess, onError };
  }, [onSuccess, onError]);

  const handleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      cbRef.current.onError("Google no devolvió credenciales. Intentá de nuevo.");
      return;
    }
    setCargando(true);
    try {
      await loginWithGoogle(response.credential);
      cbRef.current.onSuccess();
    } catch (err) {
      cbRef.current.onError(
        err instanceof ApiError ? err.message : "No se pudo iniciar sesión con Google.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  const pintarBotonGoogle = useCallback(() => {
    if (!CLIENT_ID || !window.google || !gisRef.current || anchoRef.current === 0) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredential,
    });
    gisRef.current.replaceChildren();
    window.google.accounts.id.renderButton(gisRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      // GIS solo acepta 200–400 px; se mide el ancho real del botón visual.
      width: Math.min(400, Math.max(200, Math.round(anchoRef.current))),
      locale: "es",
    });
  }, [handleCredential]);

  // Mantener el botón de Google del mismo ancho que el visual.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const medir = () => {
      const ancho = el.getBoundingClientRect().width;
      if (ancho && ancho !== anchoRef.current) {
        anchoRef.current = ancho;
        pintarBotonGoogle();
      }
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pintarBotonGoogle]);

  // Sin Client ID no se puede completar el flujo: botón visible pero deshabilitado.
  if (!CLIENT_ID) {
    return (
      <div>
        <button
          type="button"
          className="btn btn-outline w-full gap-2 normal-case"
          disabled
        >
          <GoogleIcon />
          Iniciar sesión con Google
        </button>
        <p className="text-xs text-base-content/50 mt-1">
          Falta configurar <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="group relative w-full rounded-field focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
    >
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={pintarBotonGoogle}
        onLoad={pintarBotonGoogle}
      />
      {/* Visual: el botón del prototipo. No recibe clicks (los toma el de Google). */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="btn btn-outline w-full gap-2 normal-case pointer-events-none transition-colors group-hover:bg-base-200"
      >
        <GoogleIcon />
        {cargando ? "Conectando…" : "Iniciar sesión con Google"}
      </button>
      {/* Real: el botón de Google Identity Services, transparente, encima. */}
      <div
        ref={gisRef}
        className="absolute inset-0 flex justify-center overflow-hidden opacity-0"
        aria-busy={cargando}
      />
    </div>
  );
}
