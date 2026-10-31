import type { Metadata } from "next";
import { BackendError, backendJson } from "@/lib/backend";
import { BackButton } from "@/components/layout/BackButton";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { FuncionarioForm } from "@/components/funcionarios/FuncionarioForm";
import { tienePermiso } from "@/lib/current-user";
import type { Funcionario } from "@/lib/funcionarios";

export const metadata: Metadata = {
    title: "Editar funcionario · SIENEP",
};

export default async function EditarFuncionarioPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!(await tienePermiso("EDITAR_FUNCIONARIO"))) {
        return <SinPermiso volverHref="/funcionarios" volverLabel="Volver a funcionarios" />;
    }

    let funcionario: Funcionario;
    try {
        funcionario = await backendJson<Funcionario>(`/funcionarios/${id}`);
    } catch (err) {
        // 404 (no existe), 400 (id con formato inválido), etc.: se muestra dentro del layout en vez de romper con un 500.
        return (
            <div className="grow overflow-auto">
                <div className="max-w-[720px] mx-auto w-full px-4 py-5">
                    <BackButton href="/funcionarios" label="Volver a funcionarios" />
                    <div role="alert" className="alert alert-error alert-soft text-sm">
                        <span>{err instanceof BackendError ? err.message : "No se pudo cargar el funcionario."}</span>
                    </div>
                </div>
            </div>
        );
    }

    return <FuncionarioForm mode="editar" id={Number(id)} funcionario={funcionario} />;
}
