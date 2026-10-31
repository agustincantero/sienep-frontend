import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiPutForm } from "./api";
import { TOPE_LISTADO } from "./buscar-estudiante";
import type { Page } from "./students";

// GET /funcionarios y GET /funcionarios/{id} (FuncionarioResponseDTO).
// - `rol` es el NOMBRE del rol, no el id: para editar hay que resolver el idRol contra GET /roles.
// - `urlFoto` es null si no tiene foto cargada.
// - `advertencia` solo viene en la respuesta del alta (ej. no se pudo mandar el email con la contraseña temporal); en el resto es null.
export type Funcionario = {
    idUsuario: number;
    nombre: string;
    apellido: string;
    documento: string;
    paisDocumento: string;
    email: string;
    estado: string;
    rol: string;
    urlFoto: string | null;
    createdAt: string;
    updatedAt: string;
    advertencia: string | null;
};

// Un funcionario recién creado queda PENDIENTE_DE_ACTIVACION hasta que entra y elige su contraseña (también vuelve a
// ese estado tras un "Restablecer contraseña"). Por eso el filtro de estado incluye "Pendiente", a diferencia de roles.
export const ESTADOS_FUNCIONARIO: Record<string, string> = {
    Activo: "ACTIVO",
    Pendiente: "PENDIENTE_DE_ACTIVACION",
    Inactivo: "INACTIVO",
};

export type FuncionarioListParams = {
    texto?: string;
    estado?: string;
    page?: number;
    size?: number;
    sort?: string;
};

// Sin ?estado= el backend devuelve solo los ACTIVOS (FuncionarioService.listar usa ACTIVO por defecto). sort por defecto: apellido.
export function listFuncionarios(params: FuncionarioListParams = {}): Promise<Page<Funcionario>> {
    return apiGet<Page<Funcionario>>("/funcionarios", params);
}

// El backend filtra de a UN estado y su búsqueda por texto es un LIKE que no ignora tildes ni acepta "Nombre Apellido"
// (FuncionarioRepository.buscarPorTextoYEstado). Como el plantel de funcionarios es chico, se traen todos los de los
// estados pedidos (hasta TOPE_LISTADO por estado) y la búsqueda, el orden y la paginación se resuelven en el cliente,
// igual que la búsqueda de estudiantes.
export async function listFuncionariosPorEstados(estados: string[]): Promise<Funcionario[]> {
    const paginas = await Promise.all(
        estados.map((estado) => listFuncionarios({ estado, size: TOPE_LISTADO, sort: "apellido,asc" })),
    );
    return paginas
        .flatMap((p) => p.content)
        .sort(
            (a, b) =>
                a.apellido.localeCompare(b.apellido, "es", { sensitivity: "base" }) ||
                a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
        );
}

export function getFuncionario(id: number): Promise<Funcionario> {
    return apiGet<Funcionario>(`/funcionarios/${id}`);
}

// FuncionarioRequestDTO: nombre/apellido obligatorios (máx. 50, letras/números/espacios), documento obligatorio
// (máx. 15, alfanumérico; si paisDocumento es URY se valida el dígito verificador), email válido, idRol y paisDocumento (ISO alfa-3).
export type FuncionarioCreateInput = {
    nombre: string;
    apellido: string;
    documento: string;
    paisDocumento: string;
    email: string;
    idRol: number;
};

// FuncionarioUpdateDTO: el documento y su país no se editan.
export type FuncionarioUpdateInput = {
    nombre: string;
    apellido: string;
    email: string;
    idRol: number;
};

// El backend genera la contraseña temporal y la manda por email; el funcionario queda PENDIENTE_DE_ACTIVACION.
export function createFuncionario(dto: FuncionarioCreateInput): Promise<Funcionario> {
    return apiPost<Funcionario>("/funcionarios", dto);
}

export function updateFuncionario(id: number, dto: FuncionarioUpdateInput): Promise<Funcionario> {
    return apiPut<Funcionario>(`/funcionarios/${id}`, dto);
}

// Baja lógica: pasa a INACTIVO (204).
export function deactivateFuncionario(id: number): Promise<void> {
    return apiDelete<void>(`/funcionarios/${id}`);
}

export function reactivateFuncionario(id: number): Promise<Funcionario> {
    return apiPatch<Funcionario>(`/funcionarios/${id}/reactivar`);
}

// POST /funcionarios/{id}/contrasenia (EDITAR_FUNCIONARIO): genera una contraseña nueva, la manda por email y deja al
// funcionario PENDIENTE_DE_ACTIVACION. 409 si está INACTIVO. El cambio de contraseña PROPIA es otro endpoint
// (PATCH, desde "Mi perfil" con CambiarContraseniaForm).
export function restablecerContraseniaFuncionario(id: number): Promise<void> {
    return apiPost<void>(`/funcionarios/${id}/contrasenia`, {});
}

// PUT /funcionarios/{id}/foto, campo multipart `foto`. JPG/PNG, máx. 5 MB (FuncionarioService.subirFoto).
export function uploadFuncionarioFoto(id: number, foto: File): Promise<Funcionario> {
    const formData = new FormData();
    formData.append("foto", foto);
    return apiPutForm<Funcionario>(`/funcionarios/${id}/foto`, formData);
}
