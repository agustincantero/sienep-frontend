// Claves de TanStack Query: el "nombre" bajo el que se guarda cada dato pedido al backend.
// Reglas:
//  - Todo lo que cambia el resultado va en la clave (un id, un filtro, la página); si cambia, Query vuelve a pedir solo.
//  - Van de lo general a lo particular: invalidar ["estudiantes"] alcanza a todas las que empiezan así (listados, fichas, paneles).
//  - Siempre se arman acá, nunca a mano en el componente, para que "leer" e "invalidar" usen exactamente la misma clave.
export const claves = {
  estudiantes: {
    todos: ["estudiantes"] as const,
    lista: (filtros: object) => ["estudiantes", "lista", filtros] as const,
    ficha: (id: number) => ["estudiantes", "ficha", id] as const,
    procesosAbiertos: (id: number) => ["estudiantes", "ficha", id, "procesos-abiertos"] as const,
    historial: (id: number, tipo: "instancias" | "incidencias") => ["estudiantes", "ficha", id, tipo] as const,
    comentarios: (id: number) => ["estudiantes", "ficha", id, "comentarios"] as const,
    informes: (id: number) => ["estudiantes", "ficha", id, "informes"] as const,
  },
  grupos: ["grupos"] as const,
  itrs: ["itrs"] as const,
};
