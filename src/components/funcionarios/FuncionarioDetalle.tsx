"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, KeyRound, Pencil, UserCheck, UserX } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { formatFechaHora } from "@/lib/format";
import {
    deactivateFuncionario,
    getFuncionario,
    reactivateFuncionario,
    restablecerContraseniaFuncionario,
    uploadFuncionarioFoto,
    type Funcionario,
} from "@/lib/funcionarios";
import { nombrePais } from "@/lib/paises";
import { useSession } from "@/lib/session-context";
import { BackButton } from "@/components/layout/BackButton";
import { Dato } from "@/components/perfil/Dato";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EstadoBadge } from "@/components/students/EstadoBadge";
import { StudentAvatar } from "@/components/students/StudentAvatar";

// Mismas reglas que FuncionarioService.subirFoto (EXTENSIONES_FOTO_PERMITIDAS, MAX_TAMANIO_FOTO_BYTES): se chequean antes de subir.
const TIPOS_FOTO = ["image/jpeg", "image/png"];
const MAX_FOTO_BYTES = 5 * 1024 * 1024;

function accionPassword(f: Funcionario) {
    if (f.estado === "PENDIENTE_DE_ACTIVACION") {
        return {
            boton: "Reenviar contraseña",
            confirmMensaje: `Se va a generar una contraseña temporal nueva y reenviar por email a ${f.nombre} ${f.apellido}.`,
            exito: "Contraseña reenviada por email.",
        };
    }
    return {
        boton: "Restablecer contraseña",
        confirmMensaje: `Esto invalida la contraseña actual de ${f.nombre} ${f.apellido} y se le envia una temporal por email. Va a tener que elegir una nueva en su próximo ingreso.`,
        exito: "Contraseña restablecida y enviada por email.",
    };
}

type Confirmacion = "password" | "desactivar" | null;

