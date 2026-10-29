import { useEffect, useRef } from "react";

// Devuelve un ref para el aviso (error o éxito) de una pantalla y hace scroll hasta él cuando aparece, porque las acciones de las filas pueden estar muy abajo y el aviso arriba, fuera de la vista.
export function useAvisoVisible<T extends HTMLElement>(mensaje: string) {
  const ref = useRef<T>(null);

  // Las acciones limpian el mensaje antes de pedir (setError("")), así que un mismo mensaje repetido también vuelve a disparar el efecto.
  useEffect(() => {
    if (!mensaje) return;
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView({ behavior: sinMovimiento ? "auto" : "smooth", block: "center" });
  }, [mensaje]);

  return ref;
}
