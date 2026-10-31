import type { Metadata } from "next";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { FuncionariosListView } from "@/components/funcionarios/FuncionariosListView";
import { tienePermiso } from "@/lib/current-user";

export const metadata: Metadata = {
    title: "Funcionarios · SIENEP",
};

export default async function FuncionariosPage() {
    if (!(await tienePermiso("VER_FUNCIONARIOS"))) {
        return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
    }
    return <FuncionariosListView />;
}
