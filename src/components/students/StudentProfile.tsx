"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, FileText, HeartPulse, User } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { formatFecha } from "@/lib/format";
import { getStudent, resendStudentPassword, uploadStudentPhoto, type Student } from "@/lib/students";
import { useSession } from "@/lib/session-context";
import { ConfirmDialog } from "./ConfirmDialog";
import { EstadoBadge } from "./EstadoBadge";
import { MedicalReportsPanel } from "./MedicalReportsPanel";
import { StudentAvatar } from "./StudentAvatar";

type Tab = "datos" | "salud" | "instancias" | "informes";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "datos", label: "Datos generales", icon: User },
  { id: "salud", label: "Salud (confidencial)", icon: HeartPulse },
  { id: "instancias", label: "Instancias e incidencias", icon: ClipboardList },
  { id: "informes", label: "Informes médicos", icon: FileText },
];

// Un solo verbo por estado, sostenido en el botón, la confirmación y el
// mensaje de éxito — antes el botón decía una cosa, el confirm otra y el
// toast una tercera.
function accionPassword(estudiante: Student) {
  if (estudiante.estado === "PENDIENTE_DE_ACTIVACION") {
    return {
      boton: "Reenviar contraseña",
      confirmTitulo: "Reenviar contraseña",
      confirmMensaje: `Se va a generar una contraseña nueva y reenviarla por email a ${estudiante.nombre} ${estudiante.apellido}.`,
      exito: "Contraseña reenviada por email.",
    };
  }
  return {
    boton: "Restablecer contraseña",
    confirmTitulo: "Restablecer contraseña",
    confirmMensaje: `Esto invalida la contraseña actual de ${estudiante.nombre} ${estudiante.apellido} y le manda una nueva por email.`,
    exito: "Contraseña restablecida y enviada por email.",
  };
}

