// Fila etiqueta/valor de una ficha, con el mismo estilo que las filas de la ficha de estudiante (StudentProfile). Copia local para no tocar ese archivo.
export function DatoFicha({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="py-2 border-b border-base-300 flex flex-wrap gap-x-4 select-none cursor-default">
            <span className="text-base-content/70 w-40 shrink-0">{label}</span>
            <span className="font-medium">{value || "—"}</span>
        </div>
    );
}
