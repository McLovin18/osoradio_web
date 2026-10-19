"use client";
import React, { useState } from "react";
import { uploadImageAndGetUrl } from "../../lib/upload-image";
import { obtenerCategorias } from "../../lib/categorias-db";
import { obtenerProductos } from "../../lib/productos-db";
import { useEffect } from "react";

// Componente de formulario para crear/modificar productos
type Producto = {
  nombre: string;
  sku?: string;
  categoria: string;
  subcategoria?: string;
  subsubcategoria?: string;
  imagenes: (string | File)[];
  descripcion: string;
  caracteristicas: string[];
  destacado?: boolean;
  promocionar?: boolean;
  promocionarTitulo?: string;
  promocionarDescripcion?: string;
  promocionarDescuento?: number;
  tipoContenido?: 'interlocutores' | 'programas' | 'general';
};

type ProductoFormProps = {
  initialData?: Producto | null;
  onSave?: (data: Producto) => void;
  onCancel?: () => void;
};

type FormSection = "general" | "photos";

export default function ProductoForm({ initialData = null, onSave, onCancel }: ProductoFormProps) {
    // Estado de carga para el submit
    const [loading, setLoading] = useState(false);
  // Si initialData existe, es edición, si no, es creación
  const isEdit = !!initialData;
  const [activeSection, setActiveSection] = useState<FormSection>("general");
  const [nombre, setNombre] = useState<string>(initialData?.nombre || "");
  const [sku, setSku] = useState<string>(initialData?.sku || "");
  const [categoria, setCategoria] = useState<string>(initialData?.categoria || "");
  const [subcategoria, setSubcategoria] = useState<string>(initialData?.subcategoria || "");
  const [subsubcategoria, setSubsubcategoria] = useState<string>(initialData?.subsubcategoria || "");
  const [imagenes, setImagenes] = useState<(string | File)[]>(initialData?.imagenes || []);
  const [descripcion, setDescripcion] = useState<string>(initialData?.descripcion || "");
  const [caracteristicas, setCaracteristicas] = useState<string[]>(initialData?.caracteristicas || [""]);
  const [imagenesInput, setImagenesInput] = useState<File[]>([]);
  const [categoryPathChanged, setCategoryPathChanged] = useState(false);
  const [draggedImageIdx, setDraggedImageIdx] = useState<number | null>(null);
  const [hoveredImageIdx, setHoveredImageIdx] = useState<number | null>(null);
  const [destacado, setDestacado] = useState<boolean>(Boolean(initialData?.destacado));
  const [promocionar, setPromocionar] = useState<boolean>(Boolean(initialData?.promocionar));
  const [promocionarTitulo, setPromocionarTitulo] = useState<string>(initialData?.promocionarTitulo || "");
  const [promocionarDescripcion, setPromocionarDescripcion] = useState<string>(initialData?.promocionarDescripcion || "");
  const [promocionarDescuento, setPromocionarDescuento] = useState<string>(
    initialData?.promocionarDescuento !== undefined && initialData?.promocionarDescuento !== null
      ? String(initialData.promocionarDescuento)
      : ""
  );
  const [tipoContenido, setTipoContenido] = useState<'interlocutores' | 'programas' | 'general'>(initialData?.tipoContenido || 'general');

  useEffect(() => {
    setActiveSection("general");
  }, [initialData, isEdit]);


  // Categorías dinámicas desde Firestore
  const [categoriasDb, setCategoriasDb] = useState<any[]>([]);
  useEffect(() => {
    obtenerCategorias().then(setCategoriasDb);
  }, []);

  // Selectores dependientes dinámicos
  const categorias = categoriasDb.map((cat: any) => ({
    value: cat.id,
    label: cat.nombre,
    subcategorias: cat.subcategorias || []
  }));
  const subcategoriasOptions = categorias.find((c: any) => c.value === categoria)?.subcategorias || [];
  const subcategoriaRequired = false;
  const subsubcategoriasOptions = subcategoriasOptions.find((s: any) => s.id === subcategoria)?.subcategorias || [];
  const subsubcategoriaRequired = false;

  // Manejo de imágenes (por URL o archivo)
  function handleAddImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setImagenes([...imagenes, ...files]); // Guardar File directamente
    setImagenesInput([]); // limpiar input
  }
  function handleAddImagenUrl() {
    setImagenes([...imagenes, ""]);
  }
  function handleImagenUrlChange(idx: number, val: string) {
    setImagenes(imagenes.map((img, i) => i === idx ? val : img));
  }
  function handleRemoveImagen(idx: number) {
    setImagenes(imagenes.filter((_, i) => i !== idx));
  }

  // ── Manejo de drag & drop para reordenar imágenes ──
  function handleImagenDragStart(idx: number) {
    setDraggedImageIdx(idx);
    setHoveredImageIdx(null);
  }

  function handleImagenDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleImagenDragLeave() {
    setHoveredImageIdx(null);
  }

  function handleImagenDrop(dropIdx: number) {
    if (draggedImageIdx === null || draggedImageIdx === dropIdx) {
      setDraggedImageIdx(null);
      setHoveredImageIdx(null);
      return;
    }
    const newImagenes = [...imagenes];
    // Intercambiar solo estas 2 imágenes
    [newImagenes[draggedImageIdx], newImagenes[dropIdx]] = [newImagenes[dropIdx], newImagenes[draggedImageIdx]];
    setImagenes(newImagenes);
    setDraggedImageIdx(null);
    setHoveredImageIdx(null);
  }

  // Manejo de características
  function handleCaracteristicaChange(idx: number, val: string) {
    setCaracteristicas(caracteristicas.map((c, i) => i === idx ? val : c));
  }
  function handleAddCaracteristica() {
    setCaracteristicas([...caracteristicas, ""]);
  }
  function handleRemoveCaracteristica(idx: number) {
    setCaracteristicas(caracteristicas.filter((_, i) => i !== idx));
  }

  // Selectores dependientes
  const subcategorias = categorias.find((c: any) => c.value === categoria)?.subcategorias || [];
  const subsubcategorias = subcategorias.find((s: any) => s.value === subcategoria)?.subsubcategorias || [];

  const sectionButtonClass = (section: FormSection) => {
    const base = "w-full rounded-2xl px-5 py-4 text-left font-semibold transition-all duration-200";
    if (activeSection === section) {
      return `${base} bg-slate-800 text-white shadow-lg shadow-slate-300/50`;
    }
    return `${base} bg-slate-100 text-slate-600 hover:bg-slate-200`;
  };

  const renderGeneralSection = () => (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-slate-900">Título y descripción</h3>
        <p className="mt-2 text-sm text-slate-500">Empieza con la información base. Todo lo demás queda aparte para no saturar la vista.</p>
      </div>

      <div className="space-y-7">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">Título del producto</span>
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-lg text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del producto" required />
          <span className="mt-2 block text-sm text-slate-400">120 caracteres restantes</span>
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">Descripción</span>
          <textarea
            className="min-h-56 w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Describe el producto enfócate en sus características principales, origen, uso y detalles de garantía"
            required
          />
          <span className="mt-2 block text-sm text-slate-400">10000 caracteres restantes</span>
        </label>

        {/* ── SECCIÓN DE FOTOS DENTRO DE GENERAL ──────────────────── */}
        {imagenes.length > 0 && (
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-700">Imágenes añadidas ({imagenes.length})</h4>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {imagenes.map((img, realIdx) => {
                // Si estamos en drag, mostrar en la posición intercambiada visualmente
                let displayIdx = realIdx;
                if (draggedImageIdx !== null && hoveredImageIdx !== null && draggedImageIdx !== hoveredImageIdx) {
                  if (realIdx === draggedImageIdx) {
                    displayIdx = hoveredImageIdx;
                  } else if (realIdx === hoveredImageIdx) {
                    displayIdx = draggedImageIdx;
                  }
                }

                const isFile = img instanceof File;
                const isUrl = typeof img === "string";
                const url = isFile ? URL.createObjectURL(img) : (isUrl && img.trim() ? img : "");

                return (
                  <div
                    key={realIdx}
                    draggable
                    onDragStart={() => handleImagenDragStart(realIdx)}
                    onDragOver={(e) => {
                      handleImagenDragOver(e);
                      setHoveredImageIdx(realIdx);
                    }}
                    onDragLeave={handleImagenDragLeave}
                    onDrop={() => handleImagenDrop(realIdx)}
                    className={`group relative rounded-2xl border-2 transition-all cursor-move ${
                      draggedImageIdx === realIdx 
                        ? "border-rose-400 bg-rose-50 opacity-70" 
                        : hoveredImageIdx === realIdx && draggedImageIdx !== null
                        ? "border-blue-400 bg-blue-50 ring-2 ring-blue-300"
                        : "border-slate-200 hover:border-rose-300 hover:shadow-md"
                    }`}
                  >
                    {/* Preview de imagen */}
                    {url && (url.startsWith("http") || url.startsWith("blob:")) ? (
                      <img 
                        src={url} 
                        alt={`foto-${realIdx}`} 
                        className="w-full aspect-square object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center">
                        <span className="material-icons-round text-3xl text-slate-300">image_not_supported</span>
                      </div>
                    )}

                    {/* Overlay con preview de imagen arrastrada cuando está sobre esta posición */}
                    {hoveredImageIdx === realIdx && draggedImageIdx !== null && draggedImageIdx !== realIdx && (
                      <div className="absolute inset-0 rounded-xl overflow-hidden bg-black/20 flex items-center justify-center z-20">
                        {(() => {
                          const draggedImg = imagenes[draggedImageIdx];
                          const draggedIsFile = draggedImg instanceof File;
                          const draggedIsUrl = typeof draggedImg === "string";
                          const draggedUrl = draggedIsFile ? URL.createObjectURL(draggedImg) : (draggedIsUrl && draggedImg.trim() ? draggedImg : "");
                          
                          return draggedUrl && (draggedUrl.startsWith("http") || draggedUrl.startsWith("blob:")) ? (
                            <img 
                              src={draggedUrl} 
                              alt="preview-arrastrada" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <span className="material-icons-round text-4xl text-white/80">image</span>
                              <p className="text-white text-xs font-semibold mt-1">Imagen {draggedImageIdx + 1}</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Overlay con preview de imagen destino cuando se está arrastrando otra sobre ella */}
                    {draggedImageIdx === realIdx && hoveredImageIdx !== null && hoveredImageIdx !== realIdx && (
                      <div className="absolute inset-0 rounded-xl overflow-hidden bg-black/20 flex items-center justify-center z-20">
                        {(() => {
                          const hoveredImg = imagenes[hoveredImageIdx];
                          const hoveredIsFile = hoveredImg instanceof File;
                          const hoveredIsUrl = typeof hoveredImg === "string";
                          const hoveredUrl = hoveredIsFile ? URL.createObjectURL(hoveredImg) : (hoveredIsUrl && hoveredImg.trim() ? hoveredImg : "");
                          
                          return hoveredUrl && (hoveredUrl.startsWith("http") || hoveredUrl.startsWith("blob:")) ? (
                            <img 
                              src={hoveredUrl} 
                              alt="preview-destino" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <span className="material-icons-round text-4xl text-white/80">image</span>
                              <p className="text-white text-xs font-semibold mt-1">Imagen {hoveredImageIdx + 1}</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Overlay con controles */}
                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/40 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleRemoveImagen(realIdx)}
                        className="flex items-center justify-center gap-1 rounded-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-sm font-semibold transition"
                      >
                        <span className="material-icons-round text-base">delete</span>
                        Eliminar
                      </button>
                    </div>

                    {/* Número de orden en la esquina */}
                    <div className="absolute top-2 left-2 bg-rose-500 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-all">
                      {displayIdx + 1}
                    </div>

                    {/* Etiqueta de tipo */}
                    <div className="absolute bottom-2 left-2 bg-white/90 text-slate-700 rounded-lg px-2 py-1 text-[10px] font-semibold truncate max-w-[calc(100%-1rem)]">
                      {isFile ? "Archivo" : "URL"}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-slate-500 flex items-center gap-1">
              <span className="material-icons-round text-sm">drag_indicator</span>
              Arrastra las imágenes para reordenarlas
            </p>
          </div>
        )}

        {/* Controles de entrada de fotos */}
        <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
          <label className="block">
            <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="material-icons-round text-base">image</span>
              Subir desde dispositivo
            </span>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleAddImagen} 
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-rose-500 file:px-4 file:py-2 file:text-white file:font-semibold" 
            />
          </label>
          <button 
            type="button" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-rose-500 hover:text-rose-700 transition"
            onClick={handleAddImagenUrl}
          >
            <span className="material-icons-round text-base">add_link</span>
            Agregar por URL
          </button>
        </div>

        {/* Inputs para URLs que no han sido completadas */}
        {imagenes.some(img => typeof img === "string") && (
          <div className="mt-6 space-y-4 rounded-2xl bg-blue-50 border border-blue-200 p-5">
            <h4 className="text-sm font-semibold text-blue-900">URLs pendientes de completar</h4>
            <div className="space-y-3">
              {imagenes.map((img, idx) => {
                if (typeof img === "string") {
                  return (
                    <div key={idx} className="flex gap-2 items-end">
                      <label className="flex-1">
                        <span className="mb-1 block text-xs font-semibold text-blue-700">Imagen #{idx + 1}</span>
                        <input 
                          className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" 
                          value={img} 
                          onChange={e => handleImagenUrlChange(idx, e.target.value)} 
                          placeholder="Pega aquí la URL de la imagen" 
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveImagen(idx)}
                        className="px-3 py-3 text-sm font-semibold text-red-600 hover:text-red-700 transition"
                      >
                        <span className="material-icons-round">close</span>
                      </button>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">SKU (código interno)</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium text-slate-700 outline-none"
              type="text"
              value={sku}
              readOnly
              placeholder={isEdit ? "SKU asignado" : "Se generará automáticamente"}
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">Categoría</span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              value={categoria}
              onChange={e => {
                setCategoria(e.target.value);
                setSubcategoria("");
                setSubsubcategoria("");
                setCategoryPathChanged(true);
                setSku("");
              }}
              required={tipoContenido !== 'interlocutores'}
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>

          {subcategoriasOptions.length > 0 && (
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">Subcategoría</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                value={subcategoria}
                onChange={e => {
                  setSubcategoria(e.target.value);
                  setSubsubcategoria("");
                  setCategoryPathChanged(true);
                  setSku("");
                }}
                required={subcategoriaRequired}
              >
                <option value="">Selecciona una subcategoría</option>
                {subcategoriasOptions.map((s: any) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </label>
          )}

          {subsubcategoriasOptions.length > 0 && (
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">Subsubcategoría</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                value={subsubcategoria}
                onChange={e => {
                  setSubsubcategoria(e.target.value);
                  setCategoryPathChanged(true);
                  setSku("");
                }}
                required={subsubcategoriaRequired}
              >
                <option value="">Selecciona una subsubcategoría</option>
                {subsubcategoriasOptions.map((ss: any) => <option key={ss.id} value={ss.id}>{ss.nombre}</option>)}
              </select>
            </label>
          )}

          <label className="block md:col-span-2">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">Tipo de contenido</span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              value={tipoContenido}
              onChange={e => setTipoContenido(e.target.value as 'interlocutores' | 'programas' | 'general')}
            >
              <option value="general">General</option>
              <option value="interlocutores">Interlocutor</option>
              <option value="programas">Programa</option>
            </select>
            <span className="mt-2 block text-sm text-slate-400">Define si este contenido es un interlocutor, un programa o contenido general</span>
          </label>
        </div>

        <div className="rounded-[26px] bg-slate-50 p-5">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">Características</span>
          </label>
          <div className="space-y-3">
            {caracteristicas.map((c, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3">
                <textarea
                  className="min-h-24 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  value={c}
                  onChange={e => handleCaracteristicaChange(idx, e.target.value)}
                  placeholder="Característica"
                  rows={3}
                />
                <div className="mt-3 flex justify-end">
                  <button type="button" className="text-sm font-semibold text-rose-500 hover:text-rose-700" onClick={() => handleRemoveCaracteristica(idx)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="mt-4 text-sm font-semibold text-rose-500 hover:text-rose-700" onClick={handleAddCaracteristica}>Agregar característica</button>
        </div>
      </div>
    </section>
  );

  const renderPhotosSection = () => (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-slate-900">Fotos</h3>
        <p className="mt-2 text-sm text-slate-500">Sube imágenes o añade URLs. Arrastra para reordenar.</p>
      </div>

      {/* Controles de entrada */}
      <div className="mb-8 space-y-4 rounded-2xl bg-slate-50 p-5">
        <label className="block">
          <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="material-icons-round text-base">image</span>
            Subir desde dispositivo
          </span>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleAddImagen} 
            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-rose-500 file:px-4 file:py-2 file:text-white file:font-semibold" 
          />
        </label>
        <button 
          type="button" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-rose-500 hover:text-rose-700 transition"
          onClick={handleAddImagenUrl}
        >
          <span className="material-icons-round text-base">add_link</span>
          Agregar por URL
        </button>
      </div>

      {/* Galería de imágenes */}
      {imagenes.length > 0 && (
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-700">Imágenes añadidas ({imagenes.length})</h4>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {imagenes.map((img, realIdx) => {
              // Si estamos en drag, mostrar en la posición intercambiada visualmente
              let displayIdx = realIdx;
              if (draggedImageIdx !== null && hoveredImageIdx !== null && draggedImageIdx !== hoveredImageIdx) {
                if (realIdx === draggedImageIdx) {
                  displayIdx = hoveredImageIdx;
                } else if (realIdx === hoveredImageIdx) {
                  displayIdx = draggedImageIdx;
                }
              }

              const isFile = img instanceof File;
              const isUrl = typeof img === "string";
              const url = isFile ? URL.createObjectURL(img) : (isUrl && img.trim() ? img : "");
              const fileName = isFile ? img.name : (isUrl ? "URL" : "");

              return (
                <div
                  key={realIdx}
                  draggable
                  onDragStart={() => handleImagenDragStart(realIdx)}
                  onDragOver={(e) => {
                    handleImagenDragOver(e);
                    setHoveredImageIdx(realIdx);
                  }}
                  onDragLeave={handleImagenDragLeave}
                  onDrop={() => handleImagenDrop(realIdx)}
                  className={`group relative rounded-2xl border-2 transition-all cursor-move ${
                    draggedImageIdx === realIdx 
                      ? "border-rose-400 bg-rose-50 opacity-70" 
                      : hoveredImageIdx === realIdx && draggedImageIdx !== null
                      ? "border-blue-400 bg-blue-50 ring-2 ring-blue-300"
                      : "border-slate-200 hover:border-rose-300 hover:shadow-md"
                  }`}
                >
                  {/* Preview de imagen */}
                  {url && (url.startsWith("http") || url.startsWith("blob:")) ? (
                    <img 
                      src={url} 
                      alt={`foto-${realIdx}`} 
                      className="w-full aspect-square object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center">
                      <span className="material-icons-round text-3xl text-slate-300">image_not_supported</span>
                    </div>
                  )}

                  {/* Overlay con preview de imagen arrastrada cuando está sobre esta posición */}
                  {hoveredImageIdx === realIdx && draggedImageIdx !== null && draggedImageIdx !== realIdx && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden bg-black/20 flex items-center justify-center z-20">
                      {(() => {
                        const draggedImg = imagenes[draggedImageIdx];
                        const draggedIsFile = draggedImg instanceof File;
                        const draggedIsUrl = typeof draggedImg === "string";
                        const draggedUrl = draggedIsFile ? URL.createObjectURL(draggedImg) : (draggedIsUrl && draggedImg.trim() ? draggedImg : "");
                        
                        return draggedUrl && (draggedUrl.startsWith("http") || draggedUrl.startsWith("blob:")) ? (
                          <img 
                            src={draggedUrl} 
                            alt="preview-arrastrada" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <span className="material-icons-round text-4xl text-white/80">image</span>
                            <p className="text-white text-xs font-semibold mt-1">Imagen {draggedImageIdx + 1}</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Overlay con preview de imagen destino cuando se está arrastrando otra sobre ella */}
                  {draggedImageIdx === realIdx && hoveredImageIdx !== null && hoveredImageIdx !== realIdx && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden bg-black/20 flex items-center justify-center z-20">
                      {(() => {
                        const hoveredImg = imagenes[hoveredImageIdx];
                        const hoveredIsFile = hoveredImg instanceof File;
                        const hoveredIsUrl = typeof hoveredImg === "string";
                        const hoveredUrl = hoveredIsFile ? URL.createObjectURL(hoveredImg) : (hoveredIsUrl && hoveredImg.trim() ? hoveredImg : "");
                        
                        return hoveredUrl && (hoveredUrl.startsWith("http") || hoveredUrl.startsWith("blob:")) ? (
                          <img 
                            src={hoveredUrl} 
                            alt="preview-destino" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <span className="material-icons-round text-4xl text-white/80">image</span>
                            <p className="text-white text-xs font-semibold mt-1">Imagen {hoveredImageIdx + 1}</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Overlay con controles */}
                  <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/40 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleRemoveImagen(realIdx)}
                      className="flex items-center justify-center gap-1 rounded-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-sm font-semibold transition"
                    >
                      <span className="material-icons-round text-base">delete</span>
                      Eliminar
                    </button>
                  </div>

                  {/* Número de orden en la esquina */}
                  <div className="absolute top-2 left-2 bg-rose-500 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-all">
                    {displayIdx + 1}
                  </div>

                  {/* Etiqueta de tipo */}
                  <div className="absolute bottom-2 left-2 bg-white/90 text-slate-700 rounded-lg px-2 py-1 text-[10px] font-semibold truncate max-w-[calc(100%-1rem)]">
                    {isFile ? "Archivo" : "URL"}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-slate-500 flex items-center gap-1">
            <span className="material-icons-round text-sm">drag_indicator</span>
            Arrastra las imágenes para reordenarlas
          </p>
        </div>
      )}

      {/* Inputs para URLs que no han sido completadas */}
      {imagenes.some(img => typeof img === "string") && (
        <div className="mt-6 space-y-4 rounded-2xl bg-blue-50 border border-blue-200 p-5">
          <h4 className="text-sm font-semibold text-blue-900">URLs pendientes de completar</h4>
          <div className="space-y-3">
            {imagenes.map((img, idx) => {
              if (typeof img === "string") {
                return (
                  <div key={idx} className="flex gap-2 items-end">
                    <label className="flex-1">
                      <span className="mb-1 block text-xs font-semibold text-blue-700">Imagen #{idx + 1}</span>
                      <input 
                        className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" 
                        value={img} 
                        onChange={e => handleImagenUrlChange(idx, e.target.value)} 
                        placeholder="Pega aquí la URL de la imagen" 
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveImagen(idx)}
                      className="px-3 py-3 text-sm font-semibold text-red-600 hover:text-red-700 transition"
                    >
                      <span className="material-icons-round">close</span>
                    </button>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </section>
  );

  // Generación automática de SKU basada en la última categoría seleccionada
  const generateAutomaticSku = async (): Promise<string | undefined> => {
    try {
      const todos = (await obtenerProductos()) as any[];

      // Determinar el id de la última categoría seleccionada
      const finalCategoriaId = subsubcategoria || subcategoria || categoria;
      if (!finalCategoriaId) return undefined;

      // Determinar el nombre legible de esa última categoría
      let finalCategoriaNombre = "GEN";
      if (subsubcategoria) {
        const catRoot = categoriasDb.find((c: any) => c.id === categoria);
        const subcat = catRoot?.subcategorias?.find((s: any) => s.id === subcategoria);
        const subsub = subcat?.subcategorias?.find((ss: any) => ss.id === subsubcategoria);
        finalCategoriaNombre = subsub?.nombre || subcat?.nombre || catRoot?.nombre || "GEN";
      } else if (subcategoria) {
        const catRoot = categoriasDb.find((c: any) => c.id === categoria);
        const subcat = catRoot?.subcategorias?.find((s: any) => s.id === subcategoria);
        finalCategoriaNombre = subcat?.nombre || catRoot?.nombre || "GEN";
      } else if (categoria) {
        const catRoot = categoriasDb.find((c: any) => c.id === categoria);
        finalCategoriaNombre = catRoot?.nombre || "GEN";
      }

      // Prefijo: primeros caracteres limpios del nombre de categoría final
      const prefixBase = finalCategoriaNombre
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .slice(0, 3) || "GEN";

      // Productos de la misma categoría final (usando última categoría no vacía)
      const mismosCategoria = todos.filter((p: any) => {
        const pFinalId = p.subsubcategoria || p.subcategoria || p.categoria;
        return pFinalId === finalCategoriaId;
      });

      // Buscar el mayor correlativo usado en SKUs de esta categoría
      let maxSeq = 0;
      for (const p of mismosCategoria) {
        if (typeof p.sku === "string") {
          const m = p.sku.match(/(\d+)$/);
          if (m) {
            const n = parseInt(m[1], 10);
            if (n > maxSeq) maxSeq = n;
          }
        }
      }

      // Probar siguiente secuencia hasta encontrar uno libre globalmente
      let nextSeq = maxSeq + 1;
      let candidateSku = "";
      // Pequeño límite de seguridad para evitar bucles infinitos
      for (let i = 0; i < 1000; i++) {
        const num = String(nextSeq).padStart(3, "0");
        candidateSku = `${prefixBase}-${num}`;
        const existe = todos.some((p: any) => p.sku === candidateSku);
        if (!existe) break;
        nextSeq++;
      }

      return candidateSku;
    } catch (err) {
      console.error("Error generando SKU automático", err);
      return undefined;
    }
  };

  // Cuando se selecciona categoría/subcategoría, generar SKU si es creación y aún no hay uno
  useEffect(() => {
    // Esperar siempre al último nivel disponible:
    // - Si hay subcategorías y aún no se eligió una, no generar.
    // - Si hay subsubcategorías y aún no se eligió una, tampoco generar.
    const hasSubcats = subcategoriasOptions.length > 0;
    const hasSubsubcats = subsubcategoriasOptions.length > 0;

    if (!categoria) return;
    if (hasSubcats && !subcategoria) return;
    if (hasSubsubcats && !subsubcategoria) return;

    // En edición, solo actualizar si el admin cambió el path de categoría
    if (isEdit && !categoryPathChanged) return;

    generateAutomaticSku().then((nuevo) => {
      if (nuevo) setSku(nuevo);
    });
  }, [
    categoria,
    subcategoria,
    subsubcategoria,
    subcategoriasOptions.length,
    subsubcategoriasOptions.length,
    isEdit,
    categoryPathChanged,
  ]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return; // Previene doble submit
    setLoading(true);
    try {
      // Procesar imágenes: subir archivos a Storage y dejar URLs directas
      const imagenesProcesadas = await Promise.all(imagenes.map(async (img: string | File, idx: number) => {
        if (typeof img === "string") {
          // Si es URL (http/https), dejarla igual
          if (img.startsWith("http")) return img;
          // Si es blob, ignorar (no debería ocurrir)
          return null;
        } else if (img instanceof File) {
          // Subir archivo a Storage
          const ext = img.name.split('.').pop();
          const nombreArchivo = `${nombre.replace(/\s+/g, "_")}_${Date.now()}_${idx}.${ext}`;
          const path = `productos/${nombreArchivo}`;
          try {
            const url = await uploadImageAndGetUrl(img, path);
            return url;
          } catch (err: any) {
            alert("Error subiendo imagen: " + (err?.message || err));
            return null;
          }
        }
        return null;
      }));
      // Filtrar nulos/blobs
      const imagenesFinal = imagenesProcesadas.filter((x): x is string => Boolean(x));
      // Generar SKU automático para nuevas creaciones (no sobrescribir en edición)
      let finalSku = sku?.trim();
      if (!isEdit && !finalSku) {
        const generado = await generateAutomaticSku();
        if (generado) {
          finalSku = generado;
        }
      }

      if (finalSku) {
        setSku(finalSku);
      }

      onSave && onSave({
        nombre,
        sku: finalSku,
        categoria,
        subcategoria,
        subsubcategoria,
        imagenes: imagenesFinal,
        destacado,
        promocionar,
        promocionarTitulo: promocionar ? promocionarTitulo : undefined,
        promocionarDescripcion: promocionar ? promocionarDescripcion : undefined,
        promocionarDescuento: promocionar && promocionarDescuento !== "" ? Number(promocionarDescuento) : undefined,
        descripcion,
        caracteristicas,
        tipoContenido
      });

      // Resetear campos solo si es creación (no edición)
      if (!isEdit) {
        setNombre("");
        setSku("");
        setCategoria("");
        setSubcategoria("");
        setSubsubcategoria("");
        setImagenes([]);
        setDescripcion("");
        setCaracteristicas([""]);
        setCategoryPathChanged(false);
      }
    } finally {
      setLoading(false);
    }
  }

  const editSections: { id: FormSection; label: string; description: string }[] = [
    { id: "general", label: "Información general", description: "Datos base del contenido" },
    { id: "photos", label: "Fotos", description: "Imágenes y orden" },
  ];

  const renderActiveEditSection = () => {
    if (activeSection === "photos") return renderPhotosSection();
    return renderGeneralSection();
  };

  return (
    <form className={isEdit ? "grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]" : "mx-auto flex max-w-5xl flex-col gap-8"} onSubmit={handleSubmit}>
      {isEdit ? (
        <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 lg:sticky lg:top-6 lg:h-fit">
          <div className="mb-4 px-2">
            <h3 className="text-lg font-semibold text-slate-900">Secciones</h3>
            <p className="mt-1 text-sm text-slate-500">Empieza por lo general y luego salta a lo que necesites.</p>
          </div>
          <div className="space-y-3">
            {editSections.map((section) => (
              <button key={section.id} type="button" className={sectionButtonClass(section.id)} onClick={() => setActiveSection(section.id)}>
                <div className="text-base">{section.label}</div>
                <div className={`mt-1 text-sm ${activeSection === section.id ? "text-white/80" : "text-slate-500"}`}>{section.description}</div>
              </button>
            ))}
          </div>
        </aside>
      ) : null}

      <div className="space-y-8">
        {!isEdit ? (
          <>
            {renderGeneralSection()}
          </>
        ) : (
          <>{renderActiveEditSection()}</>
        )}

        <div className="flex flex-wrap items-center justify-end gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <button
            type="button"
            className="rounded-full bg-slate-100 px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-200"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 ${loading ? 'cursor-not-allowed opacity-60' : ''}`}
            disabled={loading}
          >
            {loading && (
              <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {isEdit ? "Actualizar" : loading ? "Creando..." : "Crear"}
          </button>
        </div>
      </div>
    </form>
  );
}

