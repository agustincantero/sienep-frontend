// Mismo formato que el Dato de StudentProfile (etiqueta + valor, "—" si está vacío).
export function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-base-300 flex flex-wrap gap-x-4 text-sm">
      <span className="text-base-content/60 w-40 shrink-0">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
