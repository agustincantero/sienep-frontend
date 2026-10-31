"use client";

import { cloneElement, isValidElement, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IdCard, ShieldAlert, UserRound } from "lucide-react";
import { ApiError, apiErrorMessage } from "@/lib/api";
import { isValidUruguayanCi } from "@/lib/document-validation";
import {
    createFuncionario,
    updateFuncionario,
    type Funcionario,
    type FuncionarioUpdateInput,
} from "@/lib/funcionarios";
import { PAISES, PAISES_FRECUENTES } from "@/lib/paises";
import { listRoles, type Rol } from "@/lib/roles";
import { useSession } from "@/lib/session-context";
import { TEXTO_REGEX } from "@/lib/validaciones-estudiante";
import { BackButton } from "@/components/layout/BackButton";

// Mismas reglas que FuncionarioRequestDTO
const MAX_NOMBRE = 50;
const MAX_DOCUMENTO = 15;
const DOCUMENTO_REGEX = /^[A-Za-z0-9]+$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

type FormState = {
    nombre: string;
    apellido: string;
    documento: string;
    paisDocumento: string;
    email: string;
    idRol: string;
};

type FuncionarioFormProps = { mode: "crear" } | { mode: "editar"; id: number; funcionario: Funcionario };

function estadoInicial(funcionario?: Funcionario): FormState {
    return {
        nombre: funcionario?.nombre ?? "",
        apellido: funcionario?.apellido ?? "",
        documento: funcionario?.documento ?? "",
        paisDocumento: funcionario?.paisDocumento ?? "URY",
        email: funcionario?.email ?? "",
        idRol: "",
    };
}

