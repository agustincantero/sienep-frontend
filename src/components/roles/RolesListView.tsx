"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, ShieldCheck, ShieldX } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import {
  deactivateRole,
  esRolProtegido,
  listRoles,
  reactivateRole,
  type Rol,
} from "@/lib/roles";
import { useSession } from "@/lib/session-context";
import { DataTable } from "@/components/ui/DataTable";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Toolbar, type ToolbarFilter } from "@/components/ui/Toolbar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EstadoRolBadge } from "./EstadoRolBadge";

// /roles no tiene ?estado=TODOS (el enum del backend es ACTIVO/INACTIVO/ELIMINADO/PENDIENTE_DE_ACTIVACION, y Rol nunca usa los últimos dos): "Todos" en el filtro pide ambos estados en paralelo y los junta acá, en vez de ser un valor real de la API.
function cargarRoles(estadoLabel: string): Promise<Rol[]> {
  if (estadoLabel === "Activo") return listRoles({ estado: "ACTIVO" });
  if (estadoLabel === "Inactivo") return listRoles({ estado: "INACTIVO" });
  return Promise.all([listRoles({ estado: "ACTIVO" }), listRoles({ estado: "INACTIVO" })]).then(
    ([activos, inactivos]) => [...activos, ...inactivos],
  );
}

export function RolesListView() {
  const router = useRouter();
  const { permisos } = useSession();
  const puedeCrear = permisos.includes("CREAR_ROL");
  const puedeEditar = permisos.includes("EDITAR_ROL");
  const puedeDesactivar = permisos.includes("DESACTIVAR_ROL");
  const puedeReactivar = permisos.includes("REACTIVAR_ROL");

  const [texto, setTexto] = useState("");
  const [estadoLabel, setEstadoLabel] = useState("Todos");
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [accionEnCursoId, setAccionEnCursoId] = useState<number | null>(null);
  const [idADesactivar, setIdADesactivar] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;
    cargarRoles(estadoLabel)
      .then((res) => {
        if (cancelado) return;
        setRoles(res);
        setError("");
      })
      .catch((err) => {
        if (cancelado) return;
        setError(apiErrorMessage(err, "No se pudieron cargar los roles."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [estadoLabel]);

  const rolesFiltrados = useMemo(() => {
    const q = texto.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) => r.nombre.toLowerCase().includes(q) || (r.descripcion ?? "").toLowerCase().includes(q),
    );
  }, [roles, texto]);

  const rolADesactivar = roles.find((r) => r.idRol === idADesactivar);

  async function confirmarDesactivar() {
    if (idADesactivar == null) return;
    const id = idADesactivar;
    setIdADesactivar(null);
    setAccionEnCursoId(id);
    setExito("");
    try {
      await deactivateRole(id);
      setRoles((prev) =>
        estadoLabel === "Activo"
          ? prev.filter((r) => r.idRol !== id)
          : prev.map((r) => (r.idRol === id ? { ...r, estado: "INACTIVO" } : r)),
      );
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo desactivar el rol."));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  async function handleReactivar(id: number) {
    const rol = roles.find((r) => r.idRol === id);
    setAccionEnCursoId(id);
    setExito("");
    try {
      await reactivateRole(id);
      setRoles((prev) =>
        estadoLabel === "Inactivo"
          ? prev.filter((r) => r.idRol !== id)
          : prev.map((r) => (r.idRol === id ? { ...r, estado: "ACTIVO" } : r)),
      );
      setExito(rol ? `Rol activado: ${rol.nombre}.` : "Rol activado.");
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo reactivar el rol."));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  const filters: ToolbarFilter[] = [
    {
      label: "Estado",
      emptyLabel: "Todos",
      options: ["Activo", "Inactivo"],
      value: estadoLabel === "Activo" ? "Activo" : estadoLabel === "Inactivo" ? "Inactivo" : "",
      onChange: (v) => setEstadoLabel(v || "Todos"),
    },
  ];

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[900px] mx-auto w-full px-4 py-5">
        <SectionHeader
          title="Roles"
          action={puedeCrear ? "+ Nuevo rol" : undefined}
          onAction={puedeCrear ? () => router.push("/roles/nuevo") : undefined}
        />

        <Toolbar
          placeholder="Buscar por nombre o descripción"
          searchValue={texto}
          onSearchChange={setTexto}
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
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : rolesFiltrados.length === 0 ? (
          <p className="text-base-content/60 py-6 text-center">No se encontraron roles.</p>
        ) : (
          <DataTable headers={["Rol", "Descripción", "Permisos", "Estado", ""]}>
            {rolesFiltrados.map((r) => {
              const protegido = esRolProtegido(r.nombre);
              return (
                <tr key={r.idRol}>
                  <td className="font-semibold text-sm">{r.nombre}</td>
                  <td className="text-base-content/60 text-sm">{r.descripcion || "—"}</td>
                  <td>
                    <span className="badge badge-outline whitespace-nowrap">
                      {r.permisos.length} permiso{r.permisos.length === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td>
                    <EstadoRolBadge estado={r.estado} />
                  </td>
                  <td className="whitespace-nowrap">
                    {protegido ? (
                      <span className="text-base-content/60 text-sm">Protegido</span>
                    ) : (
                      <div className="inline-flex gap-1">
                        {puedeEditar ? (
                          <Link href={`/roles/${r.idRol}/editar`} className="btn btn-ghost btn-xs gap-1">
                            <Pencil size={13} aria-hidden />
                            Editar
                          </Link>
                        ) : null}
                        {r.estado === "ACTIVO" && puedeDesactivar ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs gap-1 text-error"
                            disabled={accionEnCursoId === r.idRol}
                            onClick={() => setIdADesactivar(r.idRol)}
                          >
                            <ShieldX size={13} aria-hidden />
                            Desactivar
                          </button>
                        ) : null}
                        {r.estado === "INACTIVO" && puedeReactivar ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs gap-1"
                            disabled={accionEnCursoId === r.idRol}
                            onClick={() => handleReactivar(r.idRol)}
                          >
                            <ShieldCheck size={13} aria-hidden />
                            Activar
                          </button>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </div>

      <ConfirmDialog
        open={idADesactivar != null}
        title="Desactivar rol"
        message={
          rolADesactivar
            ? `¿Desactivar el rol ${rolADesactivar.nombre}? Los funcionarios que lo tengan asignado conservan el rol, pero no se va a poder asignar a nadie más hasta reactivarlo.`
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
