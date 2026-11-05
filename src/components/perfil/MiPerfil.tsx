"use client";

import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useFotoPerfil } from "@/lib/foto-perfil-context";
import { useSession } from "@/lib/session-context";
import { uploadFuncionarioFoto } from "@/lib/funcionarios";
import { getMiPerfil, uploadStudentPhoto } from "@/lib/students";
import { EstadoBadge } from "@/components/students/EstadoBadge";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { CambiarContraseniaForm } from "./CambiarContraseniaForm";
import { ContactoCard } from "./ContactoCard";
import { Dato } from "./Dato";
import { SeccionCard } from "./SeccionCard";

const EXTENSIONES_FOTO = [".jpg", ".jpeg", ".png"];
const MAX_FOTO_BYTES = 5 * 1024 * 1024;

// "Mi perfil" para funcionario y estudiante. Además de la contraseña, tanto el estudiante como el funcionario pueden cambiar su foto, y solo el estudiante edita sus datos de contacto (dirección y teléfonos).
export function MiPerfil() {
  const user = useSession();
  const esEstudiante = user.tipo === "ESTUDIANTE";

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[720px] mx-auto w-full px-4 py-5">
        <h1 className="text-xl font-bold mb-4">Mi perfil</h1>
        <div className="space-y-6">
          {esEstudiante ? <PerfilEstudiante /> : <PerfilFuncionario />}
          <CambiarContraseniaForm user={user} />
        </div>
      </div>
    </div>
  );
}

// El funcionario no tiene un endpoint de perfil propio (GET /funcionarios/{id} exige VER_FUNCIONARIOS): alcanza con lo que ya trae GET /auth/me en la sesión. La foto sí se sube con PUT /funcionarios/{id}/foto, que deja subir la propia.
function PerfilFuncionario() {
  const user = useSession();
  const { urlFoto } = useFotoPerfil();
  const foto = useSubidaFoto(async (archivo) => (await uploadFuncionarioFoto(user.idUsuario, archivo)).urlFoto);
  return (
    <SeccionCard icon={User} titulo="Datos personales">
      <Encabezado
        avatar={<FotoAvatar previewUrl={foto.previewUrl} nombre={user.nombre} apellido={user.apellido} urlFoto={urlFoto} />}
        nombre={`${user.nombre} ${user.apellido}`}
        detalle="Funcionario"
        accion={<FotoAcciones foto={foto} tieneFoto={Boolean(urlFoto)} />}
      />
      <FotoMensajes foto={foto} />
      <div>
        <Dato label="Email" value={user.email} />
        <Dato label="Rol" value={user.rol} />
      </div>
    </SeccionCard>
  );
}

// Flujo de cambio de foto compartido por estudiante y funcionario. `subir` manda el archivo y devuelve la nueva urlFoto, que además se publica en el context para refrescar el TopBar.
function useSubidaFoto(subir: (foto: File) => Promise<string | null>) {
  const { actualizarFoto } = useFotoPerfil();
  const [errorFoto, setErrorFoto] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  // Foto elegida pero todavía no guardada: se muestra como vista previa hasta que se confirme o se cancele. El backend nunca borra la foto anterior del disco, así que conviene no subir una equivocada.
  const [fotoPendiente, setFotoPendiente] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // La object URL de la vista previa ocupa memoria hasta que se libera: se revoca al cambiar de archivo o al desmontar.
  useEffect(() => {
    if (!fotoPendiente) return;
    const url = URL.createObjectURL(fotoPendiente);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la URL sale de un recurso externo (el File) que hay que crear y liberar en el mismo efecto
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
    };
  }, [fotoPendiente]);

  function elegir(ev: React.ChangeEvent<HTMLInputElement>) {
    const foto = ev.target.files?.[0];
    // Se limpia ya para poder volver a elegir el mismo archivo después de cancelar.
    ev.target.value = "";
    if (!foto) return;
    setErrorFoto("");

    // El accept="" del input solo filtra el selector de archivos: se valida acá antes de mandar algo inválido o pesado (mismo criterio que MedicalReportsPanel).
    const extension = foto.name.slice(foto.name.lastIndexOf(".")).toLowerCase();
    if (!EXTENSIONES_FOTO.includes(extension)) {
      setErrorFoto(`Solo se aceptan imágenes ${EXTENSIONES_FOTO.join(", ")}.`);
      return;
    }
    if (foto.size > MAX_FOTO_BYTES) {
      setErrorFoto("La foto no puede superar los 5 MB.");
      return;
    }
    setFotoPendiente(foto);
  }

  async function guardar() {
    if (!fotoPendiente) return;
    setSubiendoFoto(true);
    setErrorFoto("");
    try {
      const urlNueva = await subir(fotoPendiente);
      actualizarFoto(urlNueva);
      setFotoPendiente(null);
    } catch (err) {
      setErrorFoto(apiErrorMessage(err, "No se pudo subir la foto."));
    } finally {
      setSubiendoFoto(false);
    }
  }

  return { previewUrl, fotoPendiente, errorFoto, subiendoFoto, elegir, guardar, cancelar: () => setFotoPendiente(null) };
}

