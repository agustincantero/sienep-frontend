"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, FilterX, Pencil, Plus, UserCheck, UserX } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { coincideTexto, TAMANIO_PAGINA } from "@/lib/buscar-estudiante";
import {
    deactivateFuncionario,
    ESTADOS_FUNCIONARIO,
    listFuncionariosPorEstados,
    reactivateFuncionario,
    type Funcionario,
} from "@/lib/funcionarios";
import {
    FILTROS_POR_DEFECTO,
    ORDEN_POR_DEFECTO,
    ORDENES,
    aQuery,
    hayFiltrosActivos,
    leerFiltros,
    type FiltrosFuncionarios,
    type OrdenFuncionarios,
} from "@/lib/funcionarios-filtros";
import { useRolesGestionables } from "@/lib/funcionarios-roles";
import { useSession } from "@/lib/session-context";
import { useAvisoVisible } from "@/lib/use-aviso-visible";
import { DataTable } from "@/components/ui/DataTable";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EstadoBadge } from "@/components/students/EstadoBadge";
import { StudentAvatar } from "@/components/students/StudentAvatar";

// Últimos filtros usados en la sesión: al volver a /funcionarios sin filtros en la URL (desde la ficha o el menú) se restauran.
const CLAVE_FILTROS = "sienep:funcionarios:filtros";

function leerFiltrosGuardados(): string | null {
    try {
        return window.sessionStorage.getItem(CLAVE_FILTROS);
    } catch {
        return null;
    }
}

function guardarFiltros(query: string) {
    try {
        if (query) window.sessionStorage.setItem(CLAVE_FILTROS, query);
        else window.sessionStorage.removeItem(CLAVE_FILTROS);
    } catch {
        // Sin sessionStorage (modo privado, bloqueado): los filtros siguen funcionando, solo no se recuerdan.
    }
}

// Órdenes del select "Ordenar por" además del por defecto (que es su opción vacía).
const ORDENES_ELEGIBLES = (Object.keys(ORDENES) as OrdenFuncionarios[]).filter((clave) => clave !== ORDEN_POR_DEFECTO);

// "" = Todos: no existe ?estado=TODOS, así que se piden los tres estados en paralelo y se juntan (ver listFuncionariosPorEstados).
function estadosDeFiltro(estadoLabel: string): string[] {
    return estadoLabel ? [ESTADOS_FUNCIONARIO[estadoLabel]] : Object.values(ESTADOS_FUNCIONARIO);
}

