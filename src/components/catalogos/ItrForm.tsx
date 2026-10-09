"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, TriangleAlert } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { listCarreras, type Carrera } from "@/lib/carreras";
import { compararTexto, esNombreRepetido } from "@/lib/catalogos";
import { hrefListado } from "@/lib/catalogos-tabs";
import { createItr, updateItr, type Itr } from "@/lib/itrs";
import { useSession } from "@/lib/session-context";
import { CatalogoFormLayout } from "./CatalogoFormLayout";
import { Campo } from "./Campo";
import { useMensajeTemporal } from "./useCatalogo";

const MAX_NOMBRE = 80;

export function ItrForm({ itr }: { itr?: Itr }) {
  const router = useRouter();
  const { permisos } = useSession();
  const puedeVerCarreras = permisos.includes("VER_CARRERAS");

  const [nombre, setNombre] = useState(itr?.nomItr ?? "");
  // Por nombre y no por id: GET /itrs solo trae los NOMBRES de las carreras (ItrResponseDTO), y así la selección inicial vale aunque el catálogo de carreras todavía no haya llegado. Los ids se resuelven al guardar.
  const [seleccion, setSeleccion] = useState<string[]>(itr ? [...itr.carreras] : []);
  const [errorNombre, setErrorNombre] = useState("");
  const [errorGeneral, setErrorGeneral] = useMensajeTemporal();
  const [guardando, setGuardando] = useState(false);

  // Catálogo de carreras ACTIVAS para los checkboxes: ItrService rechaza asociar una inactiva (422). null = todavía no cargó o no se pudo cargar.
  const [carreras, setCarreras] = useState<Carrera[] | null>(null);
  const [errorCarreras, setErrorCarreras] = useState("");

  useEffect(() => {
    if (!puedeVerCarreras) return;
    listCarreras("ACTIVO")
      .then((res) => setCarreras([...res].sort((a, b) => compararTexto(a.nomCarrera, b.nomCarrera))))
      .catch((err) => setErrorCarreras(apiErrorMessage(err, "No se pudo cargar el catálogo de carreras.")));
  }, [puedeVerCarreras]);

  const avisoCarreras = puedeVerCarreras ? errorCarreras : "Para asociar carreras a un ITR necesitás el permiso de ver carreras.";
  const sinCatalogo = carreras == null;
  // En la edición el PUT REEMPLAZA las asociaciones: sin el catálogo de carreras se mandaría [] y el ITR perdería todas sus carreras. En el alta sí se puede crear sin carreras y asociarlas después.
  const bloquearGuardado = itr != null && sinCatalogo;
  const cantidadElegidas = carreras ? carreras.filter((c) => seleccion.includes(c.nomCarrera)).length : 0;

  function toggleCarrera(nomCarrera: string) {
    setSeleccion((prev) => (prev.includes(nomCarrera) ? prev.filter((x) => x !== nomCarrera) : [...prev, nomCarrera]));
  }

  async function guardar() {
    const valor = nombre.trim();
    setErrorGeneral("");
    if (!valor || valor.length > MAX_NOMBRE) {
      setErrorNombre(!valor ? "El nombre es obligatorio." : `El nombre no puede superar los ${MAX_NOMBRE} caracteres.`);
      document.getElementById("itr-nombre")?.focus();
      return;
    }
    if (bloquearGuardado) return;
    // Nombre de carrera → id contra el catálogo (el nombre es único en la tabla carreras).
    const carrerasIds = (carreras ?? []).filter((c) => seleccion.includes(c.nomCarrera)).map((c) => c.idCarrera);
    setGuardando(true);
    try {
      if (itr) {
        await updateItr(itr.idItr, { nomItr: valor, carrerasIds });
      } else {
        await createItr({ nomItr: valor, carrerasIds });
      }
      router.push(hrefListado("itrs", `ITR ${itr ? "actualizado" : "creado"}: ${valor}.`));
    } catch (err) {
      if (esNombreRepetido(err)) {
        setErrorNombre("Ya existe un ITR con ese nombre.");
      } else {
        setErrorGeneral(apiErrorMessage(err, "No se pudo guardar el ITR. Probá de nuevo."));
      }
      setGuardando(false);
    }
  }

  return (
    <CatalogoFormLayout
      titulo={itr ? "Editar ITR" : "Nuevo ITR"}
      leyenda={
        <>
          <p>Institutos Tecnológicos Regionales y las carreras que dicta cada uno.</p>
          <p>Al dar de alta un estudiante, el ITR acota qué carreras y grupos se ofrecen.</p>
          <p>Solo se listan las carreras activas. Si el ITR ya tenía asociada una carrera que hoy está inactiva, ese vínculo se conserva al guardar y vuelve a aparecer cuando se reactiva la carrera.</p>
        </>
      }
      seccion={{ icon: Building2, titulo: "Datos del ITR" }}
      submitLabel={itr ? "Guardar cambios" : "Crear ITR"}
      guardando={guardando}
      errorGeneral={errorGeneral}
      bloquearGuardado={bloquearGuardado}
      onSubmit={guardar}
    >
      <Campo
        id="itr-nombre"
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

      <div>
        <p className="text-sm font-semibold mb-2">
          Carreras que dicta
          {carreras ? (
            <span className="font-normal text-base-content/60">
              {" "}
              ({cantidadElegidas} {cantidadElegidas === 1 ? "elegida" : "elegidas"})
            </span>
          ) : null}
        </p>
        {avisoCarreras ? (
          // Mismo par ámbar que RolForm: el --color-warning de daisyUI no llega a 4.5:1 como texto.
          <div role="alert" className="alert bg-amber-50 text-amber-800 border border-amber-200 text-sm">
            <TriangleAlert size={16} aria-hidden />
            <span>
              {avisoCarreras}
              {itr ? " Sin ese catálogo no se pueden guardar cambios en el ITR." : " Podés crear el ITR sin carreras y asociarlas después."}
            </span>
          </div>
        ) : sinCatalogo ? (
          <span className="loading loading-spinner loading-sm" role="status" aria-label="Cargando carreras" />
        ) : carreras.length === 0 ? (
          <p className="text-sm text-base-content/60">No hay carreras activas para asociar.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {carreras.map((c) => {
              const inputId = `itr-carrera-${c.idCarrera}`;
              return (
                <div key={c.idCarrera} className="flex items-start gap-2 min-w-0">
                  <input
                    type="checkbox"
                    id={inputId}
                    className="checkbox checkbox-sm mt-0.5 shrink-0"
                    checked={seleccion.includes(c.nomCarrera)}
                    onChange={() => toggleCarrera(c.nomCarrera)}
                    disabled={guardando}
                  />
                  <label htmlFor={inputId} className="text-sm leading-tight min-w-0 wrap-anywhere">
                    {c.nomCarrera}
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CatalogoFormLayout>
  );
}
