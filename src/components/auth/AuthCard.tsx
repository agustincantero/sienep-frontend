"use client";

import { useEffect, useRef } from "react";

type AuthCardProps = {
  title: string;
  description?: string;
  focusOnMount?: boolean;
  children: React.ReactNode;
};

// Card blanca centrada de las pantallas de autenticación (login, recuperación). El chrome de alrededor (fondo primary, logo, footer) lo pone AuthLayout.tsx. Ver docs/prototipo.html.
export function AuthCard({ title, description, focusOnMount, children }: AuthCardProps) {
  const tituloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) tituloRef.current?.focus();
  }, [focusOnMount]);

  return (
    <div className="card w-full border border-base-300 bg-base-100 shadow-lg">
      <div className="card-body">
        <h1
          ref={tituloRef}
          tabIndex={focusOnMount ? -1 : undefined}
          className="text-center text-3xl font-light focus:outline-none"
        >
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-relaxed text-base-content/70">{description}</p>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
