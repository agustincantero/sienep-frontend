"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { listCarreras, type Carrera } from "@/lib/carreras";
import { compararTexto, esNombreRepetido } from "@/lib/catalogos";
import { hrefListado } from "@/lib/catalogos-tabs";
import { createGroup, updateGroup, type Group } from "@/lib/groups";
import { useSession } from "@/lib/session-context";
import { CatalogoFormLayout } from "./CatalogoFormLayout";
import { Campo } from "./Campo";
import { useMensajeTemporal } from "./useCatalogo";

const MAX_NOMBRE = 60;
// GrupoService.validarGeneracion: mayor a 1900 y no posterior al año en curso.
const GENERACION_MIN = 1901;

type FormState = { nombre: string; idCarrera: string; generacion: string };
type Errores = Partial<Record<keyof FormState, string>>;

export function GrupoForm({ grupo }: { grupo?: Group }) {
  const router = useRouter();
  const { permisos } = useSession();
  const anioActual = new Date().getFullYear();

  const [form, setForm] = useState<FormState>({
    nombre: grupo?.nomGrupo ?? "",
    idCarrera: grupo ? String(grupo.idCarrera) : "",
    generacion: String(grupo?.generacion ?? anioActual),
  });
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useMensajeTemporal();
  const [guardando, setGuardando] = useState(false);

  // Solo hace falta en el alta (la carrera no se edita). Solo ACTIVAS: GrupoService.crear rechaza una inactiva.
  const [carreras, setCarreras] = useState<Carrera[] | null>(null);
  const [errorCarreras, setErrorCarreras] = useState("");
  const puedeVerCarreras = permisos.includes("VER_CARRERAS");

  useEffect(() => {
    if (grupo || !puedeVerCarreras) return;
    listCarreras("ACTIVO")
      .then((res) => setCarreras([...res].sort((a, b) => compararTexto(a.nomCarrera, b.nomCarrera))))
      .catch((err) => setErrorCarreras(apiErrorMessage(err, "No se pudo cargar el catálogo de carreras.")));
  }, [grupo, puedeVerCarreras]);

  const avisoCarreras = puedeVerCarreras ? errorCarreras : "Para elegir la carrera necesitás el permiso de ver carreras.";

  function campo(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }));
  }

  function validar(): Errores {
    const e: Errores = {};
    const nombre = form.nombre.trim();
    if (!nombre) e.nombre = "El nombre es obligatorio.";
    else if (nombre.length > MAX_NOMBRE) e.nombre = `El nombre no puede superar los ${MAX_NOMBRE} caracteres.`;
    if (!grupo && !form.idCarrera) e.idCarrera = "Elegí la carrera del grupo.";
    const generacion = Number(form.generacion);
    if (!form.generacion.trim() || !Number.isInteger(generacion)) {
      e.generacion = "Ingresá el año de generación.";
    } else if (generacion < GENERACION_MIN || generacion > anioActual) {
      e.generacion = `La generación tiene que estar entre ${GENERACION_MIN} y ${anioActual}.`;
    }
    return e;
  }

  async function guardar() {
    setErrorGeneral("");
    const e = validar();
    setErrores(e);
    const primero = (Object.keys(e) as (keyof FormState)[]).find((k) => e[k]);
    if (primero) {
      document.getElementById(`grupo-${primero}`)?.focus();
      return;
    }
    const nombre = form.nombre.trim();
    const generacion = Number(form.generacion);
    setGuardando(true);
    try {
      if (grupo) {
        await updateGroup(grupo.idGrupo, { nomGrupo: nombre, generacion });
      } else {
        await createGroup({ nomGrupo: nombre, idCarrera: Number(form.idCarrera), generacion });
      }
      router.push(hrefListado("grupos", `Grupo ${grupo ? "actualizado" : "creado"}: ${nombre}.`));
    } catch (err) {
      // El backend no deja dos grupos ACTIVOS con el mismo nombre en la misma carrera y generación.
      if (esNombreRepetido(err)) {
        setErrores((prev) => ({ ...prev, nombre: "Ya hay un grupo activo con ese nombre en esa carrera y generación." }));
      } else {
        setErrorGeneral(apiErrorMessage(err, "No se pudo guardar el grupo. Probá de nuevo."));
      }
      setGuardando(false);
    }
  }

  return (
    <CatalogoFormLayout
      titulo={grupo ? "Editar grupo" : "Nuevo grupo"}
      leyenda={
        <>
          <p>Cada grupo pertenece a una carrera y a una generación, y es lo que se le asigna a cada estudiante.</p>
          <p>La carrera no se puede cambiar después de crear el grupo. No puede haber dos grupos activos con el mismo nombre en la misma carrera y generación.</p>
        </>
      }
      seccion={{ icon: Users, titulo: "Datos del grupo" }}
      submitLabel={grupo ? "Guardar cambios" : "Crear grupo"}
      guardando={guardando}
      errorGeneral={errorGeneral}
      // Sin catálogo de carreras no hay carrera que elegir en el alta.
      bloquearGuardado={!grupo && carreras == null}
      onSubmit={guardar}
    >
      <Campo
        id="grupo-nombre"
        label="Nombre"
        value={form.nombre}
        onChange={(v) => campo("nombre", v)}
        error={errores.nombre}
        maxLength={MAX_NOMBRE}
        disabled={guardando}
        required
      />

      {grupo ? (
        // GrupoUpdateDTO no acepta idCarrera: se muestra deshabilitada (no oculta), igual que el estudiante en InstanciaForm.
        <label className="floating-label">
          <input id="grupo-carrera" className="input w-full" value={grupo.nomCarrera} disabled />
          <span>Carrera</span>
        </label>
      ) : avisoCarreras ? (
        // Mismo par ámbar que RolForm: el --color-warning de daisyUI no llega a 4.5:1 como texto.
        <div role="alert" className="alert bg-amber-50 text-amber-800 border border-amber-200 text-sm">
          <span>{avisoCarreras}</span>
        </div>
      ) : (
        <div>
          <label className="floating-label">
            <select
              id="grupo-idCarrera"
              className={`select w-full${errores.idCarrera ? " select-error" : ""}`}
              value={form.idCarrera}
              onChange={(e) => campo("idCarrera", e.target.value)}
              disabled={guardando || carreras == null}
              aria-invalid={errores.idCarrera ? true : undefined}
              aria-describedby={errores.idCarrera ? "grupo-idCarrera-error" : undefined}
              required
            >
              <option value="">{carreras == null ? "Cargando carreras…" : "Seleccioná una carrera"}</option>
              {(carreras ?? []).map((c) => (
                <option key={c.idCarrera} value={c.idCarrera}>
                  {c.nomCarrera}
                </option>
              ))}
            </select>
            <span>Carrera *</span>
          </label>
          {errores.idCarrera ? (
            <p id="grupo-idCarrera-error" className="mt-1 text-xs text-error">
              {errores.idCarrera}
            </p>
          ) : carreras && carreras.length === 0 ? (
            <p className="mt-1 text-xs text-base-content/60">No hay carreras activas. Creá una carrera primero.</p>
          ) : null}
        </div>
      )}

      <Campo
        id="grupo-generacion"
        label="Generación"
        type="number"
        min={GENERACION_MIN}
        max={anioActual}
        value={form.generacion}
        onChange={(v) => campo("generacion", v)}
        error={errores.generacion}
        ayuda={`Año de ingreso, entre ${GENERACION_MIN} y ${anioActual}.`}
        disabled={guardando}
        required
      />
    </CatalogoFormLayout>
  );
}
