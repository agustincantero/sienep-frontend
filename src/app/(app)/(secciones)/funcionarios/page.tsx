import type { Metadata } from "next";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { FuncionariosListView } from "@/components/funcionarios/FuncionariosListView";
import { tienePermiso } from "@/lib/current-user";
import { leerFiltros } from "@/lib/funcionarios-filtros";

export const metadata: Metadata = {
    title: "Funcionarios · SIENEP",
};

// La búsqueda, el estado, el orden y la página viajan en la URL: se leen acá para que el listado arranque ya filtrado.
export default async function FuncionariosPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    if (!(await tienePermiso("VER_FUNCIONARIOS"))) {
        return <SinPermiso volverHref="/" volverLabel="Volver al inicio" />;
    }
    return <FuncionariosListView filtrosIniciales={leerFiltros(await searchParams)} />;
}
