import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP sin nonces (con nonces habría que renderizar todo dinámico vía proxy.ts). 'unsafe-inline' hace falta por los scripts de arranque de Next y por los style="..." que emite next/image con `fill` (los nonces no cubren atributos style). El resto cierra orígenes: solo Google Identity Services (accounts.google.com/gsi/) puede cargarse de afuera, y el navegador solo habla con este mismo origen (/api/*).
// En dev React necesita 'unsafe-eval' y el hot reload usa WebSocket; upgrade-insecure-requests solo va en producción porque en http://localhost rompería los recursos.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://accounts.google.com/gsi/client`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws://localhost:*" : ""} https://accounts.google.com/gsi/`,
  "frame-src https://accounts.google.com/gsi/",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Respaldo de frame-ancestors para navegadores viejos.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
      // El CSP va solo en las páginas: /api/* devuelve JSON y archivos (informes médicos en PDF, fotos), donde no aporta y un object-src 'none' puede romper el visor de PDF del navegador.
      {
        source: "/((?!api(?:/|$)).*)",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
      // Va después de la regla general a propósito: la última entrada que setea la misma clave gana. La URL de esta pantalla lleva el token de recuperación, no debe viajar en ningún Referer.
      {
        source: "/reset-password",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
