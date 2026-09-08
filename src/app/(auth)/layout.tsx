// Chrome de las pantallas de autenticación (fuera del AppShell de funcionario):
// fondo primary a pantalla completa, card centrada y footer.
// Ver docs/prototipo.html (rama authView de App()).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="py-4 bg-neutral text-neutral-content mt-auto">
        <div className="w-full px-4 text-sm text-neutral-content/60">
          Copyright © SIENEP 2026
        </div>
      </footer>
    </div>
  );
}
