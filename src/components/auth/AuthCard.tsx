type AuthCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

// Card blanca centrada de las pantallas de autenticación (login, recuperación). El chrome de alrededor (fondo primary, logo, footer) lo pone src/app/(auth)/layout.tsx. Ver docs/prototipo.html.
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="card w-full border border-base-300 bg-base-100 shadow-lg">
      <div className="card-body">
        <h1 className="text-center text-3xl font-light">{title}</h1>
        {description ? (
          <p className="text-sm leading-relaxed text-base-content/70">{description}</p>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
