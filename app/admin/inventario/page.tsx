"use client";
import React, { useState, useEffect } from "react";
import type { Producto } from "../../lib/productos-db";
import CategoriasAdminPanel from "./CategoriasAdminPanel";
import ProductoFormModal from "./ProductoFormModal";
import ProductoCard from "../../components/ProductoCard";
import { obtenerCategorias } from "../../lib/categorias-db";
import {
  crearProducto,
  obtenerProductos,
  actualizarProducto,
  eliminarProducto
} from "../../lib/productos-db";


export default function AdminInventario() {

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Producto | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orden, setOrden] = useState("newest");
  const [vista, setVista] = useState("productos");
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<string | null>(null);
  const [categoriasDb, setCategoriasDb] = useState<any[]>([]);

  // 📊 Resumen de inventario
  const resumen = React.useMemo(() => {
    const total = productos.length;
    return { total };
  }, [productos]);

  // 🔄 Cargar productos
  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      const prods = await obtenerProductos({ incluirSinStock: true });
      setProductos(prods);
      setLoading(false);
    }
    
    fetchProductos();
    obtenerCategorias().then(setCategoriasDb).catch(err => console.error("Error cargando categorías:", err));
  }, []);

  const categoriaLabelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    const walk = (items: any[]) => {
      items.forEach((cat) => {
        if (cat?.id) map.set(cat.id, cat.nombre || cat.id);
        if (Array.isArray(cat?.subcategorias)) walk(cat.subcategorias);
      });
    };
    walk(categoriasDb);
    return map;
  }, [categoriasDb]);

  // Categorías y subcategorías disponibles (extraídas de los productos cargados)
  const categoriasUnicas = React.useMemo(() => {
    return Array.from(new Set(productos.map(p => p.categoria).filter(Boolean as any)));
  }, [productos]);

  const subcategoriasDisponibles = React.useMemo(() => {
    if (selectedCategoria) {
      return Array.from(new Set(productos.filter(p => p.categoria === selectedCategoria).map(p => p.subcategoria).filter(Boolean as any)));
    }
    return Array.from(new Set(productos.map(p => p.subcategoria).filter(Boolean as any)));
  }, [productos, selectedCategoria]);

  const formatCategoria = (id?: string) => (id ? categoriaLabelMap.get(id) || id : "-");

  const getCreatedAtMs = (producto: Producto) => {
    if (typeof producto.createdAt === "number") return producto.createdAt;
    if (producto.createdAt instanceof Date) return producto.createdAt.getTime();
    return 0;
  };

  const productosFiltrados = productos
    .filter((p) => {
      const texto = search.trim().toLowerCase();
      const nombre = p.nombre?.toLowerCase() || "";
      const desc = p.descripcion?.toLowerCase() || "";
      if (texto && !nombre.includes(texto) && !desc.includes(texto)) return false;
      if (selectedCategoria && p.categoria !== selectedCategoria) return false;
      if (selectedSubcategoria && p.subcategoria !== selectedSubcategoria) return false;
      return true;
    })
    .sort((a, b) => {
      const aPrecio = Number(a.precio || 0);
      const bPrecio = Number(b.precio || 0);
      if (orden === "price-low") return aPrecio - bPrecio;
      if (orden === "price-high") return bPrecio - aPrecio;
      // Por defecto: ordenar por más nuevos (createdAt descendente)
      const aCreated = getCreatedAtMs(a);
      const bCreated = getCreatedAtMs(b);
      return bCreated - aCreated;
    });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950">
      <div className="flex-1 w-full py-6 sm:py-15 px-4 pt-4 pb-24">

        {/* NAV ADMIN */}
        <div className="flex gap-2 mb-6">
          <button
            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
              vista === "productos"
                ? "bg-purple-700 text-white border-purple-700"
                : "bg-white text-purple-700 border-purple-700"
            }`}
            onClick={() => setVista("productos")}
          >
            Productos
          </button>


          <button
            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
              vista === "categorias"
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-blue-700 border-blue-700"
            }`}
            onClick={() => setVista("categorias")}
          >
            Categorías
          </button>
        </div>

        {/* ================== VISTA PRODUCTOS ================== */}
        {vista === "productos" && (
          <>
            {/* RESUMEN */}
            <div className="flex gap-8 items-center mb-4 text-base text-slate-700 dark:text-slate-200">
              <div>Total: <b>{resumen.total}</b></div>
            </div>

            {/* BARRA DE FILTROS PRINCIPAL */}
            <div className="flex items-center gap-3 mb-4 flex-wrap text-black">
              <div className="flex-1 min-w-55">
                <div className="relative">
                  <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-lg text-black">search</span>
                  <input
                    type="text"
                    placeholder="Título, cód. de barras o SKU"
                    className="pl-10 pr-4 py-2 rounded-lg border border-black text-black placeholder:text-black w-full"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-48 min-w-40">
                <select className="px-3 py-2 rounded-lg border border-black text-black w-full" value={selectedCategoria ?? ""} onChange={e => { setSelectedCategoria(e.target.value || null); setSelectedSubcategoria(null); }}>
                  <option value="">Categoría</option>
                  {categoriasUnicas.map(c => (
                    <option key={c} value={c}>{formatCategoria(c)}</option>
                  ))}
                </select>
              </div>

              <div className="w-48 min-w-40">
                <select className="px-3 py-2 rounded-lg border border-black text-black w-full" value={selectedSubcategoria ?? ""} onChange={e => setSelectedSubcategoria(e.target.value || null)}>
                  <option value="">Subcategoría</option>
                  {subcategoriasDisponibles.map(s => (
                    <option key={s} value={s}>{formatCategoria(s)}</option>
                  ))}
                </select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button className="px-4 py-2 rounded-full bg-rose-600 text-white" onClick={() => setShowForm(true)}>Registrar un producto</button>
              </div>
            </div>

            {/* MODAL */}
            <ProductoFormModal
              show={showForm}
              initialData={editData}
              onClose={() => {
                setShowForm(false);
                setEditData(null);
              }}
              onSave={async (data: Producto) => {
                if (editData) {
                  await actualizarProducto(editData.id, data);
                } else {
                  await crearProducto({ ...data, destacado: false, promocionar: false });
                }
                const prods = await obtenerProductos({ incluirSinStock: true });
                setProductos(prods);
                setShowForm(false);
                setEditData(null);
              }}
            />

            {/* LISTA DE PRODUCTOS (estilo inventario) */}
            <div className="bg-white rounded-2xl shadow border overflow-hidden">
              <div className="max-h-[65vh] overflow-auto">
                {loading ? (
                  <div className="p-6 text-center">Cargando productos...</div>
                ) : productosFiltrados.length === 0 ? (
                  <div className="p-6 text-center">No hay productos</div>
                ) : (
                  <table className="w-full min-w-245 table-fixed">
                    <thead className="bg-slate-50 text-slate-700 border-b">
                      <tr>
                        <th className="text-left font-semibold px-6 py-4 w-[40%]">Producto</th>
                        <th className="text-left font-semibold px-4 py-4 w-[20%]">Fecha actualización</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((p) => {
                        const thumb = p.imagenes?.[0] || p.imagen || "/no-image.png";
                        const fecha = p.createdAt ? new Date(p.createdAt).toLocaleString() : "-";

                        return (
                          <tr key={p.id} className="border-b last:border-b-0 hover:bg-slate-50/60 transition-colors align-middle">
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                                  <img src={thumb} alt={p.nombre} className="object-contain w-full h-full" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-slate-800 truncate">{p.nombre}</div>
                                  <div className="text-xs text-slate-500 truncate">SKU: {p.sku || p.id}</div>
                                  <div className="mt-1 flex items-center gap-2 text-xs whitespace-nowrap">
                                    <button className="text-rose-600 font-medium" onClick={() => { setEditData(p); setShowForm(true); }}>Editar</button>
                                    <span className="text-slate-300">|</span>
                                    <button className="text-slate-600 hover:text-slate-900" onClick={async () => { if (confirm("¿Eliminar producto?")) { await eliminarProducto(p.id); const prods = await obtenerProductos({ incluirSinStock: true }); setProductos(prods); } }}>Eliminar</button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-800 whitespace-nowrap">{fecha}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* ================== VISTA CATEGORÍAS ================== */}
        {vista === "categorias" && <CategoriasAdminPanel />}

      </div>
    </div>
  );
}
