"use client";

import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "@/lib/api";
import { listarPorEstado, type FiltroEstado } from "@/lib/catalogos";

// Cómo se nombra cada catálogo en los mensajes: "Carrera desactivada", "Grupo desactivado".
export type Sustantivo = {
  singular: string;
  plural: string;
  femenino: boolean;
};

export function participio(s: Sustantivo, verbo: "creado" | "actualizado" | "desactivado" | "activado"): string {
  return s.femenino ? `${verbo.slice(0, -1)}a` : verbo;
}

const DURACION_MENSAJE_MS = 3000;

// Mensaje que se borra solo a los 3 s. Cada mensaje nuevo reinicia la cuenta.
export function useMensajeTemporal(inicial = ""): [string, (m: string) => void] {
  const [mensaje, setMensaje] = useState(inicial);
  useEffect(() => {
    if (!mensaje) return;
    const id = setTimeout(() => setMensaje(""), DURACION_MENSAJE_MS);
    return () => clearTimeout(id);
  }, [mensaje]);
  return [mensaje, setMensaje];
}

type Opciones<T> = {
  listar: (estado: string) => Promise<T[]>;
  idDe: (item: T) => number;
  nombreDe: (item: T) => string;
  desactivar: (id: number) => Promise<unknown>;
  reactivar: (id: number) => Promise<unknown>;
  sustantivo: Sustantivo;
  // Mensaje que trae la URL al volver de un alta o edición (?exito=).
  exitoInicial?: string;
};

// Estado y acciones comunes a las cinco pestañas: listado por estado, baja lógica con confirmación y reactivación. Después de cada cambio se vuelve a pedir el listado en vez de parchearlo a mano: ITR y Carrera traen datos derivados (carreras/ITRs asociados) que solo el backend sabe recalcular.
export function useCatalogo<T>({ listar, idDe, nombreDe, desactivar, reactivar, sustantivo, exitoInicial }: Opciones<T>) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("Todos");
  const [items, setItems] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  // El error de carga NO se borra solo: sin él, la tabla vacía diría "No se encontraron" cuando en realidad falló el GET.
  const [errorCarga, setErrorCarga] = useState("");
  const [exito, setExito] = useMensajeTemporal(exitoInicial);
  const [error, setError] = useMensajeTemporal();
  const [version, setVersion] = useState(0);
  const [accionEnCursoId, setAccionEnCursoId] = useState<number | null>(null);
  const [idADesactivar, setIdADesactivar] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarPorEstado(listar, filtroEstado)
      .then((res) => {
        if (cancelado) return;
        setItems(res);
        setErrorCarga("");
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorCarga(apiErrorMessage(err, `No se pudieron cargar ${sustantivo.femenino ? "las" : "los"} ${sustantivo.plural}.`));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
    // listar y sustantivo son estables por pestaña (vienen de constantes del módulo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  const itemADesactivar = items.find((i) => idDe(i) === idADesactivar);

  async function confirmarDesactivar() {
    if (idADesactivar == null) return;
    const id = idADesactivar;
    const nombre = itemADesactivar ? nombreDe(itemADesactivar) : "";
    setIdADesactivar(null);
    setAccionEnCursoId(id);
    setExito("");
    setError("");
    try {
      await desactivar(id);
      setExito(`${sustantivo.singular} ${participio(sustantivo, "desactivado")}${nombre ? `: ${nombre}` : ""}.`);
      recargar();
    } catch (err) {
      setError(apiErrorMessage(err, `No se pudo desactivar ${sustantivo.femenino ? "la" : "el"} ${sustantivo.singular.toLowerCase()}.`));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  async function handleReactivar(item: T) {
    const id = idDe(item);
    setAccionEnCursoId(id);
    setExito("");
    setError("");
    try {
      await reactivar(id);
      setExito(`${sustantivo.singular} ${participio(sustantivo, "activado")}: ${nombreDe(item)}.`);
      recargar();
    } catch (err) {
      setError(apiErrorMessage(err, `No se pudo activar ${sustantivo.femenino ? "la" : "el"} ${sustantivo.singular.toLowerCase()}.`));
    } finally {
      setAccionEnCursoId(null);
    }
  }

  return {
    items,
    cargando,
    errorCarga,
    error,
    exito,
    filtroEstado,
    setFiltroEstado,
    accionEnCursoId,
    itemADesactivar,
    pedirDesactivar: setIdADesactivar,
    cancelarDesactivar: () => setIdADesactivar(null),
    confirmarDesactivar,
    handleReactivar,
  };
}
