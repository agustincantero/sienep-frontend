"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Cliente de TanStack Query para el área autenticada. Los defaults de la librería no encajan con esta app:
//  - retry: por defecto reintenta 3 veces. Acá un 403/404/409 es una respuesta válida del backend, y el 401 ya lo maneja src/lib/api.ts.
//  - refetchOnWindowFocus: por defecto vuelve a pedir todo al volver a la pestaña. No hace falta y recarga listados mientras se está leyendo.
//  - gcTime 0: al salir de una pantalla se descarta lo que se pidió, así que al volver siempre se ve el dato fresco del backend y no una copia vieja (permisos, estados). Si más adelante conviene compartir cache entre pantallas (ej. catálogos), se sube en esa consulta puntual.
// Se crea dentro de useState (y no a nivel de módulo) para que cada navegador tenga el suyo y el servidor no comparta uno entre usuarios.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false, staleTime: 0, gcTime: 0 },
          mutations: { retry: false },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
