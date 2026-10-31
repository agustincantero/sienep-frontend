"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, UserCheck, UserX } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { coincideTexto, TAMANIO_PAGINA } from "@/lib/buscar-estudiante";
import {
    deactivateFuncionario,
    ESTADOS_FUNCIONARIO,
    listFuncionariosPorEstados,
    reactivateFuncionario,
    type Funcionario,
} from "@/lib/funcionarios";
import { nombrePais } from "@/lib/paises";
import { useSession } from "@/lib/session-context";
import { DataTable } from "@/components/ui/DataTable";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EstadoBadge } from "@/components/students/EstadoBadge";
import { StudentAvatar } from "@/components/students/StudentAvatar";

// "" = Todos: no existe ?estado=TODOS, así que se piden los tres estados en paralelo y se juntan (ver listFuncionariosPorEstados).
function estadosDeFiltro(estadoLabel: string): string[] {
    return estadoLabel ? [ESTADOS_FUNCIONARIO[estadoLabel]] : Object.values(ESTADOS_FUNCIONARIO);
}

export function FuncionariosListView() {
    const router = useRouter();
    const { idUsuario: miId, permisos } = useSession();
    const puedeCrear = permisos.includes("CREAR_FUNCIONARIO");
    const puedeEditar = permisos.includes("EDITAR_FUNCIONARIO");
    const puedeDesactivar = permisos.includes("DESACTIVAR_FUNCIONARIO");
    const puedeReactivar = permisos.includes("REACTIVAR_FUNCIONARIO");

    const [texto, setTexto] = useState("");
    const [textoDebounced, setTextoDebounced] = useState("");
    const [estadoLabel, setEstadoLabel] = useState("");
    const [page, setPage] = useState(0);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [exito, setExito] = useState("");
    const [accionEnCursoId, setAccionEnCursoId] = useState<number | null>(null);
    const [idADesactivar, setIdADesactivar] = useState<number | null>(null);

    useEffect(() => {
        const id = setTimeout(() => setTextoDebounced(texto), 300);
        return () => clearTimeout(id);
    }, [texto]);

    useEffect(() => {
        let cancelado = false;
        listFuncionariosPorEstados(estadosDeFiltro(estadoLabel))
            .then((res) => {
                if (cancelado) return;
                setFuncionarios(res);
                setError("");
            })
            .catch((err) => {
                if (cancelado) return;
                setError(apiErrorMessage(err, "No se pudieron cargar los funcionarios."));
            })
            .finally(() => {
                if (!cancelado) setCargando(false);
            });
        return () => {
            cancelado = true;
        };
    }, [estadoLabel]);

    // Cambiar búsqueda o filtro vuelve a la primera página.
    function handleTextoChange(valor: string) {
        setTexto(valor);
        setPage(0);
    }

    function handleEstadoChange(valor: string) {
        setEstadoLabel(valor);
        setPage(0);
        setCargando(true);
    }

    const filtrados = useMemo(() => {
        const buscado = textoDebounced.trim();
        if (!buscado) return funcionarios;
        return funcionarios.filter((f) => coincideTexto(buscado, f.nombre, f.apellido, f.documento, f.email, f.rol));
    }, [funcionarios, textoDebounced]);

    // Si una baja/reactivación saca filas de la lista, la página actual puede quedar fuera de rango.
    const ultimaPagina = Math.max(0, Math.ceil(filtrados.length / TAMANIO_PAGINA) - 1);
    const paginaActual = Math.min(page, ultimaPagina);
    const visibles = filtrados.slice(paginaActual * TAMANIO_PAGINA, (paginaActual + 1) * TAMANIO_PAGINA);

    const funcionarioADesactivar = funcionarios.find((f) => f.idUsuario === idADesactivar);

    // Si el filtro de estado ya no incluye el estado nuevo, la fila sale de la lista, si no, se actualiza en el lugar.
    function aplicarCambioDeEstado(actualizado: Funcionario) {
        const sigueVisible = estadosDeFiltro(estadoLabel).includes(actualizado.estado);
        setFuncionarios((prev) =>
            sigueVisible
                ? prev.map((f) => (f.idUsuario === actualizado.idUsuario ? actualizado : f))
                : prev.filter((f) => f.idUsuario !== actualizado.idUsuario),
        );
    }

    async function confirmarDesactivar() {
        if (idADesactivar == null || !funcionarioADesactivar) return;
        const funcionario = funcionarioADesactivar;
        setIdADesactivar(null);
        setAccionEnCursoId(funcionario.idUsuario);
        setExito("");
        setError("");
        try {
            await deactivateFuncionario(funcionario.idUsuario);
            // DELETE devuelve 204 sin body
            aplicarCambioDeEstado({ ...funcionario, estado: "INACTIVO" });
            setExito(`Funcionario desactivado: ${funcionario.nombre} ${funcionario.apellido}.`);
        } catch (err) {
            setError(apiErrorMessage(err, "No se pudo desactivar el funcionario."));
        } finally {
            setAccionEnCursoId(null);
        }
    }

    async function handleReactivar(funcionario: Funcionario) {
        setAccionEnCursoId(funcionario.idUsuario);
        setExito("");
        setError("");
        try {
            aplicarCambioDeEstado(await reactivateFuncionario(funcionario.idUsuario));
            setExito(`Funcionario activado: ${funcionario.nombre} ${funcionario.apellido}.`);
        } catch (err) {
            setError(apiErrorMessage(err, "No se pudo reactivar el funcionario."));
        } finally {
            setAccionEnCursoId(null);
        }
    }

    const filters: ToolbarFilter[] = [
        {
            label: "Estado",
            emptyLabel: "Todos",
            options: Object.keys(ESTADOS_FUNCIONARIO),
            value: estadoLabel,
            onChange: handleEstadoChange,
        },
    ];

    return (
        <div className="grow overflow-auto">
            <div className="max-w-300 mx-auto w-full px-4 py-5">
                <SectionHeader
                    title="Funcionarios"
                    action={puedeCrear ? "+ Nuevo funcionario" : undefined}
                    onAction={puedeCrear ? () => router.push("/funcionarios/nuevo") : undefined}
                />

                <Toolbar
                    placeholder="Buscar por nombre, documento, email o rol"
                    searchValue={texto}
                    onSearchChange={handleTextoChange}
                    filters={filters}
                />

                {exito ? (
                    <div role="status" className="alert alert-success alert-soft text-sm mb-3">
                        <span>{exito}</span>
                    </div>
                ) : null}

                {error ? (
                    <div role="alert" className="alert alert-error alert-soft text-sm mb-3">
                        <span>{error}</span>
                    </div>
                ) : null}

                {cargando ? (
                    <div className="flex justify-center py-10">
                        <span className="loading loading-spinner loading-md" role="status" aria-label="Cargando" />
                    </div>
                ) : visibles.length === 0 ? (
                    <p role="status" className="text-base-content/70 py-6 text-center">
                        No se encontraron funcionarios.
                    </p>
                ) : (
                    <>
                        <DataTable headers={["Funcionario", "Documento", "Rol", "Estado", ""]}>
                            {visibles.map((f) => {
                                const esYo = f.idUsuario === miId;
                                const enCurso = accionEnCursoId === f.idUsuario;
                                return (
                                    <tr key={f.idUsuario}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <StudentAvatar nombre={f.nombre} apellido={f.apellido} urlFoto={f.urlFoto} />
                                                <div className="min-w-0">
                                                    <Link
                                                        href={`/funcionarios/${f.idUsuario}`}
                                                        className="font-semibold text-sm link link-hover"
                                                    >
                                                        {f.apellido}, {f.nombre}
                                                    </Link>
                                                    {esYo ? <span className="text-xs text-base-content/70"> (vos)</span> : null}
                                                    <p className="text-xs text-base-content/70 break-all">{f.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-sm whitespace-nowrap">
                                            {f.documento}
                                            {f.paisDocumento !== "URY" ? (
                                                <span className="block text-xs text-base-content/70">{nombrePais(f.paisDocumento)}</span>
                                            ) : null}
                                        </td>
                                        <td className="text-sm">{f.rol}</td>
                                        <td>
                                            <EstadoBadge estado={f.estado} />
                                        </td>
                                        <td className="whitespace-nowrap">
                                            <div className="inline-flex gap-1">
                                                <Link
                                                    href={`/funcionarios/${f.idUsuario}`}
                                                    className="btn btn-ghost btn-xs gap-1"
                                                    aria-label={`Ver a ${f.nombre} ${f.apellido}`}
                                                >
                                                    <Eye size={13} aria-hidden />
                                                    Ver
                                                </Link>
                                                {puedeEditar ? (
                                                    <Link
                                                        href={`/funcionarios/${f.idUsuario}/editar`}
                                                        className="btn btn-ghost btn-xs gap-1"
                                                        aria-label={`Editar a ${f.nombre} ${f.apellido}`}
                                                    >
                                                        <Pencil size={13} aria-hidden />
                                                        Editar
                                                    </Link>
                                                ) : null}
                                                {/* El backend no impide desactivarse a uno mismo, pero eso cierra tu propia sesión sin vuelta atrás desde la UI. */}
                                                {f.estado !== "INACTIVO" && puedeDesactivar && !esYo ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-xs gap-1 text-error"
                                                        disabled={enCurso}
                                                        onClick={() => setIdADesactivar(f.idUsuario)}
                                                    >
                                                        <UserX size={13} aria-hidden />
                                                        Desactivar
                                                    </button>
                                                ) : null}
                                                {f.estado === "INACTIVO" && puedeReactivar ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-xs gap-1"
                                                        disabled={enCurso}
                                                        onClick={() => handleReactivar(f)}
                                                    >
                                                        <UserCheck size={13} aria-hidden />
                                                        Activar
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </DataTable>
                        <PaginationFooter
                            shown={visibles.length}
                            total={filtrados.length}
                            noun="funcionarios"
                            page={paginaActual}
                            pageSize={TAMANIO_PAGINA}
                            hasPrevious={paginaActual > 0}
                            hasNext={paginaActual < ultimaPagina}
                            onPrevious={() => setPage(paginaActual - 1)}
                            onNext={() => setPage(paginaActual + 1)}
                        />
                    </>
                )}
            </div>

            <ConfirmDialog
                open={idADesactivar != null}
                title="Desactivar funcionario"
                message={
                    funcionarioADesactivar
                        ? `¿Desactivar a ${funcionarioADesactivar.nombre} ${funcionarioADesactivar.apellido}? No va a poder iniciar sesión hasta que lo reactives.`
                        : ""
                }
                confirmLabel="Desactivar"
                destructive
                onConfirm={confirmarDesactivar}
                onCancel={() => setIdADesactivar(null)}
            />
        </div>
    );
}
