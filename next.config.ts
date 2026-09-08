import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Rutas de auth renombradas a inglés. Red de seguridad para enlaces viejos
      // (mails de recuperación ya enviados, bookmarks). El link del mail lo arma
      // el backend: una vez actualizado allá, estos redirects se pueden quitar.
      // La query string (?token=…) se preserva sola.
      { source: "/olvide-contrasenia", destination: "/forgot-password", permanent: false },
      { source: "/restablecer-contrasenia", destination: "/reset-password", permanent: false },
    ];
  },
};

export default nextConfig;
