// Validación de cédula uruguaya por dígito verificador. Puerto directo del
// algoritmo de ValidadorDeCedulasUy.java (backend) para dar feedback
// inmediato en el formulario — el backend sigue siendo la validación
// autoritativa, esto es solo UX.
const PESOS = [2, 9, 8, 7, 6, 3, 4];

export function isValidUruguayanCi(documento: string): boolean {
  const digits = documento.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 8) return false;

  const padded = digits.padStart(8, "0");
  let suma = 0;
  for (let i = 0; i < PESOS.length; i++) {
    suma += Number(padded[i]) * PESOS[i];
  }

  const digitoEsperado = (10 - (suma % 10)) % 10;
  return Number(padded[7]) === digitoEsperado;
}