export function FuncionarioDetalle({ idFuncionario }: { idFuncionario: number }) {
    const { idUsuario: miId, permisos } = useSession();
    const esYo = idFuncionario === miId;
    const puedeEditar = permisos.includes("EDITAR_FUNCIONARIO");
    const puedeDesactivar = permisos.includes("DESACTIVAR_FUNCIONARIO");
    const puedeReactivar = permisos.includes("REACTIVAR_FUNCIONARIO");
    // El backend deja subir la foto propia sin EDITAR_FUNCIONARIO.
    const puedeSubirFoto = puedeEditar || esYo;

    const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
    const [cargando, setCargando] = useState(true);

    const [errorCarga, setErrorCarga] = useState("");
    const [error, setError] = useState("");
    const [exito, setExito] = useState("");
    const [aviso, setAviso] = useState("");
    const [accionEnCurso, setAccionEnCurso] = useState(false);
    const [confirmacion, setConfirmacion] = useState<Confirmacion>(null);

    const [versionFoto, setVersionFoto] = useState(0);
    const inputFotoRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        const valor = new URLSearchParams(window.location.search).get("aviso");
        if (valor) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de un sistema externo (la URL de navegación)
            setAviso(valor);
            window.history.replaceState(null, "", window.location.pathname);
        }
    }, []);

    useEffect(() => {
        let cancelado = false;
        getFuncionario(idFuncionario)
            .then((f) => {
                if (cancelado) return;
                setFuncionario(f);
                setErrorCarga("");
            })
            .catch((err) => {
                if (!cancelado) setErrorCarga(apiErrorMessage(err, "No se pudo cargar el funcionario."));
            })
            .finally(() => {
                if (!cancelado) setCargando(false);
            });
        return () => {
            cancelado = true;
        };
    }, [idFuncionario]);

    function limpiarMensajes() {
        setError("");
        setExito("");
    }

    async function handleFoto(ev: React.ChangeEvent<HTMLInputElement>) {
        const foto = ev.target.files?.[0];
        if (inputFotoRef.current) inputFotoRef.current.value = "";
        if (!foto) return;
        limpiarMensajes();
        if (!TIPOS_FOTO.includes(foto.type)) {
            setError("La foto tiene que ser JPG o PNG.");
            return;
        }
        if (foto.size > MAX_FOTO_BYTES) {
            setError("La foto no puede superar los 5 MB.");
            return;
        }
        setAccionEnCurso(true);
        try {
            setFuncionario(await uploadFuncionarioFoto(idFuncionario, foto));
            setVersionFoto(Date.now());
            setExito("Foto actualizada.");
        } catch (err) {
            setError(apiErrorMessage(err, "No se pudo subir la foto."));
        } finally {
            setAccionEnCurso(false);
        }
    }

    async function confirmarPassword() {
        if (!funcionario) return;
        const textos = accionPassword(funcionario);
        setConfirmacion(null);
        limpiarMensajes();
        setAccionEnCurso(true);
        try {
            await restablecerContraseniaFuncionario(idFuncionario);
            // El backend lo deja PENDIENTE_DE_ACTIVACION
            setFuncionario({ ...funcionario, estado: "PENDIENTE_DE_ACTIVACION" });
            setExito(textos.exito);
        } catch (err) {
            setError(apiErrorMessage(err, "No se pudo enviar el email. Probá de nuevo."));
        } finally {
            setAccionEnCurso(false);
        }
    }

    async function confirmarDesactivar() {
        if (!funcionario) return;
        setConfirmacion(null);
        limpiarMensajes();
        setAccionEnCurso(true);
        try {
            await deactivateFuncionario(idFuncionario);
            setFuncionario({ ...funcionario, estado: "INACTIVO" });
            setExito("Funcionario desactivado.");
        } catch (err) {
            setError(apiErrorMessage(err, "No se pudo desactivar el funcionario."));
        } finally {
            setAccionEnCurso(false);
        }
    }

    async function handleReactivar() {
        limpiarMensajes();
        setAccionEnCurso(true);
        try {
            setFuncionario(await reactivateFuncionario(idFuncionario));
            setExito("Funcionario activado.");
        } catch (err) {
            setError(apiErrorMessage(err, "No se pudo reactivar el funcionario."));
        } finally {
            setAccionEnCurso(false);
        }
    }

    if (cargando) {
        return (
            <div className="grow overflow-auto flex justify-center py-16">
                <span className="loading loading-spinner loading-lg" role="status" aria-label="Cargando" />
            </div>
        );
    }

    if (errorCarga || !funcionario) {
        return (
            <div className="grow overflow-auto">
                <div className="max-w-245 mx-auto w-full px-4 py-5">
                    <BackButton href="/funcionarios" label="Volver a funcionarios" />
                    <div role="alert" className="alert alert-error alert-soft text-sm">
                        <span>{errorCarga || "Funcionario no encontrado."}</span>
                    </div>
                </div>
            </div>
        );
    }

    const inactivo = funcionario.estado === "INACTIVO";
    const urlFoto = funcionario.urlFoto && versionFoto ? `${funcionario.urlFoto}?v=${versionFoto}` : funcionario.urlFoto;
    const textosPassword = accionPassword(funcionario);

    return (
        <div className="grow overflow-auto">
            <div className="max-w-245 mx-auto w-full px-4 py-5">
                <BackButton href="/funcionarios" label="Volver a funcionarios" />

                {aviso ? (
                    // bg-amber-50/text-amber-800 en vez de alert-warning: el --color-warning de daisyUI no da contraste AA como texto.
                    <div role="alert" className="alert bg-amber-50 text-amber-800 border border-amber-200 text-sm mb-4">
                        <span>{aviso}</span>
                    </div>
                ) : null}

                {exito ? (
                    <div role="status" className="alert alert-success alert-soft text-sm mb-4">
                        <span>{exito}</span>
                    </div>
                ) : null}

                {error ? (
                    <div role="alert" className="alert alert-error alert-soft text-sm mb-4">
                        <span>{error}</span>
                    </div>
                ) : null}

                <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <StudentAvatar nombre={funcionario.nombre} apellido={funcionario.apellido} urlFoto={urlFoto} size="lg" />
                        <div>
                            <h1 className="text-xl font-bold mb-0">
                                {funcionario.nombre} {funcionario.apellido}
                            </h1>
                            <p className="text-sm text-base-content/70 mb-1">{funcionario.rol}</p>
                            <EstadoBadge estado={funcionario.estado} />
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {puedeSubirFoto ? (
                            <>
                                <input
                                    ref={inputFotoRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={handleFoto}
                                    disabled={accionEnCurso}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm gap-1"
                                    onClick={() => inputFotoRef.current?.click()}
                                    disabled={accionEnCurso}
                                >
                                    <Camera size={14} aria-hidden />
                                    {funcionario.urlFoto ? "Cambiar foto" : "Subir foto"}
                                </button>
                            </>
                        ) : null}
                        {/* Para la contraseña propia está "Mi perfil" (pide la actual). El backend da 409 si está INACTIVO. */}
                        {puedeEditar && !esYo && !inactivo ? (
                            <button
                                type="button"
                                className="btn btn-outline btn-sm gap-1"
                                onClick={() => setConfirmacion("password")}
                                disabled={accionEnCurso}
                            >
                                <KeyRound size={14} aria-hidden />
                                {textosPassword.boton}
                            </button>
                        ) : null}
                        {!inactivo && puedeDesactivar && !esYo ? (
                            <button
                                type="button"
                                className="btn btn-outline btn-error btn-sm gap-1"
                                onClick={() => setConfirmacion("desactivar")}
                                disabled={accionEnCurso}
                            >
                                <UserX size={14} aria-hidden />
                                Desactivar
                            </button>
                        ) : null}
                        {inactivo && puedeReactivar ? (
                            <button
                                type="button"
                                className="btn btn-outline btn-sm gap-1"
                                onClick={handleReactivar}
                                disabled={accionEnCurso}
                            >
                                <UserCheck size={14} aria-hidden />
                                Activar
                            </button>
                        ) : null}
                        {puedeEditar ? (
                            <Link href={`/funcionarios/${idFuncionario}/editar`} className="btn btn-primary btn-sm gap-1">
                                <Pencil size={14} aria-hidden />
                                Editar
                            </Link>
                        ) : null}
                    </div>
                </div>

                <div className="card bg-base-100 border border-base-300">
                    <div className="card-body">
                        <h2 className="text-sm font-semibold mb-1">Datos del funcionario</h2>
                        <Dato label="Nombre" value={funcionario.nombre} />
                        <Dato label="Apellido" value={funcionario.apellido} />
                        <Dato label="Documento" value={funcionario.documento} />
                        <Dato label="País del documento" value={nombrePais(funcionario.paisDocumento)} />
                        <Dato label="Email" value={<span className="break-all">{funcionario.email}</span>} />
                        <Dato label="Rol" value={funcionario.rol} />
                        <Dato label="Alta" value={funcionario.createdAt ? formatFechaHora(funcionario.createdAt) : ""} />
                        <Dato
                            label="Última modificación"
                            value={funcionario.updatedAt ? formatFechaHora(funcionario.updatedAt) : ""}
                        />
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmacion === "password"}
                title={textosPassword.boton}
                message={textosPassword.confirmMensaje}
                confirmLabel={textosPassword.boton}
                onConfirm={confirmarPassword}
                onCancel={() => setConfirmacion(null)}
            />

            <ConfirmDialog
                open={confirmacion === "desactivar"}
                title="Desactivar funcionario"
                message={`¿Desactivar a ${funcionario.nombre} ${funcionario.apellido}? No va a poder iniciar sesión hasta que lo reactives.`}
                confirmLabel="Desactivar"
                destructive
                onConfirm={confirmarDesactivar}
                onCancel={() => setConfirmacion(null)}
            />
        </div>
    );
}
