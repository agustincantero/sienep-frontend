// Reglas compartidas por el formulario de estudiante (StudentForm) y la edición de contacto de "Mi perfil".

// Mismo patrón para nombre/apellido/ciudad/departamento/calle/sistemaSalud —
// EstudianteRequestDTO/UpdateDTO usan exactamente este regex en los seis.
export const TEXTO_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 ]+$/;
export const TELEFONO_REGEX = /^[0-9]{8,12}$/;
export const TEXTO_INVALIDO_MSG = "Solo se permiten letras, números y espacios.";
export const NRO_PUERTA_INVALIDO_MSG = "Tiene que ser un número entero entre 1 y 9999.";
export const TELEFONO_INVALIDO_MSG = "Tiene que tener entre 8 y 12 dígitos numéricos.";
