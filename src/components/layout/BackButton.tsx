"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// O navega a un href, o ejecuta un onClick (ej. "Cancelar" con router.back() en los formularios).
type BackButtonProps = { label?: string } & (
  | { href: string; onClick?: never }
  | { onClick: () => void; href?: never }
);

const CLASES = "btn btn-link btn-sm pl-0 no-underline inline-flex items-center gap-1 mb-3 text-sky-700";

export function BackButton({ href, onClick, label = "Volver al inicio" }: BackButtonProps) {
  const contenido = (
    <>
      <ChevronLeft size={14} aria-hidden />
      {label}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={CLASES} onClick={onClick}>
        {contenido}
      </button>
    );
  }

  return (
    <Link href={href} className={CLASES}>
      {contenido}
    </Link>
  );
}
