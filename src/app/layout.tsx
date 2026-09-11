import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";

// Onest (Google Fonts): tipografía única de toda la web, variable font.
const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIENEP",
  description: "Sistema Integral de Estudiantes con Necesidades Educativas Personalizadas",
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
