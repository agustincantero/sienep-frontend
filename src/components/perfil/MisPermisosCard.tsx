"use client";

import { ShieldCheck } from "lucide-react";
import { useSession } from "@/lib/session-context";
import { SeccionCard } from "./SeccionCard";

// "VER_COMENTARIO_NORMAL_ESTUDIANTE" -> "Ver comentario normal estudiante". Sin agrupar por dominio a propósito: el agrupador por categoría vive en el MR de roles (lib/permisos.ts), que todavía no está en dev; cuando entre, se puede reusar acá.
function legible(nombre: string): string {
  const texto = nombre.toLowerCase().replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Permisos del funcionario en sesión (GET /auth/me), para que sepa qué puede hacer y por qué no ve ciertas pantallas. Colapsado por defecto: un administrador tiene más de cien.
export function MisPermisosCard() {
  const { rol, permisos } = useSession();
  const ordenados = [...permisos].sort((a, b) => a.localeCompare(b));

  return (
    <SeccionCard icon={ShieldCheck} titulo="Mis permisos">
      <p className="text-sm text-base-content/60">
        Los define tu rol ({rol}). Si necesitás acceso a algo que no tenés, pedíselo a un administrador.
      </p>
      {ordenados.length === 0 ? (
        <p className="text-sm text-base-content/60">Tu rol no tiene permisos asignados.</p>
      ) : (
        <details className="collapse collapse-arrow border border-base-300 rounded-box">
          <summary className="collapse-title text-sm font-medium min-h-0 py-3">
            Ver los {ordenados.length} permisos
          </summary>
          <div className="collapse-content">
            <ul className="flex flex-wrap gap-1.5">
              {ordenados.map((p) => (
                <li key={p} className="badge badge-ghost badge-sm" title={p}>
                  {legible(p)}
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </SeccionCard>
  );
}
