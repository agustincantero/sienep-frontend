import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { BackendError, backendJson } from "@/lib/backend";
import { SinPermiso } from "@/components/layout/SinPermiso";
import { RolForm } from "@/components/roles/RolForm";
import { tienePermiso } from "@/lib/current-user";
import { esRolProtegido, type Rol } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Editar rol · SIENEP",
};

export default async function EditarRolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!(await tienePermiso("EDITAR_ROL"))) {
    return <SinPermiso volverHref="/roles" volverLabel="Volver a roles" />;
  }

  let rol: Rol;
  try {
    rol = await backendJson<Rol>(`/roles/${id}`);
  } catch (err) {
    if (err instanceof BackendError && err.status === 404) notFound();
    throw err;
  }

  // RolService.editar() rechaza ADMINISTRADOR/ESTUDIANTE con 403 (son la base del sistema, ver ValidadorDePermisosDeRol): se corta acá para no mostrar un formulario que nunca va a poder guardar.
  if (esRolProtegido(rol.nombre)) {
    return (
      <div className="grow overflow-auto">
        <div className="max-w-[720px] mx-auto w-full px-4 py-5">
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body items-center text-center gap-2">
              <ShieldAlert size={32} aria-hidden className="text-warning" />
              <h1 className="text-xl font-bold">{rol.nombre} es un rol base del sistema</h1>
              <p className="text-sm text-base-content/70">No se puede editar ni desactivar.</p>
              <Link href="/roles" className="btn btn-primary btn-sm mt-3">
                Volver a roles
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <RolForm mode="editar" rolId={Number(id)} rol={rol} />;
}
