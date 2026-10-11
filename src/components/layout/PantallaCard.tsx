// Contenedor común de las pantallas de estado (error y carga): misma tarjeta que SinPermiso en las secciones y que SessionUnavailable en auth.
export function PantallaCard({
  variante,
  children,
}: {
  variante: "seccion" | "auth";
  children: React.ReactNode;
}) {
  const card = (
    <div
      className={
        variante === "auth"
          ? "card bg-base-100 shadow-lg border border-base-300"
          : "card bg-base-100 border border-base-300"
      }
    >
      <div className="card-body items-center text-center gap-2">{children}</div>
    </div>
  );

  if (variante === "auth") return card;

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[720px] mx-auto w-full px-4 py-5">{card}</div>
    </div>
  );
}
