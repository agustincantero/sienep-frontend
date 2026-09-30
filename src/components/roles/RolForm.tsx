"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, ShieldAlert, Tag } from "lucide-react";
import { ApiError, apiErrorMessage } from "@/lib/api";
import { agruparPermisos, listPermisos, type Permiso } from "@/lib/permisos";
import { createRole, normalizarNombreRol, updateRole, type Rol } from "@/lib/roles";
import { useSession } from "@/lib/session-context";

type FormState = {
  nombre: string;
  descripcion: string;
  permisosIds: number[];
};

function estadoInicial(rol?: Rol): FormState {
  return {
    nombre: rol?.nombre ?? "",
    descripcion: rol?.descripcion ?? "",
    permisosIds: rol?.permisos.map((p) => p.idPermiso) ?? [],
  };
}

type RolFormProps = { mode: "crear" } | { mode: "editar"; rolId: number; rol: Rol };

export function RolForm(props: RolFormProps) {
  const router = useRouter();
  const esEdicion = props.mode === "editar";
  const { permisos: misPermisos } = useSession();

  const [form, setForm] = useState<FormState>(() => estadoInicial(esEdicion ? props.rol : undefined));
  const [catalogo, setCatalogo] = useState<Permiso[]>([]);
  const [catalogoError, setCatalogoError] = useState("");
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const errorGeneralRef = useRef<HTMLDivElement>(null);

  // El banner puede quedar fuera de la vista si el usuario ya scrolleó hasta la lista de permisos (la sección más larga del form) antes de guardar.
  useEffect(() => {
    if (errorGeneral) errorGeneralRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [errorGeneral]);

  useEffect(() => {
    listPermisos()
      .then(setCatalogo)
      .catch((err) => setCatalogoError(apiErrorMessage(err, "No se pudo cargar el catálogo de permisos.")))
      .finally(() => setCargandoCatalogo(false));
  }, []);

  const grupos = useMemo(() => agruparPermisos(catalogo), [catalogo]);

  function tengoPermiso(nombrePermiso: string): boolean {
    return misPermisos.includes(nombrePermiso);
  }

  // Mismo criterio que ValidadorDePermisosDeRol en el backend (RF34): nadie puede dejar un rol con un permiso que no tiene, pero uno que el rol ya traía se puede sacar para "arreglarlo" aunque no se pueda volver a tildar en esta misma sesión si el actor no lo tiene.
  function toggle(permiso: Permiso) {
    const yaMarcado = form.permisosIds.includes(permiso.idPermiso);
    if (!yaMarcado && !tengoPermiso(permiso.nombre)) return;
    setForm((f) => ({
      ...f,
      permisosIds: yaMarcado
        ? f.permisosIds.filter((id) => id !== permiso.idPermiso)
        : [...f.permisosIds, permiso.idPermiso],
    }));
  }

  // Permisos tildados (normalmente heredados de un rol editado por un actor con más privilegios) que el usuario actual no tiene: si los deja así, el backend rechaza el guardado entero porque valida el conjunto final, no el delta.
  const permisosSinTenencia = useMemo(
    () => catalogo.filter((p) => form.permisosIds.includes(p.idPermiso) && !misPermisos.includes(p.nombre)),
    [catalogo, form.permisosIds, misPermisos],
  );

  const nombreNormalizado = normalizarNombreRol(form.nombre);
  const mostrarPreviewNombre = form.nombre.trim() !== "" && nombreNormalizado !== form.nombre.trim();

  function campo<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }));
  }

  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) {
      e.nombre = "El nombre es obligatorio.";
    } else if (form.nombre.trim().length > 50) {
      e.nombre = "El nombre no puede superar los 50 caracteres.";
    }
    if (form.descripcion.trim().length > 100) {
      e.descripcion = "La descripción no puede superar los 100 caracteres.";
    }
    return e;
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setErrorGeneral("");

    const erroresValidacion = validar();
    setErrores(erroresValidacion);
    const primerCampoError = Object.keys(erroresValidacion).find((k) => erroresValidacion[k]);
    if (primerCampoError) {
      document.getElementById(primerCampoError)?.focus();
      return;
    }

    const dto = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
      permisosIds: form.permisosIds,
    };

    setGuardando(true);
    try {
      if (esEdicion) {
        await updateRole(props.rolId, dto);
      } else {
        await createRole(dto);
      }
      router.push("/roles");
    } catch (err) {
      // RolService.crear()/editar() tiran 409 con este mensaje exacto cuando el nombre (ya normalizado) choca con uno existente, se marca en el campo y no como banner general.
      if (err instanceof ApiError && err.status === 409 && err.message.toLowerCase().includes("nombre")) {
        setErrores((e) => ({ ...e, nombre: err.message }));
      } else {
        setErrorGeneral(apiErrorMessage(err, "No se pudo guardar el rol. Probá de nuevo."));
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[720px] mx-auto w-full px-4 py-5">
        <button type="button" className="btn btn-link btn-sm pl-0 no-underline mb-2 gap-1" onClick={() => router.back()}>
          <ArrowLeft size={14} aria-hidden />
          Cancelar
        </button>

        <h1 className="text-xl font-bold mb-1">{esEdicion ? "Editar rol" : "Nuevo rol"}</h1>
        <p className="text-sm text-base-content/60 mb-4">
          No puedes otorgarle a un rol un permiso que tú mismo no tienes: esos quedan bloqueados más abajo.
        </p>

        {errorGeneral ? (
          <div ref={errorGeneralRef} role="alert" className="alert alert-error alert-soft text-sm mb-4">
            <span>{errorGeneral}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <fieldset className="fieldset space-y-3 p-4 rounded-box border border-base-300">
            <legend className="fieldset-legend text-sm font-semibold text-base-content mb-1 gap-1.5">
              <Tag size={15} aria-hidden className="text-primary" />
              Datos del rol
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="floating-label">
                  <input
                    id="nombre"
                    className={`input w-full${errores.nombre ? " input-error" : ""}`}
                    placeholder="Nombre"
                    value={form.nombre}
                    maxLength={50}
                    onChange={(e) => campo("nombre", e.target.value)}
                    disabled={guardando}
                    aria-invalid={errores.nombre ? true : undefined}
                    aria-describedby={errores.nombre ? "nombre-error" : mostrarPreviewNombre ? "nombre-preview" : undefined}
                    required
                  />
                  <span>Nombre *</span>
                </label>
                {errores.nombre ? (
                  <p id="nombre-error" className="mt-1 text-xs text-error">
                    {errores.nombre}
                  </p>
                ) : mostrarPreviewNombre ? (
                  <p id="nombre-preview" className="mt-1 text-xs text-base-content/60">
                    Se va a guardar como <span className="font-semibold">{nombreNormalizado}</span>.
                  </p>
                ) : null}
              </div>
              <div>
                <label className="floating-label">
                  <input
                    id="descripcion"
                    className={`input w-full${errores.descripcion ? " input-error" : ""}`}
                    placeholder="Descripción"
                    value={form.descripcion}
                    maxLength={100}
                    onChange={(e) => campo("descripcion", e.target.value)}
                    disabled={guardando}
                    aria-invalid={errores.descripcion ? true : undefined}
                    aria-describedby={errores.descripcion ? "descripcion-error" : undefined}
                  />
                  <span>Descripción</span>
                </label>
                {errores.descripcion ? (
                  <p id="descripcion-error" className="mt-1 text-xs text-error">
                    {errores.descripcion}
                  </p>
                ) : null}
              </div>
            </div>
          </fieldset>

          <fieldset className="fieldset space-y-3 p-4 rounded-box border border-base-300">
            <legend className="fieldset-legend text-sm font-semibold text-base-content mb-1 gap-1.5">
              <Shield size={15} aria-hidden className="text-primary" />
              Permisos
            </legend>

            {permisosSinTenencia.length > 0 ? (
              // bg-amber-50/text-amber-800 en vez de alert-warning alert-soft: el token --color-warning de daisyUI (sin override propio en globals.css, a diferencia de error/success/info) da 1.7:1 de contraste como texto; este par mide ~6.8:1.
              <div role="alert" className="alert bg-amber-50 text-amber-800 border border-amber-200 text-sm">
                <ShieldAlert size={16} aria-hidden />
                <span>
                  Tienes marcados {permisosSinTenencia.length} permiso{permisosSinTenencia.length === 1 ? "" : "s"} que
                  tú mismo no tienes. Para guardar, destíldalos primero.
                </span>
              </div>
            ) : null}

            {/* Para lectores de pantalla: el estado de cada checkbox no puede depender solo del title (soporte inconsistente) ni del color ámbar, así que se referencia por aria-describedby. */}
            <p id="permiso-sin-tenencia-desc" className="sr-only">
              No tienes este permiso.
            </p>
            <p id="permiso-en-riesgo-desc" className="sr-only">
              No tienes este permiso. Lo puedes sacar, pero no lo vas a poder volver a tildar.
            </p>

            {cargandoCatalogo ? (
              <span className="loading loading-spinner loading-sm" role="status" aria-label="Cargando permisos" />
            ) : catalogoError ? (
              <div role="alert" className="alert alert-error alert-soft text-sm">
                <span>{catalogoError}</span>
              </div>
            ) : (
              grupos.map((grupo) => (
                <div key={grupo.categoria} className="mb-3">
                  <p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide mb-1.5">
                    {grupo.categoria}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    {grupo.permisos.map((permiso) => {
                      const marcado = form.permisosIds.includes(permiso.idPermiso);
                      const tenencia = tengoPermiso(permiso.nombre);
                      const habilitado = marcado || tenencia;
                      // Tildado pero no propio: se puede sacar (arregla un rol sobre-privilegiado) pero no volver a tildar, y queda resaltado en ámbar para no depender solo del title al hover.
                      const enRiesgo = marcado && !tenencia;
                      const inputId = `permiso-${permiso.idPermiso}`;
                      const titulo = !habilitado
                        ? "No tienes este permiso."
                        : enRiesgo
                          ? "No tienes este permiso: lo puedes sacar, pero no volver a tildar."
                          : permiso.descripcion;
                      // amber-700 y no checkbox-warning/text-warning: el --color-warning de daisyUI da 1.8:1 de contraste sobre blanco (por debajo de las 4.5:1 de AA), amber-700 da 5:1.
                      // min-w-0 + break-all: el nombre es una sola palabra sin espacios donde cortar, y sin min-w-0 el label (flex item) se desborda del fieldset en vez de wrappear.
                      return (
                        <div key={permiso.idPermiso} className="flex items-start gap-2 min-w-0">
                          <input
                            type="checkbox"
                            id={inputId}
                            className={`checkbox checkbox-sm mt-0.5 shrink-0${enRiesgo ? " accent-amber-700 border-amber-700" : ""}`}
                            checked={marcado}
                            disabled={!habilitado || guardando}
                            onChange={() => toggle(permiso)}
                            aria-describedby={!habilitado ? "permiso-sin-tenencia-desc" : enRiesgo ? "permiso-en-riesgo-desc" : undefined}
                          />
                          <label
                            htmlFor={inputId}
                            className={`text-sm leading-tight break-all${
                              !habilitado ? " text-base-content/60" : enRiesgo ? " text-amber-700 font-semibold" : ""
                            }`}
                            title={titulo}
                          >
                            {permiso.nombre}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </fieldset>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => router.back()} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? <span className="loading loading-spinner loading-sm" /> : null}
              {esEdicion ? "Guardar cambios" : "Crear rol"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
