import { apiGet } from "./api";
import { TOPE_LISTADO } from "./buscar-estudiante";
import type { Page } from "./students";

// Subconjunto de FuncionarioResponseDTO que hoy usa el front (el responsable de un recordatorio). Se amplía cuando exista el módulo de Funcionarios.
export type FuncionarioResumen = {
  idUsuario: number;
  nombre: string;
  apellido: string;
  documento: string | null;
  email: string;
  rol: string;
  estado: string;
};

// Funcionarios ACTIVOS (los únicos que el backend acepta como responsables). Requiere VER_FUNCIONARIOS: sin él responde 403.
export function listFuncionariosActivos(): Promise<FuncionarioResumen[]> {
  return apiGet<Page<FuncionarioResumen>>("/funcionarios", { size: TOPE_LISTADO }).then((p) =>
    [...p.content].sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`, "es")),
  );
}
