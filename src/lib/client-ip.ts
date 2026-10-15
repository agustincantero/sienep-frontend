// Headers que identifican al cliente real ante el backend: el proxy genérico ya reenvía todos los de la request, pero los handlers de auth y el logout arman sus propios headers y sin esto el backend vería la IP de salida de Vercel.
export function headersIpCliente(origen: Headers): Record<string, string> {
  // Vercel pisa estos headers con la IP real, así que el cliente no puede falsearlos desde afuera.
  const crudo = origen.get("x-vercel-forwarded-for") ?? origen.get("x-forwarded-for");
  const ip = crudo?.split(",")[0]?.trim();
  if (!ip || ip.length > 45) return {};
  return { "X-Forwarded-For": ip };
}
