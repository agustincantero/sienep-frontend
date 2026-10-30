"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Users, X } from "lucide-react";
import { listGroups, type Group } from "@/lib/groups";
import { listItrs, type Itr } from "@/lib/itrs";
import { Field } from "@/components/ui/Field";
import { SeccionCard, SeccionLegend } from "@/components/ui/SeccionFormulario";

// Sección "Grupos" de StudentForm: carga /grupos y /itrs y deja elegir los grupos con la cascada ITR → carrera.
// `idGrupos` llega con los grupos vigentes del estudiante en la edición y vacío en el alta.
export function SelectorGrupos({
  idGrupos,
  onChange,
  guardando,
}: {
  idGrupos: number[];
  onChange: React.Dispatch<React.SetStateAction<number[]>>;
  guardando: boolean;
}) {
  // Grupos con los que se abrió el formulario: el selector ITR/carrera se posiciona en ellos (ver más abajo).
  const [idGruposIniciales] = useState(idGrupos);
  const [grupos, setGrupos] = useState<Group[]>([]);
  // true solo si /grupos respondió bien (aunque venga vacío): con el catálogo vacío igual hay que limpiar
  // los grupos inactivos, pero si la llamada falló no se sabe cuáles siguen activos y no se toca la selección.
  const [gruposCargados, setGruposCargados] = useState(false);
  const [itrs, setItrs] = useState<Itr[]>([]);
  // Distingue "todavía no llegó /itrs" de "llegó vacío o falló": sin esto, la sección
  // de grupos mostraría un instante la lista plana de respaldo antes de pasar al selector.
  const [itrsListos, setItrsListos] = useState(false);
  const [filtroItr, setFiltroItr] = useState<number | "">("");
  const [filtroCarrera, setFiltroCarrera] = useState<number | "">("");
  const [autoseleccionoFiltro, setAutoseleccionoFiltro] = useState(false);

  useEffect(() => {
    listGroups()
      .then((lista) => {
        setGrupos(lista);
        setGruposCargados(true);
      })
      .catch(() => setGrupos([]));
    // Si /itrs falla, la sección cae a la lista plana (ver más abajo) en vez de
    // quedar sin forma de asignar: asignar un grupo solo debe depender de que /grupos responda.
    listItrs()
      .then(setItrs)
      .catch(() => setItrs([]))
      .finally(() => setItrsListos(true));
  }, []);

  // Las carreras no tienen catálogo propio acá: se derivan de los grupos ya
  // cargados (mismo criterio que StudentsListView — cada Grupo trae
  // idCarrera/nomCarrera, y toda carrera relevante tiene al menos un grupo).
  const carreras = useMemo(() => {
    const vistas = new Map<string, number>();
    for (const g of grupos) vistas.set(g.nomCarrera, g.idCarrera);
    return [...vistas.entries()].map(([nomCarrera, idCarrera]) => ({ nomCarrera, idCarrera }));
  }, [grupos]);

  // No todos los ITR tienen todas las carreras — ItrResponseDTO.carreras solo
  // trae nombres (no ids), así que se cruza por nombre contra `carreras`. El cruce
  // es seguro: proyecto.carreras.nom_carrera es UNIQUE y tanto /itrs (ItrMapper) como
  // /grupos (GrupoMapper) devuelven esa misma columna, así que para una misma carrera
  // el string es idéntico en ambos y no hay dos carreras con el mismo nombre.
  const carrerasDelItr = useMemo(() => {
    if (filtroItr === "") return [];
    const itr = itrs.find((i) => i.idItr === filtroItr);
    if (!itr) return [];
    const nombres = new Set(itr.carreras);
    return carreras.filter((c) => nombres.has(c.nomCarrera));
  }, [filtroItr, itrs, carreras]);

  const gruposDeLaCarrera = useMemo(() => {
    if (filtroCarrera === "") return [];
    return grupos.filter((g) => g.idCarrera === filtroCarrera);
  }, [filtroCarrera, grupos]);

  const gruposSeleccionados = useMemo(
    () => grupos.filter((g) => idGrupos.includes(g.idGrupo)),
    [grupos, idGrupos],
  );

  // El catálogo trae solo los grupos ACTIVOS. Si el estudiante sigue en un grupo dado de baja, se saca de la
  // selección al llegar el catálogo: el backend rechaza con 422 cualquier grupo inactivo y no dejaría guardar
  // ningún otro cambio. Es lo mismo que pasaba cuando los grupos se resolvían por nombre contra este catálogo.
  // También corre con el catálogo vacío: ahí la sección no se muestra y sin limpiar quedaría un 422 imposible de corregir.
  useEffect(() => {
    if (!gruposCargados) return;
    const activos = new Set(grupos.map((g) => g.idGrupo));
    onChange((ids) => ids.filter((id) => activos.has(id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr cuando el catálogo de grupos llega
  }, [grupos, gruposCargados]);

  // Al editar, arranca el selector de ITR/carrera ya posicionado en el grupo
  // vigente del estudiante, en vez de forzarlo a rearmar el camino ITR →
  // carrera desde cero para ver algo que ya está seleccionado. Solo una vez
  // (autoseleccionoFiltro) para no pisar una navegación manual posterior.
  // Mira los grupos con los que se abrió el formulario y no la selección actual: si no, en el alta el
  // filtro saltaba solo al primer ITR de la carrera apenas se elegía el primer grupo.
  // Se ajusta durante el render y no en un efecto, como recomienda React para estado derivado de props.
  if (!autoseleccionoFiltro && itrs.length > 0) {
    const primerGrupo = grupos.find((g) => idGruposIniciales.includes(g.idGrupo));
    if (primerGrupo) {
      const itrDeLaCarrera = itrs.find((i) => i.carreras.includes(primerGrupo.nomCarrera));
      setAutoseleccionoFiltro(true);
      setFiltroCarrera(primerGrupo.idCarrera);
      if (itrDeLaCarrera) setFiltroItr(itrDeLaCarrera.idItr);
    }
  }

  function alternarFiltroItr(value: string) {
    setFiltroItr(value ? Number(value) : "");
    setFiltroCarrera("");
  }

  function alternarGrupo(idGrupo: number) {
    onChange((ids) => (ids.includes(idGrupo) ? ids.filter((id) => id !== idGrupo) : [...ids, idGrupo]));
  }

  // La sección depende solo de /grupos, como antes del selector por ITR: sin grupos no hay
  // nada que asignar. /itrs solo decide CÓMO se elige (ver más abajo).
  if (grupos.length === 0) return null;

  return (
    <SeccionCard>
      <SeccionLegend icon={Users}>Grupos</SeccionLegend>

      {!itrsListos ? (
        <span className="loading loading-spinner loading-sm" role="status" aria-label="Cargando grupos" />
      ) : itrs.length === 0 ? (
        /* Respaldo: /itrs falló o no devolvió ningún ITR activo. Sin ITR no hay cascada
           posible, así que se ofrece la lista plana de todos los grupos, igual que antes
           del selector por ITR/carrera. */
        <div className="flex flex-wrap gap-2">
          {grupos.map((g) => (
            <GrupoChip
              key={g.idGrupo}
              seleccionado={idGrupos.includes(g.idGrupo)}
              disabled={guardando}
              onToggle={() => alternarGrupo(g.idGrupo)}
            >
              {g.nomGrupo} — {g.nomCarrera}
            </GrupoChip>
          ))}
        </div>
      ) : (
        <>
          {gruposSeleccionados.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-base-content/70 mb-1">Asignados</p>
              {/* Se muestran siempre, sin importar el filtro ITR/carrera vigente —
                  si no, cambiar el filtro para agregar otro grupo hace "desaparecer"
                  de la vista uno ya elegido, aunque siga asignado. */}
              <div className="flex flex-wrap gap-2">
                {gruposSeleccionados.map((g) => (
                  <span key={g.idGrupo} className="badge badge-primary gap-1.5 h-auto min-h-6 py-1 max-w-full text-left wrap-anywhere">
                    {g.nomGrupo} · {g.generacion} — {g.nomCarrera}
                    <button
                      type="button"
                      className="hover:opacity-70"
                      onClick={() => alternarGrupo(g.idGrupo)}
                      disabled={guardando}
                      aria-label={`Quitar ${g.nomGrupo}`}
                    >
                      <X size={12} aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="ITR" fieldKey="itr">
              <select
                className="select w-full"
                value={filtroItr}
                onChange={(e) => alternarFiltroItr(e.target.value)}
                disabled={guardando}
              >
                <option value="">Seleccioná un ITR</option>
                {itrs.map((i) => (
                  <option key={i.idItr} value={i.idItr}>
                    {i.nomItr}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Carrera" fieldKey="carrera">
              <select
                className="select w-full"
                value={filtroCarrera}
                onChange={(e) => setFiltroCarrera(e.target.value ? Number(e.target.value) : "")}
                disabled={guardando || filtroItr === ""}
              >
                <option value="">
                  {filtroItr === "" ? "Elegí un ITR primero" : "Seleccioná una carrera"}
                </option>
                {carrerasDelItr.map((c) => (
                  <option key={c.idCarrera} value={c.idCarrera}>
                    {c.nomCarrera}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {filtroCarrera !== "" ? (
            gruposDeLaCarrera.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {gruposDeLaCarrera.map((g) => (
                  <GrupoChip
                    key={g.idGrupo}
                    seleccionado={idGrupos.includes(g.idGrupo)}
                    disabled={guardando}
                    onToggle={() => alternarGrupo(g.idGrupo)}
                  >
                    {g.nomGrupo} · {g.generacion}
                  </GrupoChip>
                ))}
              </div>
            ) : (
              <p className="text-sm text-base-content/70">No hay grupos activos para esta carrera.</p>
            )
          ) : null}
        </>
      )}
    </SeccionCard>
  );
}

// Chip seleccionable de un grupo. Es el mismo botón-checkbox que usan la cascada ITR → carrera y
// el respaldo de lista plana, extraído para no duplicarlo. Chips en vez de checkboxes con texto: el
// estado seleccionado/no seleccionado se ve de un vistazo, mismo lenguaje que los badges de estado
// del estudiante. El <input> real queda oculto pero maneja el estado accesible.
function GrupoChip({
  seleccionado,
  disabled,
  onToggle,
  children,
}: {
  seleccionado: boolean;
  disabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`btn btn-sm rounded-full normal-case font-normal h-auto min-h-8 py-1 max-w-full wrap-anywhere has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
        seleccionado ? "btn-primary" : "btn-outline"
      }${disabled ? " btn-disabled" : ""}`}
    >
      <input type="checkbox" className="sr-only" checked={seleccionado} onChange={onToggle} disabled={disabled} />
      {seleccionado ? <Check size={14} aria-hidden /> : null}
      {children}
    </label>
  );
}
