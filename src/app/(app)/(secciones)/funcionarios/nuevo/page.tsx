import type { Metadata } from "next";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { FuncionarioForm } from "@/components/funcionarios/FuncionarioForm";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
    title: "Nuevo funcionario · SIENEP",
};

export default async function NuevoFuncionarioPage() {
    if (!(await tienePermiso("CREAR_FUNCIONARIO"))) {
        return <SinPermiso volverHref="/funcionarios" volverLabel="Volver a funcionarios" />;
    }
    return <FuncionarioForm mode="crear" />;
}
