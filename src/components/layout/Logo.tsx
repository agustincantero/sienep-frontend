import Image from "next/image";

const VARIANT_SRC = {
  blanco: "/logo-sienep-blanco.svg",
  negro: "/logo-sienep-negro.svg",
} as const;

type LogoProps = {
  variant?: keyof typeof VARIANT_SRC;
  className?: string;
};

// Isotipo textual "SIENEP" — archivos reales en public/, provistos por diseño
// (ver docs/logotipo_sienep_blanco.svg y docs/logotipo_sienep_negro.svg).
export function Logo({ variant = "blanco", className }: LogoProps) {
  return (
    <Image
      src={VARIANT_SRC[variant]}
      alt="SIENEP"
      width={265}
      height={40}
      className={className ?? "h-full w-auto"}
      priority
    />
  );
}
