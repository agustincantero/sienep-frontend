import type { Metadata } from "next";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { FuncionarioDetalle } from "@/components/funcionarios/FuncionarioDetalle";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
    title: "Funcionario · SIENEP",
};

export default async function FuncionarioPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!(await tienePermiso("VER_FUNCIONARIOS"))) {
        return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
    }
    return <FuncionarioDetalle idFuncionario={Number(id)} />;
}
