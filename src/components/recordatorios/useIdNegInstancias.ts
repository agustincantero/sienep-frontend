"use client";

import { useApi } from "@/hooks/useApi";
import { TOPE_LISTADO } from "@/lib/buscar-estudiante";
import { listInstancias } from "@/lib/instancias";

const SIN_IDS = new Map<number, string>();

// RecordatorioResponseDTO trae codInstancia y tituloInstancia, pero no el identificador de negocio de la instancia (INST-AAAA-NNNNNN), que es como se la reconoce en el resto de la app. Se resuelve acá con una sola consulta de instancias activas e inactivas. Si falla (o la instancia es una incidencia, que no sale en /instancias), el mapa no la tiene y quien lo usa cae al título.
export function useIdNegInstancias(): Map<number, string> {
  const { data: mapa } = useApi(
    () =>
      listInstancias({ estado: "ACTIVO,INACTIVO", size: TOPE_LISTADO }).then(
        (p) => new Map(p.content.filter((i) => i.idNegInstancia).map((i) => [i.codInstancia, i.idNegInstancia!])),
      ),
    [],
    { inicial: SIN_IDS, mensajeError: "" },
  );
  return mapa;
}
