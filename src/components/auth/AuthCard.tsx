type AuthCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

// Card blanca centrada de las pantallas de autenticación (login, recuperación).
// El chrome de alrededor (fondo primary, footer) lo pone src/app/(auth)/layout.tsx.
// Ver docs/prototipo.html (LoginScreen / PasswordScreen / RestablecerContraseniaScreen).
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="card bg-base-100 shadow-lg border border-base-300">
      <div className="px-6 pt-6">
        <h1 className="text-center font-light text-3xl my-4">{title}</h1>
      </div>
      <div className="card-body pt-2">
        {description ? (
          <p className="text-sm mb-3 text-base-content/60">{description}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
