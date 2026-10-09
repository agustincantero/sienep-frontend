"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { apiErrorMessage } from "@/lib/api";
import { esNombreRepetido, normalizarNombreCategoria } from "@/lib/catalogos";
import { buscarCatalogo, hrefListado } from "@/lib/catalogos-tabs";
import { CatalogoFormLayout } from "./CatalogoFormLayout";
import { Campo } from "./Campo";
import type { Categoria, ConfigCategoria } from "./categorias-config";
import { useMensajeTemporal } from "./useCatalogo";

const MAX_NOMBRE = 50;
const MAX_DESCRIPCION = 100;

type FormState = { nombre: string; descripcion: string };
type Errores = Partial<Record<keyof FormState, string>>;

export function CategoriaForm({ config, categoria }: { config: ConfigCategoria; categoria?: Categoria }) {
  const router = useRouter();
  const definicion = buscarCatalogo(config.tab)!;

  const [form, setForm] = useState<FormState>({
    nombre: categoria?.nomCategoria ?? "",
    descripcion: categoria?.descripcion ?? "",
  });
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useMensajeTemporal();
  const [guardando, setGuardando] = useState(false);

  const nombreNormalizado = normalizarNombreCategoria(form.nombre);
  const mostrarPreview = form.nombre.trim() !== "" && nombreNormalizado !== form.nombre.trim();

  function campo(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errores[key]) setErrores((e) => ({ ...e, [key]: "" }));
  }

  async function guardar() {
    setErrorGeneral("");
    const e: Errores = {};
    const nombre = form.nombre.trim();
    const descripcion = form.descripcion.trim();
    if (!nombre) e.nombre = "El nombre es obligatorio.";
    else if (nombre.length > MAX_NOMBRE) e.nombre = `El nombre no puede superar los ${MAX_NOMBRE} caracteres.`;
    if (descripcion.length > MAX_DESCRIPCION) e.descripcion = `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres.`;
    setErrores(e);
    const primero = (Object.keys(e) as (keyof FormState)[]).find((k) => e[k]);
    if (primero) {
      document.getElementById(`categoria-${primero}`)?.focus();
      return;
    }

    // PUT de reemplazo total: la descripción vacía se manda como undefined para que quede en null y no como "".
    const dto = { nomCategoria: nombre, descripcion: descripcion || undefined };
    setGuardando(true);
    try {
      if (categoria) {
        await config.editar(categoria.idCategoria, dto);
      } else {
        await config.crear(dto);
      }
      router.push(hrefListado(config.tab, `Categoría ${categoria ? "actualizada" : "creada"}: ${normalizarNombreCategoria(nombre)}.`));
    } catch (err) {
      if (esNombreRepetido(err)) {
        setErrores((prev) => ({ ...prev, nombre: `Ya existe una categoría llamada ${normalizarNombreCategoria(nombre)}.` }));
      } else {
        setErrorGeneral(apiErrorMessage(err, "No se pudo guardar la categoría. Probá de nuevo."));
      }
      setGuardando(false);
    }
  }

  return (
    <CatalogoFormLayout
      titulo={categoria ? definicion.editarLabel : definicion.nuevoLabel}
      leyenda={
        <>
          <p>{config.uso}</p>
          <p>El nombre se guarda en mayúsculas y con guiones bajos en lugar de espacios, y no se puede repetir.</p>
        </>
      }
      seccion={{ icon: Tag, titulo: "Datos de la categoría" }}
      submitLabel={categoria ? "Guardar cambios" : "Crear categoría"}
      guardando={guardando}
      errorGeneral={errorGeneral}
      onSubmit={guardar}
    >
      <Campo
        id="categoria-nombre"
        label="Nombre"
        value={form.nombre}
        onChange={(v) => campo("nombre", v)}
        error={errores.nombre}
        ayuda={
          mostrarPreview ? (
            <>
              Se va a guardar como <span className="font-semibold">{nombreNormalizado}</span>.
            </>
          ) : undefined
        }
        maxLength={MAX_NOMBRE}
        disabled={guardando}
        required
      />
      <Campo
        id="categoria-descripcion"
        label="Descripción"
        value={form.descripcion}
        onChange={(v) => campo("descripcion", v)}
        error={errores.descripcion}
        ayuda={`${form.descripcion.length}/${MAX_DESCRIPCION} caracteres`}
        maxLength={MAX_DESCRIPCION}
        disabled={guardando}
        multilinea
      />
    </CatalogoFormLayout>
  );
}
