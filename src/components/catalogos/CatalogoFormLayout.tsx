"use client";

import { useRouter } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { BackButton } from "@/components/layout/BackButton";

type CatalogoFormLayoutProps = {
  titulo: string;
  // Leyenda informativa del catálogo (para qué sirve, reglas que conviene saber antes de guardar).
  leyenda: React.ReactNode;
  seccion: { icon: LucideIcon; titulo: string };
  submitLabel: string;
  guardando: boolean;
  // Error que no es de un campo puntual (403, 500, conexión): va arriba del formulario y se borra a los 3 s.
  errorGeneral: string;
  // Deshabilita el botón de guardar sin ocultarlo (ej. ITR sin catálogo de carreras cargado).
  bloquearGuardado?: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
};

// Página de alta/edición de los catálogos, con la misma estructura que InstanciaForm/RolForm: "Cancelar" arriba, título, leyenda, un fieldset y los botones abajo a la derecha.
export function CatalogoFormLayout({
  titulo,
  leyenda,
  seccion: { icon: Icon, titulo: tituloSeccion },
  submitLabel,
  guardando,
  errorGeneral,
  bloquearGuardado,
  onSubmit,
  children,
}: CatalogoFormLayoutProps) {
  const router = useRouter();

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[600px] mx-auto w-full px-4 py-5">
        <BackButton onClick={() => router.back()} label="Cancelar" />

        <h1 className="text-xl font-bold mb-1">{titulo}</h1>
        <div className="text-sm text-base-content/60 mb-4 space-y-1">{leyenda}</div>

        {errorGeneral ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-4">
            <span className="min-w-0 wrap-anywhere">{errorGeneral}</span>
          </div>
        ) : null}

        <form
          noValidate
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <fieldset className="fieldset space-y-3 p-4 rounded-box border border-base-300">
            <legend className="fieldset-legend text-sm font-semibold text-base-content mb-1 gap-1.5">
              <Icon size={15} aria-hidden className="text-primary" />
              {tituloSeccion}
            </legend>
            {children}
          </fieldset>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => router.back()} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando || bloquearGuardado}>
              {guardando ? <span className="loading loading-spinner loading-sm" /> : null}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
