type AuthCardProps = {
  title: string;
  description?: string;
  // Nivel del título de la card. Por defecto h1 (recuperación, /ayuda, /legal:
  // la card es el encabezado de la página). En el login la página ya tiene su
  // propio h1 de bienvenida, así que ahí el título de la card baja a h2.
  titleAs?: "h1" | "h2";
  children: React.ReactNode;
};

// Card blanca centrada de las pantallas de autenticación (login, recuperación). El chrome de alrededor (fondo, header UTEC, footer) lo pone src/app/(auth)/layout.tsx. Ver docs/prototipo.html.
export function AuthCard({ title, description, titleAs: Heading = "h1", children }: AuthCardProps) {
  return (
    <div className="card w-full border border-base-300 bg-base-100 shadow-lg">
      <div className="card-body">
        <Heading className="text-center text-3xl font-light">{title}</Heading>
        {description ? (
          <p className="text-sm leading-relaxed text-base-content/70">{description}</p>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
