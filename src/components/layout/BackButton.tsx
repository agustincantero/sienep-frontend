"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type BackButtonProps = {
  href: string;
  label?: string;
};

export function BackButton({ href, label = "Volver al inicio" }: BackButtonProps) {
  return (
    <Link href={href} className="btn btn-link btn-sm pl-0 no-underline inline-flex items-center gap-1 mb-3">
      <ChevronLeft size={14} aria-hidden />
      {label}
    </Link>
  );
}
