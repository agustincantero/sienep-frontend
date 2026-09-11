import Image from "next/image";

const FOTOS = ["/login/campus-1.jpg", "/login/campus-2.jpg", "/login/campus-3.jpg"];

// Fondo decorativo del chrome de auth: fotos del campus en cross-fade lento (ver .login-slideshow
// en globals.css) + un filtro celeste (.login-wash) para que el texto blanco de encima tenga
// contraste. Puramente decorativo (aria-hidden): no aporta información, así que no lleva alt.
export function LoginBackground() {
  return (
    <div aria-hidden className="login-slideshow">
      {FOTOS.map((src) => (
        <div key={src} className="login-slideshow__frame">
          <Image src={src} alt="" fill priority sizes="100vw" />
        </div>
      ))}
      <div className="login-wash" />
    </div>
  );
}
