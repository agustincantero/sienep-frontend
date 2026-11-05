"use client";

import { useEffect, useState } from "react";
import { listRoles, type Rol } from "./roles";
import { useSession } from "./session-context";

// Mismo criterio que ValidadorDePermisosDeRol del backend: no se puede asignar (ni tocar a un funcionario con) un
// rol que tenga permisos que uno mismo no tiene.
export function puedoAsignarRol(rol: Rol, misPermisos: string[]): boolean {
    return rol.permisos.every((p) => misPermisos.includes(p.nombre));
}

// Trae los roles (activos e inactivos, como FuncionarioForm) y devuelve una función que dice si el usuario puede
// editar, desactivar o activar a un funcionario según su rol. Mientras los roles cargan devuelve false, así los
// botones no aparecen y desaparecen. Si la consulta falla o el rol no aparece, devuelve true: el backend vuelve
// a validar y responde 403 con su mensaje.
export function useRolesGestionables(): (nombreRol: string) => boolean {
    const { permisos } = useSession();
    const [roles, setRoles] = useState<Map<string, Rol> | null>(null);

    useEffect(() => {
        let cancelado = false;
        Promise.all([listRoles({ estado: "ACTIVO" }), listRoles({ estado: "INACTIVO" })])
            .then(([activos, inactivos]) => {
                if (!cancelado) setRoles(new Map([...activos, ...inactivos].map((r) => [r.nombre, r])));
            })
            .catch(() => {
                if (!cancelado) setRoles(new Map());
            });
        return () => {
            cancelado = true;
        };
    }, []);

    return (nombreRol: string) => {
        if (!roles) return false;
        const rol = roles.get(nombreRol);
        return rol ? puedoAsignarRol(rol, permisos) : true;
    };
}
