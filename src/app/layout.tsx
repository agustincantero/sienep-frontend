import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Onest (licencia OFL), tipografía única de toda la web. Autoalojada (subset latin, variable 100-900) para que el build no dependa de Google Fonts.
const onest = localFont({
  src: "./fonts/Onest-latin.woff2",
  variable: "--font-onest",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIENEP",
  description: "Sistema Integral de Estudiantes con Necesidades Educativas Personalizadas",
  applicationName: "SIENEP",
  appleWebApp: { capable: true, title: "SIENEP", statusBarStyle: "default" },
};

// Mismo gris que la TopBar (zinc-700), para que la barra de estado del celular no corte el encabezado.
export const viewport: Viewport = {
  themeColor: "#3f3f46",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-theme="light"
      className={`${onest.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