export function StudentProfile({ idEstudiante }: { idEstudiante: number }) {
  const { permisos } = useSession();
  const puedeVerSalud = permisos.includes("VER_BLOQUE_CONFIDENCIAL");
  const puedeEditar = permisos.includes("EDITAR_ESTUDIANTE");

  const [estudiante, setEstudiante] = useState<Student | null>(null);
  const [cargando, setCargando] = useState(true);
  // errorCarga: falló el GET inicial, no hay estudiante que mostrar (bloquea
  // la página). error: falló una ACCIÓN posterior (foto, reenviar
  // contraseña) — se muestra junto a los datos ya cargados, no los tapa.
  const [errorCarga, setErrorCarga] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("datos");
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [exito, setExito] = useState("");
  const [reenviando, setReenviando] = useState(false);
  const [confirmandoPassword, setConfirmandoPassword] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  // El aviso de "no se pudo enviar el email" viaja como query param desde
  // StudentForm (solo existe en la respuesta de creación, no en el GET de
  // acá). Se lee en un efecto porque, al llegar acá por router.push(), el
  // history.pushState de Next todavía no se aplicó cuando corre el render
  // inicial — leer en el cuerpo del componente llega tarde/temprano según
  // la carrera. En el efecto ya está garantizado. Se saca de la URL apenas
  // se lee, mismo patrón que el token en ResetPasswordForm.
  useEffect(() => {
    const valor = new URLSearchParams(window.location.search).get("aviso");
    if (valor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de un sistema externo (la URL de navegación), no hay forma de derivarlo en el render
      setAviso(valor);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // cancelado: si idEstudiante cambia mientras un GET anterior todavía está
  // en vuelo (navegación rápida entre dos fichas), esa respuesta vieja no
  // debe pisar los datos del estudiante nuevo que ya está cargando.
  useEffect(() => {
    let cancelado = false;
    getStudent(idEstudiante)
      .then((s) => {
        if (cancelado) return;
        setEstudiante(s);
        setErrorCarga("");
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorCarga(apiErrorMessage(err, "No se pudo cargar el estudiante."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [idEstudiante]);

  async function handleFoto(ev: React.ChangeEvent<HTMLInputElement>) {
    const foto = ev.target.files?.[0];
    if (!foto) return;
    setSubiendoFoto(true);
    try {
      const actualizado = await uploadStudentPhoto(idEstudiante, foto);
      setEstudiante(actualizado);
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo subir la foto."));
    } finally {
      setSubiendoFoto(false);
      if (inputFotoRef.current) inputFotoRef.current.value = "";
    }
  }

  async function confirmarReenviarPassword() {
    setConfirmandoPassword(false);
    setReenviando(true);
    setError("");
    setExito("");
    try {
      await resendStudentPassword(idEstudiante);
      setExito(estudiante ? accionPassword(estudiante).exito : "Contraseña enviada por email.");
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo enviar el email. Probá de nuevo."));
    } finally {
      setReenviando(false);
    }
  }

  if (cargando) {
    return (
      <div className="grow overflow-auto flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (errorCarga || !estudiante) {
    return (
      <div className="grow overflow-auto">
        <div className="max-w-[980px] mx-auto w-full px-4 py-5">
          <Link href="/estudiantes" className="btn btn-link no-underline mb-3 gap-1">
            <ArrowLeft size={16} aria-hidden />
            Volver a estudiantes
          </Link>
          <div role="alert" className="alert alert-error alert-soft text-sm">
            <span>{errorCarga || "Estudiante no encontrado."}</span>
          </div>
        </div>
      </div>
    );
  }

  const grupos = estudiante.grupos.join(", ");

  return (
    <div className="grow overflow-auto">
      <div className="max-w-[980px] mx-auto w-full px-4 py-5">
        <Link href="/estudiantes" className="btn btn-link no-underline mb-3 gap-1">
          <ArrowLeft size={16} aria-hidden />
          Volver a estudiantes
        </Link>

        {aviso ? (
          <div role="alert" className="alert alert-warning alert-soft text-sm mb-4">
            <span>{aviso}</span>
          </div>
        ) : null}

        {exito ? (
          <div role="status" className="alert alert-success alert-soft text-sm mb-4">
            <span>{exito}</span>
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="alert alert-error alert-soft text-sm mb-4">
            <span>{error}</span>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3 select-none cursor-default">
            <StudentAvatar
              nombre={estudiante.nombre}
              apellido={estudiante.apellido}
              urlFoto={estudiante.urlFoto}
              size="lg"
            />
            <div>
              <h1 className="text-xl font-bold mb-0">
                {estudiante.nombre} {estudiante.apellido}
              </h1>
              {/* Sin fallback "—": un guión suelto sin etiqueta al lado no comunica nada. Si no
                  tiene grupo, directamente no se muestra esta línea (el dato completo sigue
                  disponible, con su etiqueta, en la pestaña Datos generales). */}
              {grupos ? <p className="text-sm text-base-content/60 mb-1">{grupos}</p> : null}
              <EstadoBadge estado={estudiante.estado} />
            </div>
          </div>

          <div className="flex gap-2">
            {puedeEditar ? (
              <>
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFoto}
                  disabled={subiendoFoto}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => inputFotoRef.current?.click()}
                  disabled={subiendoFoto}
                >
                  {subiendoFoto ? <span className="loading loading-spinner loading-xs" /> : null}
                  Subir foto
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setConfirmandoPassword(true)}
                  disabled={reenviando}
                >
                  {reenviando ? <span className="loading loading-spinner loading-xs" /> : null}
                  {accionPassword(estudiante).boton}
                </button>
                <Link href={`/estudiantes/${idEstudiante}/editar`} className="btn btn-primary btn-sm">
                  Editar
                </Link>
              </>
            ) : null}
          </div>
        </div>

        <div role="tablist" className="tabs tabs-border mb-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              className={`tab gap-1.5 ${tab === id ? "tab-active" : ""}`}
              onClick={() => setTab(id)}
            >
              <Icon size={14} aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {/* key={tab} fuerza el remount al cambiar de tab, así la animación se repite cada vez en vez de correr una sola vez al montar la ficha. */}
        <div key={tab} className="animate-[fade-in_180ms_ease-out]">
          {tab === "datos" ? (
            <DatosGenerales estudiante={estudiante} />
          ) : tab === "salud" ? (
            puedeVerSalud ? (
              <SaludConfidencial estudiante={estudiante} />
            ) : (
              <p className="text-base-content/60 text-sm">
                No tenés permiso para ver la información de salud de este estudiante.
              </p>
            )
          ) : tab === "instancias" ? (
            <p className="text-base-content/60 text-sm">
              Se completa en el módulo de Instancias e Incidencias.
            </p>
          ) : (
            <MedicalReportsPanel idEstudiante={idEstudiante} />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmandoPassword}
        title={accionPassword(estudiante).confirmTitulo}
        message={accionPassword(estudiante).confirmMensaje}
        confirmLabel={accionPassword(estudiante).boton}
        onConfirm={confirmarReenviarPassword}
        onCancel={() => setConfirmandoPassword(false)}
      />
    </div>
  );
}

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-base-300 flex flex-wrap gap-x-4 select-none cursor-default">
      <span className="text-base-content/60 w-40 shrink-0">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function DatosGenerales({ estudiante }: { estudiante: Student }) {
  const direccion = [
    estudiante.calle && estudiante.nroPuerta ? `${estudiante.calle} ${estudiante.nroPuerta}` : estudiante.calle,
    estudiante.ciudad,
    estudiante.departamento,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <Dato label="Documento" value={`${estudiante.documento} (${estudiante.paisDocumento})`} />
      <Dato label="Email" value={estudiante.email} />
      <Dato label="Fecha de nacimiento" value={formatFecha(estudiante.fechaNacimiento)} />
      <Dato label="Teléfono" value={estudiante.telefonos.join(", ")} />
      <Dato label="Dirección" value={direccion} />
      <Dato label="Grupos" value={estudiante.grupos.join(", ")} />
    </div>
  );
}

function SaludConfidencial({ estudiante }: { estudiante: Student }) {
  return (
    <div>
      <div role="alert" className="alert alert-soft text-sm mb-3">
        <span>Bloque confidencial — visible solo para quienes tienen permiso de ver información de salud.</span>
      </div>
      <Dato label="Información de salud" value={estudiante.informacionSalud} />
      <Dato label="Sistema de salud" value={estudiante.sistemaSalud} />
      <Dato label="Motivo de derivación" value={estudiante.motivoDerivacion} />
    </div>
  );
}
