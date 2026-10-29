"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronsLeft, Hand } from "lucide-react";

// Marca en sessionStorage que el ícono de deslizar ya se vio en esta sesión, así aparece una sola vez y no en cada tabla.
const CLAVE_PISTA = "pista-desplazamiento-tabla";
// Milisegundos que el ícono de deslizar queda visible si nadie toca ni desplaza la tabla antes.
const DURACION_PISTA = 4500;
// Guarda qué instancia de la tabla está mostrando el ícono ahora mismo, para que dos tablas en la misma pantalla no lo muestren juntas antes de que una lo descarte en sessionStorage.
let pistaEnPantalla: object | null = null;

function pistaYaVista(): boolean {
  try {
    return sessionStorage.getItem(CLAVE_PISTA) !== null;
  } catch {
    return false;
  }
}

// Un header puede ser un string (alineado a la izquierda) o un objeto con `align` para columnas como "Identificador" que leen mejor centradas.
export type DataTableHeader = string | { label: string; align?: "center" | "right" };

type DataTableProps = {
  headers: DataTableHeader[];
  children: React.ReactNode;
};

// Tabla compartida por los listados. En pantallas angostas se desplaza en horizontal y lo avisa con sombras en los bordes (siempre que haya más columnas de ese lado) y con un ícono de deslizar que aparece una vez por sesión.
export function DataTable({ headers, children }: DataTableProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  // Sigue el estado de la pista en esta tabla ("inactiva" en escritorio o tras descartarla) para no escribir en sessionStorage en cada scroll y para no mostrarla a los 700 ms si ya hubo un toque.
  const estadoPistaRef = useRef<"inactiva" | "pendiente" | "visible">("inactiva");
  // Si queda contenido fuera de la vista a la izquierda y a la derecha, para mostrar la sombra de cada borde.
  const [bordes, setBordes] = useState({ izquierda: false, derecha: false });
  // Si el ícono de deslizar se está mostrando.
  const [pista, setPista] = useState(false);

  // La pista se da por vista al ocultarse y no al aparecer, así que si la tabla se desmonta enseguida (el listado de estudiantes se vuelve a montar al restaurar sus filtros) la próxima todavía la muestra.
  const descartarPista = useCallback(() => {
    if (estadoPistaRef.current === "inactiva") return;
    if (estadoPistaRef.current === "visible") {
      pistaEnPantalla = null;
      setPista(false);
    }
    estadoPistaRef.current = "inactiva";
    try {
      sessionStorage.setItem(CLAVE_PISTA, "1");
    } catch {}
  }, []);

  const medirBordes = useCallback(() => {
    const el = contenedorRef.current;
    if (!el) return;
    // El margen de 1 px evita sombras fantasma por los redondeos de scrollLeft (zoom o pantallas de densidad fraccionaria).
    const izquierda = el.scrollLeft > 1;
    const derecha = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
    setBordes((b) => (b.izquierda === izquierda && b.derecha === derecha ? b : { izquierda, derecha }));
  }, []);

  // Las sombras de los bordes avisan que hay columnas fuera de la vista, y se recalculan al cambiar el tamaño del contenedor o de la tabla (por ejemplo al paginar o al girar el celular).
  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return;
    const observador = new ResizeObserver(medirBordes);
    observador.observe(el);
    const tabla = el.querySelector("table");
    if (tabla) observador.observe(tabla);
    return () => observador.disconnect();
  }, [medirBordes]);

  // Muestra el ícono de deslizar una vez por sesión, solo en pantallas angostas (menos de 768 px, el md de Tailwind) y si la tabla de verdad se desborda.
  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    if (pistaEnPantalla || pistaYaVista()) return;

    const instancia = {};
    estadoPistaRef.current = "pendiente";
    let ocultar: ReturnType<typeof setTimeout> | undefined;
    // La pausa de 700 ms deja que la tabla termine de montarse y medirse, y evita mostrar el ícono si la persona ya la tocó o desplazó.
    const mostrar = setTimeout(() => {
      if (estadoPistaRef.current !== "pendiente") return;
      if (pistaEnPantalla || pistaYaVista() || el.scrollWidth <= el.clientWidth || el.scrollLeft > 0) {
        estadoPistaRef.current = "inactiva";
        return;
      }
      estadoPistaRef.current = "visible";
      pistaEnPantalla = instancia;
      setPista(true);
      ocultar = setTimeout(descartarPista, DURACION_PISTA);
    }, 700);

    return () => {
      if (pistaEnPantalla === instancia) pistaEnPantalla = null;
      estadoPistaRef.current = "inactiva";
      clearTimeout(mostrar);
      clearTimeout(ocultar);
    };
  }, [descartarPista]);

  return (
    <div className="relative">
      {/* El contenedor externo es relative para ubicar encima el ícono y las sombras. Cualquier toque o desplazamiento sobre la tabla descarta el ícono. */}
      <div
        ref={contenedorRef}
        onScroll={() => {
          medirBordes();
          descartarPista();
        }}
        onTouchStart={descartarPista}
        className="overflow-x-auto"
      >
        {/* Encabezados al 70 % porque el 60 % de daisyUI da 4,11:1 de contraste, menos del 4,5:1 de WCAG AA. */}
        <table className="table align-middle [&_thead]:text-base-content/70 [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-150 [&_tbody_tr:hover]:bg-base-200">
          <thead>
            <tr>
              {headers.map((hd) => {
                const label = typeof hd === "string" ? hd : hd.label;
                const align = typeof hd === "string" ? undefined : hd.align;
                // Clases completas a mano (no `text-${align}`): un template literal armado en runtime no lo detecta el escaneo estático de Tailwind y la clase queda afuera del CSS compilado.
                const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : undefined;
                return (
                  <th key={label} className={alignClass}>
                    {/* Columna de acciones sin título visible: se le da nombre accesible para los lectores de pantalla. */}
                    {label || <span className="sr-only">Acciones</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {/* Ícono de deslizar. No recibe toques ni se anuncia a lectores de pantalla, y la mano solo se anima si no hay preferencia de movimiento reducido (motion-safe). */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-16 flex justify-center transition-opacity duration-500 ${pista ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex items-center gap-2 rounded-full bg-base-content/75 px-4 py-2 text-base-100 shadow-lg">
          <Hand size={20} className="motion-safe:animate-[deslizar-mano_1.1s_ease-in-out_infinite]" />
          <ChevronsLeft size={18} />
        </div>
      </div>
      {/* Sombras de los bordes, con un degradado de tres paradas (15 %, 5 % y transparente) para que se noten sin parecer una barra. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-4 bg-linear-to-r from-base-content/15 via-base-content/5 to-transparent transition-opacity ${bordes.izquierda ? "opacity-100" : "opacity-0"}`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-4 bg-linear-to-l from-base-content/15 via-base-content/5 to-transparent transition-opacity ${bordes.derecha ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
