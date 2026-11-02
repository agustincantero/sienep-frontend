// Espeja el CHECK de proyecto.dom_email (proyecto_schema.sql, VARCHAR(50)) y no el @Email de los DTO, que es más permisivo y deja pasar mails que la base después rechaza.
const EMAIL_REGEX =
  /^(?=.{1,50}$)[a-z0-9%+_-]+(?:\.[a-z0-9%+_-]+)*@[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*\.[a-z]{2,}$/i;

export const EMAIL_INVALIDO_MSG = "Ingresá un email válido.";

export function esEmailValido(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}
