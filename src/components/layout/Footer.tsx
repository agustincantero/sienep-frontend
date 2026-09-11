// Footer del chrome deslogueado (pantallas de auth y 404). El área autenticada no lo usa. El año se resuelve en cada build (Server Component).
// El nombre completo se oculta antes de sm: en una pantalla angosta partía en 2-3 líneas y quedaba desalineado contra el copyright (con sm+ hay lugar de sobra para las dos cosas en una fila).
export function Footer() {
  return (
    <footer className="footer sm:footer-horizontal justify-items-center text-center sm:justify-items-start sm:justify-between sm:text-left mt-auto bg-neutral px-4 py-4 text-sm text-neutral-content/80">
      <span>Copyright © SIENEP {new Date().getFullYear()}</span>
      <span className="hidden sm:inline">
        Sistema Integral de Estudiantes con Necesidades Educativas Personalizadas
      </span>
    </footer>
  );
}
