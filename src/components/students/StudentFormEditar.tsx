"use client";

import { useQuery } from "@tanstack/react-query";
import { apiErrorMessage } from "@/lib/api";
import { claves } from "@/lib/query-keys";
import { getStudent } from "@/lib/students";
import { BackButton } from "@/components/layout/BackButton";
import { StudentForm } from "./StudentForm";

// Trae la ficha y recién ahí monta el form: StudentForm arma su estado inicial una sola vez con el estudiante que recibe, así que no puede montarse antes de que lleguen los datos. Misma clave que StudentProfile, así que no hay una segunda copia del estudiante.
export function StudentFormEditar({ idEstudiante }: { idEstudiante: number }) {
  const { data: estudiante, isPending, error } = useQuery({
    queryKey: claves.estudiantes.ficha(idEstudiante),
    queryFn: () => getStudent(idEstudiante),
  });

  if (isPending) {
    return (
      <div className="grow overflow-auto flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error || !estudiante) {
    return (
      <div className="grow overflow-auto">
        <div className="max-w-[720px] mx-auto w-full px-4 py-5">
          <BackButton href="/estudiantes" label="Volver a estudiantes" />
          <div role="alert" className="alert alert-error alert-soft text-sm">
            <span>{apiErrorMessage(error, "No se pudo cargar el estudiante.")}</span>
          </div>
        </div>
      </div>
    );
  }

  return <StudentForm mode="editar" estudianteId={idEstudiante} estudiante={estudiante} />;
}
