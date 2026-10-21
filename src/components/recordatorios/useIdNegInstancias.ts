"use client";

import { useEffect, useState } from "react";
import { TOPE_LISTADO } from "@/lib/buscar-estudiante";
import { listInstancias } from "@/lib/instancias";

// RecordatorioResponseDTO trae codInstancia y tituloInstancia, pero no el identificador de negocio de la instancia (INST-AAAA-NNNNNN), que es como se la reconoce en el resto de la app. Se resuelve acá con una sola consulta de instancias activas e inactivas. Si falla (o la instancia es una incidencia, que no sale en /instancias), el mapa no la tiene y quien lo usa cae al título.
export function useIdNegInstancias(): Map<number, string> {
  const [mapa, setMapa] = useState<Map<number, string>>(() => new Map());

  useEffect(() => {
    let cancelado = false;
    listInstancias({ estado: "ACTIVO,INACTIVO", size: TOPE_LISTADO })
      .then((p) => {
        if (cancelado) return;
        setMapa(new Map(p.content.filter((i) => i.idNegInstancia).map((i) => [i.codInstancia, i.idNegInstancia!])));
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  return mapa;
}
