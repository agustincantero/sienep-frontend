"use client";

import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { useFotoPerfil } from "@/lib/foto-perfil-context";
import { iniciales } from "@/lib/format";
import { useSession } from "@/lib/session-context";
import { getMiPerfil, uploadStudentPhoto, type StudentSummary } from "@/lib/students";
import { EstadoBadge } from "@/components/students/EstadoBadge";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { CambiarContraseniaForm } from "./CambiarContraseniaForm";
import { MisInstanciasCard } from "./MisInstanciasCard";
import { SeccionCard } from "./SeccionCard";

const EXTENSIONES_FOTO = [".jpg", ".jpeg", ".png"];
const MAX_FOTO_BYTES = 5 * 1024 * 1024;

// "Mi perfil" para funcionario y estudiante. Los datos son de solo lectura: lo único editable es la foto (solo estudiante, Funcionario no tiene foto en el modelo) y la contraseña.
export function MiPerfil() {
  const user = useSession();
  const esEstudiante = user.tipo === "ESTUDIANTE";

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[720px] mx-auto w-full px-4 py-5">
        <h1 className="text-xl font-bold mb-4">Mi perfil</h1>
        <div className="space-y-6">
          {esEstudiante ? <PerfilEstudiante /> : <PerfilFuncionario />}
          {esEstudiante ? <MisInstanciasCard /> : null}
          <CambiarContraseniaForm user={user} />
        </div>
      </div>
    </div>
  );
}

// El funcionario no tiene un endpoint de perfil propio (GET /funcionarios/{id} exige VER_FUNCIONARIOS): alcanza con lo que ya trae GET /auth/me en la sesión.
function PerfilFuncionario() {
  const user = useSession();
  return (
    <SeccionCard icon={User} titulo="Datos personales">
      <Encabezado
        avatar={<AvatarIniciales nombre={user.nombre} apellido={user.apellido} />}
        nombre={`${user.nombre} ${user.apellido}`}
        detalle="Funcionario"
      />
      <div>
        <Dato label="Email" value={user.email} />
        <Dato label="Rol" value={user.rol} />
      </div>
    </SeccionCard>
  );
}

function PerfilEstudiante() {
  const { urlFoto, actualizarFoto } = useFotoPerfil();
  const [perfil, setPerfil] = useState<StudentSummary | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorFoto, setErrorFoto] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  // Foto elegida pero todavía no guardada: se muestra como vista previa hasta que se confirme o se cancele. El backend nunca borra la foto anterior del disco, así que conviene no subir una equivocada.
  const [fotoPendiente, setFotoPendiente] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelado = false;
    getMiPerfil()
      .then((p) => {
        if (cancelado) return;
        setPerfil(p);
        setErrorCarga("");
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorCarga(apiErrorMessage(err, "No se pudo cargar tu perfil."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

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

  function handleElegirFoto(ev: React.ChangeEvent<HTMLInputElement>) {
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

  async function guardarFoto() {
    if (!fotoPendiente || !perfil) return;
    setSubiendoFoto(true);
    setErrorFoto("");
    try {
      const actualizado = await uploadStudentPhoto(perfil.idUsuario, fotoPendiente);
      setPerfil((p) => (p ? { ...p, urlFoto: actualizado.urlFoto } : p));
      // Actualiza también el avatar del TopBar.
      actualizarFoto(actualizado.urlFoto);
      setFotoPendiente(null);
    } catch (err) {
      setErrorFoto(apiErrorMessage(err, "No se pudo subir la foto."));
    } finally {
      setSubiendoFoto(false);
    }
  }

  if (cargando) {
    return (
      <SeccionCard icon={User} titulo="Datos personales">
        <div className="flex justify-center py-6">
          <span className="loading loading-spinner loading-md" />
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

  const avatar = previewUrl ? (
    <div className="avatar">
      <div className="w-16 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (object URL), no un asset de Next */}
        <img src={previewUrl} alt="Vista previa de la foto nueva" />
      </div>
    </div>
  ) : (
    // El context trae la URL versionada (?v=) si la foto se cambió en esta sesión; si todavía no cargó, se usa la del perfil.
    <StudentAvatar nombre={perfil.nombre} apellido={perfil.apellido} urlFoto={urlFoto ?? perfil.urlFoto} size="lg" />
  );

  return (
    <SeccionCard icon={User} titulo="Datos personales">
      <Encabezado
        avatar={avatar}
        nombre={`${perfil.nombre} ${perfil.apellido}`}
        detalle={<EstadoBadge estado={perfil.estado} />}
        accion={
          <>
            <input
              ref={inputFotoRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={handleElegirFoto}
              disabled={subiendoFoto}
            />
            {fotoPendiente ? (
              <>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setFotoPendiente(null)}
                  disabled={subiendoFoto}
                >
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={guardarFoto} disabled={subiendoFoto}>
                  {subiendoFoto ? <span className="loading loading-spinner loading-xs" /> : null}
                  Guardar foto
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => inputFotoRef.current?.click()}
                disabled={subiendoFoto}
              >
                {perfil.urlFoto ? "Cambiar foto" : "Subir foto"}
              </button>
            )}
          </>
        }
      />
      {fotoPendiente ? (
        <p role="status" className="text-sm text-base-content/60">
          Vista previa: la foto todavía no se guardó.
        </p>
      ) : null}
      {errorFoto ? (
        <div role="alert" className="alert alert-error alert-soft text-sm">
          <span>{errorFoto}</span>
        </div>
      ) : null}
      <div>
        <Dato label="Documento" value={perfil.documento} />
        <Dato label="Email" value={perfil.email} />
        <Dato label="Teléfono" value={perfil.telefonos.join(", ")} />
        <Dato label="Grupos" value={perfil.grupos.join(", ")} />
      </div>
      <p className="text-sm text-base-content/60">
        Si algún dato no es correcto, pedile a la coordinación que lo actualice.
      </p>
    </SeccionCard>
  );
}

// Mismo círculo que StudentAvatar size="lg", para quien no tiene foto (funcionario).
function AvatarIniciales({ nombre, apellido }: { nombre: string; apellido: string }) {
  return (
    <div className="avatar avatar-placeholder">
      <div className="bg-neutral text-neutral-content rounded-full w-16 text-lg ring-2 ring-primary/25 ring-offset-2 ring-offset-base-100">
        <span>{iniciales(nombre, apellido)}</span>
      </div>
    </div>
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
          <div className="text-sm text-base-content/60">{detalle}</div>
        </div>
      </div>
      {accion ? <div className="flex gap-2">{accion}</div> : null}
    </div>
  );
}

// Mismo formato que el Dato de StudentProfile (etiqueta + valor, "—" si está vacío).
function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-base-300 flex flex-wrap gap-x-4 text-sm">
      <span className="text-base-content/60 w-40 shrink-0">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
