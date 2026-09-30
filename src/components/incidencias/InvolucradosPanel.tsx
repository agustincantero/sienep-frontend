"use client";

import { useEffect, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { addInvolucrado, listInvolucrados, removeInvolucrado, type Involucrado } from "@/lib/incidencias";
import { useSession } from "@/lib/session-context";

const NOMBRE_MAX = 30;

// El backend no expone un permiso propio de "involucrados": agregar usa EDITAR_INCIDENCIA y quitar usa DESACTIVAR_INCIDENCIA. Sin ConfirmDialog al quitar (a diferencia de MedicalReportsPanel.eliminarInforme): re-agregar el mismo nombre reactiva el registro en vez de duplicarlo, no hay nada que se pierda de verdad.
export function InvolucradosPanel({ codInstancia }: { codInstancia: number }) {
  const { permisos } = useSession();
  const puedeAgregar = permisos.includes("EDITAR_INCIDENCIA");
  const puedeQuitar = permisos.includes("DESACTIVAR_INCIDENCIA");

  const [involucrados, setInvolucrados] = useState<Involucrado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [quitandoNombre, setQuitandoNombre] = useState<string | null>(null);
  const codInstanciaRef = useRef(codInstancia);
  useEffect(() => {
    codInstanciaRef.current = codInstancia;
  }, [codInstancia]);

  function cargar() {
    const idAlPedir = codInstancia;
    listInvolucrados(idAlPedir)
      .then((res) => {
        if (codInstanciaRef.current !== idAlPedir) return;
        // El backend no filtra por estado en el GET: se listan solo los ACTIVOS acá, los INACTIVOS (ya quitados) no tienen que reaparecer.
        setInvolucrados(res.filter((inv) => inv.estado === "ACTIVO"));
        setError("");
      })
      .catch((err) => {
        if (codInstanciaRef.current !== idAlPedir) return;
        setError(apiErrorMessage(err, "No se pudieron cargar los involucrados."));
      })
      .finally(() => {
        if (codInstanciaRef.current === idAlPedir) setCargando(false);
      });
  }

  useEffect(cargar, [codInstancia]);

  async function handleAgregar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const nombreTrim = nombre.trim();
    if (!nombreTrim) return;
    // maxLength del input no alcanza para bloquear un pegado (paste) de texto mas largo.
    if (nombreTrim.length > NOMBRE_MAX) {
      setError(`Máximo ${NOMBRE_MAX} caracteres.`);
      return;
    }
    setEnviando(true);
    setError("");
    try {
      await addInvolucrado(codInstancia, nombreTrim);
      setNombre("");
      cargar();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo agregar el involucrado."));
    } finally {
      setEnviando(false);
    }
  }

  async function handleQuitar(nomInvolucrado: string) {
    setQuitandoNombre(nomInvolucrado);
    setError("");
    try {
      await removeInvolucrado(codInstancia, nomInvolucrado);
      setInvolucrados((prev) => prev.filter((inv) => inv.nomInvolucrado !== nomInvolucrado));
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo quitar el involucrado."));
    } finally {
      setQuitandoNombre(null);
    }
  }

  return (
    <div className="mt-4">
      <h6 className="text-sm font-semibold mb-2">Involucrados</h6>

      {error ? (
        <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
          <span>{error}</span>
        </div>
      ) : null}

      {cargando ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner loading-sm" />
        </div>
      ) : involucrados.length === 0 ? (
        <p className="text-base-content/60 text-sm mb-3">Todavía no hay involucrados registrados.</p>
      ) : (
        <ul className="divide-y divide-base-300 mb-3">
          {involucrados.map((inv) => (
            <li key={inv.nomInvolucrado} className="py-2 flex items-center justify-between gap-3">
              <span className="text-sm">{inv.nomInvolucrado}</span>
              {puedeQuitar ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-error"
                  disabled={quitandoNombre === inv.nomInvolucrado}
                  onClick={() => handleQuitar(inv.nomInvolucrado)}
                >
                  Quitar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {puedeAgregar ? (
        <form onSubmit={handleAgregar} noValidate className="join max-w-[360px]">
          <input
            className="input input-sm join-item w-full"
            placeholder="Nombre del involucrado"
            value={nombre}
            maxLength={NOMBRE_MAX}
            onChange={(e) => setNombre(e.target.value)}
            disabled={enviando}
          />
          <button
            type="submit"
            className="btn btn-outline btn-sm join-item gap-1"
            disabled={enviando || !nombre.trim()}
          >
            <UserPlus size={13} aria-hidden />
            Agregar
          </button>
        </form>
      ) : null}
    </div>
  );
}