export function FuncionariosListView({ filtrosIniciales }: { filtrosIniciales: FiltrosFuncionarios }) {
    const router = useRouter();
    const { idUsuario: miId, permisos } = useSession();
    const puedeCrear = permisos.includes("CREAR_FUNCIONARIO");
    const puedeEditar = permisos.includes("EDITAR_FUNCIONARIO");
    const puedeDesactivar = permisos.includes("DESACTIVAR_FUNCIONARIO");
    const puedeReactivar = permisos.includes("REACTIVAR_FUNCIONARIO");
    // Si el rol del funcionario tiene permisos que el usuario no, el backend responde 403 a editar/desactivar/activar.
    const puedoGestionarRol = useRolesGestionables();

    const [texto, setTexto] = useState(filtrosIniciales.texto);
    const [textoDebounced, setTextoDebounced] = useState(filtrosIniciales.texto);
    const [estadoLabel, setEstadoLabel] = useState(filtrosIniciales.estado);
    const [nomRol, setNomRol] = useState(filtrosIniciales.rol);
    const [orden, setOrden] = useState<OrdenFuncionarios>(filtrosIniciales.orden);
    const [page, setPage] = useState(filtrosIniciales.pagina);
    // false hasta decidir si hay filtros guardados para restaurar: así la primera carga ya sale con ellos.
    const [listo, setListo] = useState(false);
    const restauracionHecha = useRef(false);

    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [exito, setExito] = useState("");
    const avisoExitoRef = useAvisoVisible<HTMLDivElement>(exito);
    const avisoErrorRef = useAvisoVisible<HTMLDivElement>(error);
    const [accionEnCursoId, setAccionEnCursoId] = useState<number | null>(null);
    const [idADesactivar, setIdADesactivar] = useState<number | null>(null);

    // Cualquier cambio de búsqueda/filtro/orden vuelve a la primera página.
    function conResetDePagina<T>(setter: (valor: T) => void) {
        return (valor: T) => {
            setter(valor);
            setPage(0);
        };
    }
    const handleTextoChange = conResetDePagina(setTexto);
    // El estado es el único filtro que vuelve a pedir al backend: se muestra el spinner mientras llega.
    const handleEstadoChange = conResetDePagina((valor: string) => {
        if (valor !== estadoLabel) setCargando(true);
        setEstadoLabel(valor);
    });
    const handleRolChange = conResetDePagina(setNomRol);
    const handleOrdenChange = conResetDePagina(setOrden);

    function aplicarFiltros(f: FiltrosFuncionarios) {
        setTexto(f.texto);
        setTextoDebounced(f.texto);
        if (f.estado !== estadoLabel) setCargando(true);
        setEstadoLabel(f.estado);
        setNomRol(f.rol);
        setOrden(f.orden);
        setPage(f.pagina);
    }

    useEffect(() => {
        const id = setTimeout(() => setTextoDebounced(texto), 300);
        return () => clearTimeout(id);
    }, [texto]);

    // Si la URL no trae filtros, se restauran los últimos usados en la sesión. Corre una sola vez, al montar.
    useEffect(() => {
        if (restauracionHecha.current) return;
        restauracionHecha.current = true;
        const guardados = hayFiltrosActivos(filtrosIniciales) ? null : leerFiltrosGuardados();
        // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de un sistema externo (sessionStorage), no se puede derivar en el render sin romper la hidratación
        if (guardados) aplicarFiltros(leerFiltros(new URLSearchParams(guardados)));
        setListo(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
    }, []);

    const filtrosActuales: FiltrosFuncionarios = {
        texto: textoDebounced,
        estado: estadoLabel,
        rol: nomRol,
        orden,
        pagina: page,
    };
    const queryActual = aQuery(filtrosActuales);

    // URL y sesión siguen a los filtros aplicados. replaceState: solo actualiza la URL, sin pedir nada al servidor
    // ni sumar una entrada al historial por cada tecla.
    useEffect(() => {
        if (!listo) return;
        const url = queryActual ? `/funcionarios?${queryActual}` : "/funcionarios";
        if (url !== `${window.location.pathname}${window.location.search}`) {
            window.history.replaceState(null, "", url);
        }
        guardarFiltros(queryActual);
    }, [listo, queryActual]);

    useEffect(() => {
        if (!listo) return;
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
    }, [listo, estadoLabel]);

    // Mismos campos que filtra el backend (nombre, apellido y documento), igual que el buscador de estudiantes.
    const filtrados = useMemo(() => {
        const buscado = textoDebounced.trim();
        const coinciden = funcionarios.filter(
            (f) =>
                (!nomRol || f.rol === nomRol) &&
                (!buscado || coincideTexto(buscado, f.nombre, f.apellido, f.documento)),
        );
        return coinciden.sort(ORDENES[orden].comparar);
    }, [funcionarios, textoDebounced, nomRol, orden]);

    // Roles de los funcionarios cargados (los que tiene sentido filtrar). El elegido se suma siempre, aunque con el
    // filtro de estado actual no haya nadie con ese rol, para que el select no quede mostrando otra opción.
    const opcionesRol = useMemo(() => {
        const nombres = new Set(funcionarios.map((f) => f.rol));
        if (nomRol) nombres.add(nomRol);
        return [...nombres].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    }, [funcionarios, nomRol]);

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
        {
            label: "Rol",
            emptyLabel: "Todos",
            options: opcionesRol,
            value: nomRol,
            onChange: handleRolChange,
        },
        // El orden va como un select más (y no como `trailing` del Toolbar) para que quede pegado a los filtros:
        // `trailing` siempre cae en la última columna y dejaba un hueco en medio. La opción vacía es el orden por defecto.
        {
            label: "Ordenar por",
            emptyLabel: ORDENES[ORDEN_POR_DEFECTO].label,
            options: ORDENES_ELEGIBLES.map((clave) => ORDENES[clave].label),
            value: orden === ORDEN_POR_DEFECTO ? "" : ORDENES[orden].label,
            onChange: (label) =>
                handleOrdenChange(ORDENES_ELEGIBLES.find((clave) => ORDENES[clave].label === label) ?? ORDEN_POR_DEFECTO),
        },
    ];

    return (
        <div className="grow overflow-auto">
            <div className="max-w-300 mx-auto w-full px-4 py-5">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h1 className="text-xl font-bold mb-0">Funcionarios</h1>
                    {puedeCrear ? (
                        <button
                            type="button"
                            className="btn btn-primary btn-sm gap-1"
                            onClick={() => router.push("/funcionarios/nuevo")}
                        >
                            <Plus size={14} aria-hidden />
                            Nuevo funcionario
                        </button>
                    ) : null}
                </div>

                <Toolbar
                    placeholder="Buscar por nombre, apellido o documento"
                    searchValue={texto}
                    onSearchChange={handleTextoChange}
                    filters={filters}
                />

                {/* "Limpiar filtros" solo si hay algo distinto del listado por defecto. */}
                {hayFiltrosActivos({ ...filtrosActuales, texto }) ? (
                    <div className="mb-3">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm gap-1"
                            onClick={() => aplicarFiltros(FILTROS_POR_DEFECTO)}
                        >
                            <FilterX size={14} aria-hidden />
                            Limpiar filtros
                        </button>
                    </div>
                ) : null}

                {exito ? (
                    <div ref={avisoExitoRef} role="status" className="alert alert-success alert-soft text-sm mb-3">
                        <span>{exito}</span>
                    </div>
                ) : null}

                {error ? (
                    <div ref={avisoErrorRef} role="alert" className="alert alert-error alert-soft text-sm mb-3">
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
                        <DataTable headers={["Nombre", "Documento", "Rol", "Estado", ""]}>
                            {visibles.map((f) => {
                                const esYo = f.idUsuario === miId;
                                const enCurso = accionEnCursoId === f.idUsuario;
                                const gestionable = puedoGestionarRol(f.rol);
                                return (
                                    <tr
                                        key={f.idUsuario}
                                        className="cursor-pointer select-none"
                                        onClick={() => router.push(`/funcionarios/${f.idUsuario}`)}
                                    >
                                        <td className="font-semibold">
                                            <div className="flex items-center gap-2">
                                                <StudentAvatar nombre={f.nombre} apellido={f.apellido} urlFoto={f.urlFoto} />
                                                {f.nombre} {f.apellido}
                                            </div>
                                        </td>
                                        <td>{f.documento}</td>
                                        <td>{f.rol}</td>
                                        <td>
                                            <EstadoBadge estado={f.estado} />
                                        </td>
                                        {/* stopPropagation: sin esto, cualquier click acá también dispara la navegación de la fila. */}
                                        <td className="whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                                            <div className="inline-flex gap-1">
                                                <Link href={`/funcionarios/${f.idUsuario}`} className="btn btn-ghost btn-xs gap-1">
                                                    <Eye size={13} aria-hidden />
                                                    Ver ficha
                                                </Link>
                                                {puedeEditar && gestionable ? (
                                                    <Link
                                                        href={`/funcionarios/${f.idUsuario}/editar`}
                                                        className="btn btn-ghost btn-xs gap-1"
                                                    >
                                                        <Pencil size={13} aria-hidden />
                                                        Editar
                                                    </Link>
                                                ) : null}
                                                {/* El backend no impide desactivarse a uno mismo, pero eso cierra tu propia sesión sin vuelta atrás desde la UI. */}
                                                {f.estado !== "INACTIVO" && puedeDesactivar && gestionable && !esYo ? (
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
                                                {f.estado === "INACTIVO" && puedeReactivar && gestionable ? (
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
