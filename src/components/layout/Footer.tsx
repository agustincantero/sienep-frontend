// Footer del chrome deslogueado (pantallas de auth y 404). El área autenticada no lo usa. El año se resuelve en cada build (Server Component).
export function Footer() {
  return (
    <footer className="mt-auto bg-neutral py-4 text-neutral-content">
      <div className="w-full px-4 text-sm text-neutral-content/80">
        Copyright © SIENEP {new Date().getFullYear()}
      </div>
    </footer>
  );
}
