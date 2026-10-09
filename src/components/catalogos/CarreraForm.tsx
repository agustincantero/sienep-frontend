"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { createCarrera, updateCarrera, type Carrera } from "@/lib/carreras";
import { esNombreRepetido } from "@/lib/catalogos";
import { hrefListado } from "@/lib/catalogos-tabs";
import { CatalogoFormLayout } from "./CatalogoFormLayout";
import { Campo } from "./Campo";
import { useMensajeTemporal } from "./useCatalogo";

const MAX_NOMBRE = 80;

export function CarreraForm({ carrera }: { carrera?: Carrera }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(carrera?.nomCarrera ?? "");
  const [errorNombre, setErrorNombre] = useState("");
  const [errorGeneral, setErrorGeneral] = useMensajeTemporal();
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    const valor = nombre.trim();
    setErrorGeneral("");
    if (!valor) {
      setErrorNombre("El nombre es obligatorio.");
      document.getElementById("carrera-nombre")?.focus();
      return;
    }
    if (valor.length > MAX_NOMBRE) {
      setErrorNombre(`El nombre no puede superar los ${MAX_NOMBRE} caracteres.`);
      document.getElementById("carrera-nombre")?.focus();
      return;
    }
    setGuardando(true);
    try {
      if (carrera) {
        await updateCarrera(carrera.idCarrera, { nomCarrera: valor });
      } else {
        await createCarrera({ nomCarrera: valor });
      }
      router.push(hrefListado("carreras", `Carrera ${carrera ? "actualizada" : "creada"}: ${valor}.`));
    } catch (err) {
      // En la edición CarreraService no chequea el nombre y el 409 llega con el texto genérico del UNIQUE: se reemplaza por uno que diga qué corregir.
      if (esNombreRepetido(err)) {
        setErrorNombre("Ya existe una carrera con ese nombre.");
      } else {
        setErrorGeneral(apiErrorMessage(err, "No se pudo guardar la carrera. Probá de nuevo."));
      }
      setGuardando(false);
    }
  }

  return (
    <CatalogoFormLayout
      titulo={carrera ? "Editar carrera" : "Nueva carrera"}
      leyenda={
        <>
          <p>Carreras que se dictan en UTEC. Al crear un grupo, se elige una de estas carreras.</p>
          <p>En qué ITR se dicta cada carrera se define desde el alta o la edición del ITR.</p>
        </>
      }
      seccion={{ icon: GraduationCap, titulo: "Datos de la carrera" }}
      submitLabel={carrera ? "Guardar cambios" : "Crear carrera"}
      guardando={guardando}
      errorGeneral={errorGeneral}
      onSubmit={guardar}
    >
      <Campo
        id="carrera-nombre"
        label="Nombre"
        value={nombre}
        onChange={(v) => {
          setNombre(v);
          if (errorNombre) setErrorNombre("");
        }}
        error={errorNombre}
        maxLength={MAX_NOMBRE}
        disabled={guardando}
        required
      />
    </CatalogoFormLayout>
  );
}