export function FuncionarioForm(props: FuncionarioFormProps) {
    const router = useRouter();
    const esEdicion = props.mode === "editar";
    const funcionarioOriginal = esEdicion ? props.funcionario : undefined;
    const { permisos: misPermisos } = useSession();

    const [form, setForm] = useState<FormState>(() => estadoInicial(funcionarioOriginal));
    const [roles, setRoles] = useState<Rol[]>([]);

    const [rolActualInactivo, setRolActualInactivo] = useState<Rol | null>(null);
    const [cargandoRoles, setCargandoRoles] = useState(true);
    const [rolesError, setRolesError] = useState("");
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [errorGeneral, setErrorGeneral] = useState("");
    const [guardando, setGuardando] = useState(false);

    const nombreRolActual = funcionarioOriginal?.rol;

    useEffect(() => {
        let cancelado = false;
        Promise.all([
            listRoles({ estado: "ACTIVO" }),
            nombreRolActual ? listRoles({ estado: "INACTIVO" }) : Promise.resolve<Rol[]>([]),
        ])
            .then(([activos, inactivos]) => {
                if (cancelado) return;
                // ESTUDIANTE es un rol solo para estudiantes, no se puede usar en funcionario.
                setRoles(activos.filter((r) => r.nombre !== "ESTUDIANTE"));
                if (nombreRolActual) {
                    const actual = activos.find((r) => r.nombre === nombreRolActual);
                    const inactivo = actual ? null : (inactivos.find((r) => r.nombre === nombreRolActual) ?? null);
                    setRolActualInactivo(inactivo);
                    const idActual = (actual ?? inactivo)?.idRol;
                    if (idActual != null) setForm((f) => ({ ...f, idRol: String(idActual) }));
                }
            })
            .catch((err) => {
                if (!cancelado) setRolesError(apiErrorMessage(err, "No se pudieron cargar los roles."));
            })
            .finally(() => {
                if (!cancelado) setCargandoRoles(false);
            });
        return () => {
            cancelado = true;
        };
    }, [nombreRolActual]);

    // Mismo criterio que ValidadorDePermisosDeRol, no podés asignar un rol con permisos que vos no tenés.
    function puedoAsignar(rol: Rol): boolean {
        return rol.permisos.every((p) => misPermisos.includes(p.nombre));
    }

    // En edición el backend también valida el rol que el funcionario YA tiene: si tiene permisos que el actor no,
    // cualquier guardado da 403, así que se avisa y se bloquea el botón.
    const rolActual = nombreRolActual
        ? (roles.find((r) => r.nombre === nombreRolActual) ?? rolActualInactivo)
        : null;
    const rolActualBloqueado = rolActual ? !puedoAsignar(rolActual) : false;

    function campo<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((f) => ({ ...f, [key]: value }));
        if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }));
    }

    // El orden de los checks sigue el de los campos en pantalla: el primero con error es el que recibe el foco.
    function validar(): Record<string, string> {
        const e: Record<string, string> = {};
        if (!form.nombre.trim()) {
            e.nombre = "El nombre es obligatorio.";
        } else if (form.nombre.trim().length > MAX_NOMBRE) {
            e.nombre = `El nombre no puede superar los ${MAX_NOMBRE} caracteres.`;
        } else if (!TEXTO_REGEX.test(form.nombre.trim())) {
            e.nombre = "Ingresá un nombre válido (solo letras, números y espacios).";
        }
        if (!form.apellido.trim()) {
            e.apellido = "El apellido es obligatorio.";
        } else if (form.apellido.trim().length > MAX_NOMBRE) {
            e.apellido = `El apellido no puede superar los ${MAX_NOMBRE} caracteres.`;
        } else if (!TEXTO_REGEX.test(form.apellido.trim())) {
            e.apellido = "Ingresá un apellido válido (solo letras, números y espacios).";
        }
        if (!esEdicion) {
            const documento = form.documento.trim();
            if (!documento) {
                e.documento = "El documento es obligatorio.";
            } else if (!DOCUMENTO_REGEX.test(documento)) {
                e.documento = "El documento debe ser alfanumérico, sin espacios ni guiones.";
            } else if (form.paisDocumento === "URY" && !isValidUruguayanCi(documento)) {
                e.documento = "La cédula uruguaya ingresada no es válida (dígito verificador incorrecto).";
            }
        }
        if (!form.email.trim()) {
            e.email = "El email es obligatorio.";
        } else if (!EMAIL_REGEX.test(form.email.trim())) {
            e.email = "Ingresá un email válido.";
        }
        if (!form.idRol) {
            e.idRol = "Elegí un rol.";
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

        const datos: FuncionarioUpdateInput = {
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            email: form.email.trim(),
            idRol: Number(form.idRol),
        };

        setGuardando(true);
        try {
            if (esEdicion) {
                await updateFuncionario(props.id, datos);
                router.push(`/funcionarios/${props.id}`);
            } else {
                const creado = await createFuncionario({
                    ...datos,
                    documento: form.documento.trim(),
                    paisDocumento: form.paisDocumento,
                });

                router.push(
                    creado.advertencia
                        ? `/funcionarios/${creado.idUsuario}?aviso=${encodeURIComponent(creado.advertencia)}`
                        : `/funcionarios/${creado.idUsuario}`,
                );
            }
        } catch (err) {

            const mensaje = err instanceof ApiError ? err.message.toLowerCase() : "";
            if (err instanceof ApiError && err.status === 409 && (mensaje.includes("documento") || mensaje.includes("email"))) {
                const key = mensaje.includes("documento") ? "documento" : "email";
                setErrores((e) => ({ ...e, [key]: err.message }));
                document.getElementById(key)?.focus();
            } else if (err instanceof ApiError && err.status === 400 && mensaje.includes("cédula")) {
                setErrores((e) => ({ ...e, documento: err.message }));
                document.getElementById("documento")?.focus();
            } else {
                setErrorGeneral(apiErrorMessage(err, "No se pudo guardar el funcionario. Probá de nuevo."));
            }
        } finally {
            setGuardando(false);
        }
    }

    return (
        <div className="grow overflow-auto">
            <div className="max-w-180 mx-auto w-full px-4 py-5">
                <BackButton onClick={() => router.back()} label="Cancelar" />

                <h1 className="text-xl font-bold mb-1">{esEdicion ? "Editar funcionario" : "Nuevo funcionario"}</h1>
                <p className="text-sm text-base-content/70 mb-4">
                    {esEdicion
                        ? "El documento no se puede modificar."
                        : "Se le va a enviar por email una contraseña temporal para su primer ingreso."}
                </p>

                {errorGeneral ? (
                    <div role="alert" className="alert alert-error alert-soft text-sm mb-4">
                        <span>{errorGeneral}</span>
                    </div>
                ) : null}

                {rolActualBloqueado ? (
                    // bg-amber-50/text-amber-800 en vez de alert-warning: el --color-warning de daisyUI da ~1.8:1 de contraste como texto.
                    <div role="alert" className="alert bg-amber-50 text-amber-800 border border-amber-200 text-sm mb-4">
                        <ShieldAlert size={16} aria-hidden />
                        <span>
              Este funcionario tiene el rol {nombreRolActual}, que incluye permisos que vos no tenés. No podés editarlo.
            </span>
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    <fieldset className="fieldset space-y-3 p-4 rounded-box border border-base-300">
                        <legend className="fieldset-legend text-sm font-semibold text-base-content mb-1 gap-1.5">
                            <UserRound size={15} aria-hidden className="text-primary" />
                            Datos personales
                        </legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Nombre" fieldKey="nombre" error={errores.nombre} required>
                                <input
                                    className={`input w-full${errores.nombre ? " input-error" : ""}`}
                                    placeholder="Nombre"
                                    value={form.nombre}
                                    maxLength={MAX_NOMBRE}
                                    autoComplete="off"
                                    onChange={(e) => campo("nombre", e.target.value)}
                                    disabled={guardando}
                                    required
                                />
                            </Field>
                            <Field label="Apellido" fieldKey="apellido" error={errores.apellido} required>
                                <input
                                    className={`input w-full${errores.apellido ? " input-error" : ""}`}
                                    placeholder="Apellido"
                                    value={form.apellido}
                                    maxLength={MAX_NOMBRE}
                                    autoComplete="off"
                                    onChange={(e) => campo("apellido", e.target.value)}
                                    disabled={guardando}
                                    required
                                />
                            </Field>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Documento" fieldKey="documento" error={errores.documento} required={!esEdicion}>
                                <input
                                    className={`input w-full${errores.documento ? " input-error" : ""}`}
                                    placeholder="Documento"
                                    value={form.documento}
                                    maxLength={MAX_DOCUMENTO}
                                    autoComplete="off"
                                    onChange={(e) => campo("documento", e.target.value)}
                                    disabled={guardando || esEdicion}
                                    required
                                />
                            </Field>
                            <Field label="País del documento" fieldKey="paisDocumento">
                                <select
                                    className="select w-full"
                                    value={form.paisDocumento}
                                    onChange={(e) => campo("paisDocumento", e.target.value)}
                                    disabled={guardando || esEdicion}
                                >
                                    <optgroup label="Frecuentes">
                                        {PAISES_FRECUENTES.map((p) => (
                                            <option key={p.codigo} value={p.codigo}>
                                                {p.nombre}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Todos los países">
                                        {PAISES.map((p) => (
                                            <option key={p.codigo} value={p.codigo}>
                                                {p.nombre}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </Field>
                        </div>
                    </fieldset>

                    <fieldset className="fieldset space-y-3 p-4 rounded-box border border-base-300">
                        <legend className="fieldset-legend text-sm font-semibold text-base-content mb-1 gap-1.5">
                            <IdCard size={15} aria-hidden className="text-primary" />
                            Cuenta
                        </legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Email" fieldKey="email" error={errores.email} required>
                                <input
                                    type="email"
                                    className={`input w-full${errores.email ? " input-error" : ""}`}
                                    placeholder="Email"
                                    value={form.email}
                                    autoComplete="off"
                                    onChange={(e) => campo("email", e.target.value)}
                                    disabled={guardando}
                                    required
                                />
                            </Field>
                            {cargandoRoles ? (
                                <span className="loading loading-spinner loading-sm self-center" role="status" aria-label="Cargando roles" />
                            ) : rolesError ? (
                                <div role="alert" className="alert alert-error alert-soft text-sm">
                                    <span>{rolesError}</span>
                                </div>
                            ) : (
                                <Field label="Rol" fieldKey="idRol" error={errores.idRol} required>
                                    <select
                                        className={`select w-full${errores.idRol ? " select-error" : ""}`}
                                        value={form.idRol}
                                        onChange={(e) => campo("idRol", e.target.value)}
                                        disabled={guardando}
                                        required
                                    >
                                        <option value="" disabled>
                                            Elegí un rol
                                        </option>
                                        {rolActualInactivo ? (
                                            <option value={rolActualInactivo.idRol}>{rolActualInactivo.nombre} (inactivo)</option>
                                        ) : null}
                                        {roles.map((r) => {
                                            const asignable = puedoAsignar(r);
                                            return (
                                                <option key={r.idRol} value={r.idRol} disabled={!asignable}>
                                                    {r.nombre}
                                                    {asignable ? "" : " (tiene permisos que no tenés)"}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </Field>
                            )}
                        </div>
                    </fieldset>

                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-ghost" onClick={() => router.back()} disabled={guardando}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={guardando || cargandoRoles || !!rolesError || rolActualBloqueado}
                        >
                            {guardando ? <span className="loading loading-spinner loading-sm" aria-hidden /> : null}
                            {esEdicion ? "Guardar cambios" : "Crear funcionario"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({
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
