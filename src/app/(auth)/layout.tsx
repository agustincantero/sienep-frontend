// Chrome de las pantallas de autenticación (fuera del AppShell de funcionario):
// fondo primary a pantalla completa, card centrada y footer.
// Ver docs/prototipo.html (rama authView de App()).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-primary">
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="mt-auto bg-neutral py-4 text-neutral-content">
        <div className="w-full px-4 text-sm text-neutral-content/80">
          Copyright © SIENEP 2026
        </div>
      </footer>
    </div>
  );
}