type SubidaFoto = ReturnType<typeof useSubidaFoto>;

function FotoAvatar({ previewUrl, nombre, apellido, urlFoto }: { previewUrl: string | null; nombre: string; apellido: string; urlFoto: string | null }) {
  if (previewUrl) {
    return (
      <div className="avatar">
        <div className="w-16 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100">
          {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (object URL), no un asset de Next */}
          <img src={previewUrl} alt="Vista previa de la foto nueva" />
        </div>
      </div>
    );
  }
  return <StudentAvatar nombre={nombre} apellido={apellido} urlFoto={urlFoto} size="lg" />;
}

function FotoAcciones({ foto, tieneFoto }: { foto: SubidaFoto; tieneFoto: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={foto.elegir} disabled={foto.subiendoFoto} />
      {foto.fotoPendiente ? (
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={foto.cancelar} disabled={foto.subiendoFoto}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={foto.guardar} disabled={foto.subiendoFoto}>
            {foto.subiendoFoto ? <span className="loading loading-spinner loading-xs" aria-hidden /> : null}
            Guardar foto
          </button>
        </>
      ) : (
        <button type="button" className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()} disabled={foto.subiendoFoto}>
          {tieneFoto ? "Cambiar foto" : "Subir foto"}
        </button>
      )}
    </>
  );
}

function FotoMensajes({ foto }: { foto: SubidaFoto }) {
  return (
    <>
      {foto.fotoPendiente ? (
        <p role="status" className="text-sm text-base-content/70">
          Vista previa: la foto todavía no se guardó.
        </p>
      ) : null}
      {foto.errorFoto ? (
        <div role="alert" className="alert alert-error alert-soft text-sm">
          <span>{foto.errorFoto}</span>
        </div>
      ) : null}
    </>
  );
}

function PerfilEstudiante() {
  const { urlFoto } = useFotoPerfil();
  const {
    data: perfil,
    setData: setPerfil,
    cargando,
    errorCarga,
  } = useApi(() => getMiPerfil(), [], { mensajeError: "No se pudo cargar tu perfil." });
  const foto = useSubidaFoto(async (archivo) => {
    if (!perfil) return null;
    const actualizado = await uploadStudentPhoto(perfil.idUsuario, archivo);
    setPerfil((p) => (p ? { ...p, urlFoto: actualizado.urlFoto } : p));
    return actualizado.urlFoto;
  });

  if (cargando) {
    return (
      <SeccionCard icon={User} titulo="Datos personales">
        <div className="flex justify-center py-6">
          <span className="loading loading-spinner loading-md" role="status" aria-label="Cargando" />
        </div>
      </SeccionCard>
    );
  }

  if (errorCarga || !perfil) {
    return (
      <SeccionCard icon={User} titulo="Datos personales">
        <div role="alert" className="alert alert-error alert-soft text-sm">
          <span>{errorCarga || "No se pudo cargar tu perfil."}</span>
        </div>
      </SeccionCard>
    );
  }

  // El context trae la URL versionada (?v=) si la foto se cambió en esta sesión; si todavía no cargó, se usa la del perfil.
  const avatar = <FotoAvatar previewUrl={foto.previewUrl} nombre={perfil.nombre} apellido={perfil.apellido} urlFoto={urlFoto ?? perfil.urlFoto} />;

  return (
    <>
      <SeccionCard icon={User} titulo="Datos personales">
        <Encabezado
          avatar={avatar}
          nombre={`${perfil.nombre} ${perfil.apellido}`}
          detalle={<EstadoBadge estado={perfil.estado} />}
          accion={<FotoAcciones foto={foto} tieneFoto={Boolean(perfil.urlFoto)} />}
        />
        <FotoMensajes foto={foto} />
        <div>
          <Dato label="Documento" value={perfil.documento} />
          <Dato label="Email" value={perfil.email} />
          <Dato label="Grupos" value={perfil.grupos.join(", ")} />
        </div>
        <p className="text-sm text-base-content/70">
          Si alguno de estos datos no es correcto, pedile a la coordinación que lo actualice.
        </p>
      </SeccionCard>
      <ContactoCard perfil={perfil} onGuardado={setPerfil} />
    </>
  );
}

function Encabezado({
  avatar,
  nombre,
  detalle,
  accion,
}: {
  avatar: React.ReactNode;
  nombre: string;
  detalle: React.ReactNode;
  accion?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        {avatar}
        <div>
          <p className="text-base font-semibold text-base-content mb-1">{nombre}</p>
          <div className="text-sm text-base-content/70">{detalle}</div>
        </div>
      </div>
      {accion ? <div className="flex gap-2">{accion}</div> : null}
    </div>
  );
}
