import { cloneElement, isValidElement } from "react";

// floating-label de daisyUI 5: el input va PRIMERO (con placeholder propio),
// el <span> con la etiqueta después. `fieldKey` se usa como id del control
// (así el formulario puede enfocar el primer campo inválido con
// document.getElementById) y arma el id del <p> de error para
// aria-describedby — un lector de pantalla que tabula a un campo inválido
// necesita esa asociación, no alcanza con el color rojo.
// `required` agrega el asterisco a la etiqueta, igual que en los formularios de roles y catálogos.
export function Field({
  label,
  error,
  fieldKey,
  required,
  children,
}: {
  label: string;
  error?: string;
  fieldKey: string;
  required?: boolean;
  children: React.ReactElement;
}) {
  const errorId = `${fieldKey}-error`;
  // Con el campo vacío y sin foco, floating-label oculta el <span> y lo que se ve es el placeholder: el
  // asterisco tiene que ir también ahí, o el obligatorio recién se nota al enfocar o escribir.
  const placeholder = isValidElement(children)
    ? (children.props as Record<string, unknown>).placeholder
    : undefined;
  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id: fieldKey,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
        ...(required && typeof placeholder === "string" ? { placeholder: `${placeholder} *` } : {}),
      })
    : children;

  return (
    <div>
      <label className="floating-label">
        {control}
        <span>
          {label}
          {required ? " *" : ""}
        </span>
      </label>
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
