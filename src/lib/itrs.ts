import { apiGet } from "./api";

// Forma de GET /itrs (ItrResponseDTO). El backend solo manda los NOMBRES de
// las carreras asociadas, no sus id — para resolver el id hay que cruzar
// contra el catálogo de carreras (acá, el que ya se deriva de /grupos, mismo
// criterio que StudentsListView).
export type Itr = {
  idItr: number;
  nomItr: string;
  estado: string;
  carreras: string[];
};

// Sin ?estado=, el backend devuelve solo los ACTIVOS.
export function listItrs(): Promise<Itr[]> {
  return apiGet<Itr[]>("/itrs");
}
