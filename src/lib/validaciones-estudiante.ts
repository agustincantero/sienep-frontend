import { isValidUruguayanCi } from "@/lib/document-validation";

// Reglas compartidas por el formulario de estudiante (StudentForm) y la edición de contacto de "Mi perfil".

// Mismo patrón para nombre/apellido/ciudad/departamento/calle/sistemaSalud —
// EstudianteRequestDTO/UpdateDTO usan exactamente este regex en los seis.
export const TEXTO_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 ]+$/;
export const TELEFONO_REGEX = /^[0-9]{8,12}$/;
export const TEXTO_INVALIDO_MSG = "Solo se permiten letras, números y espacios.";
export const NRO_PUERTA_INVALIDO_MSG = "Tiene que ser un número entero entre 1 y 9999.";
export const TELEFONO_INVALIDO_MSG = "Tiene que tener entre 8 y 12 dígitos numéricos.";


const DOCUMENTO_REGEX = /^[A-Za-z0-9]+$/;

// Rango de fecha de nacimiento aceptado (18 a 100 años), para el date picker.
const HOY = new Date();
export const FECHA_NACIMIENTO_MAX = new Date(HOY.getFullYear() - 18, HOY.getMonth(), HOY.getDate()).toISOString().slice(0, 10);
export const FECHA_NACIMIENTO_MIN = new Date(HOY.getFullYear() - 100, HOY.getMonth(), HOY.getDate()).toISOString().slice(0, 10);

// Valores del formulario de estudiante tal como se escriben (todo string salvo teléfonos y grupos).
export type EstudianteFormState = {
  nombre: string;
  apellido: string;
  documento: string;
  paisDocumento: string;
  email: string;
  fechaNacimiento: string;
  ciudad: string;
  departamento: string;
  calle: string;
  nroPuerta: string;
  telefonos: string[];
  idGrupos: number[];
  informacionSalud: string;
  sistemaSalud: string;
  motivoDerivacion: string;
};

// El orden de los checks importa: define qué campo se enfoca cuando falla
// la validación (el primero insertado acá), así que sigue el mismo orden
// en que los campos aparecen en la pantalla.
// En edición el documento no se valida: va deshabilitado y no se manda.
export function validarEstudiante(form: EstudianteFormState, esEdicion: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  // Vacío y formato inválido van por separado: con un solo if, un campo obligatorio vacío mostraba el mensaje de formato ("debe ser alfanumérico...") en vez de avisar que falta completarlo.
  if (!form.nombre.trim()) {
    e.nombre = "El nombre es obligatorio.";
  } else if (!TEXTO_REGEX.test(form.nombre)) {
    e.nombre = "Ingresá un nombre válido (solo letras, números y espacios).";
  }
  if (!form.apellido.trim()) {
    e.apellido = "El apellido es obligatorio.";
  } else if (!TEXTO_REGEX.test(form.apellido)) {
    e.apellido = "Ingresá un apellido válido (solo letras, números y espacios).";
  }
  if (!esEdicion) {
    if (!form.documento.trim()) {
      e.documento = "El documento es obligatorio.";
    } else if (!DOCUMENTO_REGEX.test(form.documento)) {
      e.documento = "El documento debe ser alfanumérico, sin espacios.";
    } else if (form.paisDocumento === "URY" && !isValidUruguayanCi(form.documento)) {
      e.documento = "La cédula uruguaya ingresada no es válida (dígito verificador incorrecto).";
    }
  }
  if (!form.email.trim()) {
    e.email = "El email es obligatorio.";
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    e.email = "Ingresá un email válido.";
  }
  if (!form.fechaNacimiento) {
    e.fechaNacimiento = "La fecha de nacimiento es obligatoria.";
  } else if (form.fechaNacimiento > FECHA_NACIMIENTO_MAX) {
    e.fechaNacimiento = "El estudiante debe ser mayor de edad (mínimo 18 años).";
  } else if (form.fechaNacimiento < FECHA_NACIMIENTO_MIN) {
    e.fechaNacimiento = "La fecha de nacimiento no puede ser mayor a 100 años.";
  }
  if (form.calle.trim() && !TEXTO_REGEX.test(form.calle)) {
    e.calle = TEXTO_INVALIDO_MSG;
  }
  if (form.nroPuerta) {
    const n = Number(form.nroPuerta);
    if (!Number.isInteger(n) || n < 1 || n > 9999) {
      e.nroPuerta = NRO_PUERTA_INVALIDO_MSG;
    }
  }
  if (form.ciudad.trim() && !TEXTO_REGEX.test(form.ciudad)) {
    e.ciudad = TEXTO_INVALIDO_MSG;
  }
  if (form.departamento.trim() && !TEXTO_REGEX.test(form.departamento)) {
    e.departamento = TEXTO_INVALIDO_MSG;
  }
  form.telefonos.forEach((tel, idx) => {
    if (tel.trim() && !TELEFONO_REGEX.test(tel.trim())) {
      e[`telefono-${idx}`] = TELEFONO_INVALIDO_MSG;
    }
  });
  if (form.sistemaSalud.trim() && !TEXTO_REGEX.test(form.sistemaSalud)) {
    e.sistemaSalud = TEXTO_INVALIDO_MSG;
  }
  return e;
}
