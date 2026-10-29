"use client";

import { useCallback, useEffect, useState, type DependencyList, type Dispatch, type SetStateAction } from "react";
import { apiErrorMessage } from "@/lib/api";

type Opciones<T> = {
  // Mensaje si el backend no manda uno propio.
  mensajeError: string;
  // Valor mientras carga o si falla: [] en listados para no tener que chequear null.
  inicial: T;
};

type Resultado<T> = {
  data: T;
  // Para parchear el estado local después de una acción sin volver a pedir todo.
  setData: Dispatch<SetStateAction<T>>;
  // Solo es true en la primera carga: al refiltrar o recargar se siguen mostrando los datos anteriores hasta que llegan los nuevos.
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
  { mensajeError, inicial = null as T }: Omit<Opciones<T>, "inicial"> & { inicial?: T },
): Resultado<T> {
  const [data, setData] = useState<T>(inicial);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;
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
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
    // Las deps las define quien llama; fetcher y mensajeError se recrean en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  return { data, setData, cargando, errorCarga, recargar };
}
