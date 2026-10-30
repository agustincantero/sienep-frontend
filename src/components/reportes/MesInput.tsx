"use client";

import { useState, useSyncExternalStore } from "react";
import { MES_VALIDO } from "@/lib/reportes-filtros";

// Firefox y Safari de escritorio no soportan type="month" y lo degradan a un campo de texto vacío y sin pista.
function soportaMes() {
  const input = document.createElement("input");
  input.type = "month";
  return input.type === "month";
}

const sinSuscripcion = () => () => {};

type MesInputProps = {
  value: string;
  onChange: (valor: string) => void;
  min?: string;
  max?: string;
};

// Selector de mes AAAA-MM. Usa el nativo y, donde no existe, un campo de texto que solo informa un mes completo y válido (o vacío).
export function MesInput({ value, onChange, min, max }: MesInputProps) {
  const nativo = useSyncExternalStore(sinSuscripcion, soportaMes, () => true);
  // Texto a medio escribir en el campo de respaldo (null = se muestra el valor ya aplicado).
  const [borrador, setBorrador] = useState<string | null>(null);

  if (nativo) {
    return <input type="month" className="input input-sm" value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <input
      type="text"
      className="input input-sm"
      value={borrador ?? value}
      placeholder="AAAA-MM"
      inputMode="numeric"
      maxLength={7}
      autoComplete="off"
      onChange={(e) => {
        const texto = e.target.value.trim();
        if (texto === "" || MES_VALIDO.test(texto)) {
          setBorrador(null);
          onChange(texto);
        } else {
          setBorrador(texto);
        }
      }}
      onBlur={() => setBorrador(null)}
    />
  );
}
