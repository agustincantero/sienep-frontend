"use client";

import { useCallback, useEffect, useState, type DependencyList, type Dispatch, type SetStateAction } from "react";
import { apiErrorMessage } from "@/lib/api";

type Opciones<T> = {
  // Mensaje si el backend no manda uno propio.
  mensajeError: string;
  // Valor mientras carga o si falla: [] en listados para no tener que chequear null.
  inicial: T;
  // Vuelve a mostrar el spinner cuando cambian las deps (no al recargar), para no dejar a la vista filas del filtro o la página anterior.
  spinnerAlCambiar?: boolean;
  // Mientras sea true no se pide nada y cargando queda como está (ej. falta un dato del que depende la consulta).
  esperar?: boolean;
};

type Resultado<T> = {
  data: T;
  // Para parchear el estado local después de una acción sin volver a pedir todo.
  setData: Dispatch<SetStateAction<T>>;
  // Por defecto solo es true en la primera carga: al refiltrar o recargar se siguen mostrando los datos anteriores hasta que llegan los nuevos.
  cargando: boolean;
  // El error de carga NO se borra solo: sin él, una tabla vacía diría "No se encontraron" cuando en realidad falló el GET.
  errorCarga: string;
  recargar: () => void;
};

// Carga con descarte de respuestas viejas: si cambian las deps (o se desmonta) antes de que vuelva el GET, su resultado se ignora.
// El fetcher se lee en el render en que cambian las deps, así que puede cerrar sobre ellas sin listarlas aparte.
export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList, opciones: Opciones<T>): Resultado<T>;
export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList, opciones: Omit<Opciones<T>, "inicial">): Resultado<T | null>;
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  { mensajeError, inicial = null as T, spinnerAlCambiar = false, esperar = false }: Omit<Opciones<T>, "inicial"> & { inicial?: T },
): Resultado<T> {
  const [data, setData] = useState<T>(inicial);
  // Deps de la última carga terminada (bien o mal); null hasta la primera. cargando se deriva de acá en vez de prenderlo dentro del efecto.
  const [cargadoPara, setCargadoPara] = useState<DependencyList | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (esperar) return;
    let cancelado = false;
    const depsDeEstaCarga = deps;
    fetcher()
      .then((res) => {
        if (cancelado) return;
        setData(res);
        setErrorCarga("");
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorCarga(apiErrorMessage(err, mensajeError));
      })
      .finally(() => {
        if (!cancelado) setCargadoPara(depsDeEstaCarga);
      });
    return () => {
      cancelado = true;
    };
    // Las deps las define quien llama; fetcher y mensajeError se recrean en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version, esperar]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  const cargando = cargadoPara === null || (spinnerAlCambiar && !mismasDeps(cargadoPara, deps));

  return { data, setData, cargando, errorCarga, recargar };
}

function mismasDeps(a: DependencyList, b: DependencyList): boolean {
  return a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
}
