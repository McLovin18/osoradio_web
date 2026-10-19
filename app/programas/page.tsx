"use client";
import { useEffect, useState, useMemo } from "react";
import ProductoCard from "../components/ProductoCard";
import { obtenerProductos } from "../lib/productos-db";
import type { Producto } from "../lib/productos-db";
import BottomBarPublic from "../components/BottomBarPublic";

export default function ProgramasPage() {
  const [contenido, setContenido] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgramas() {
      setLoading(true);
      try {
        const all = await obtenerProductos();
        const programas = all.filter((p) => p.tipoContenido === "programas");
        setContenido(programas);
      } catch (error) {
        console.error("Error cargando programas:", error);
        setContenido([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProgramas();
  }, []);

  const contenidoFiltrado = useMemo(() => {
    return contenido.sort((a: any, b: any) => {
      if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
      return 0;
    });
  }, [contenido]);

  return (
    <div className="min-h-screen flex flex-col transition-colors bg-aurora bg-grid" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-5 py-6 sm:py-15 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-icons-round text-4xl" style={{ color: "var(--color-neon-rosa)" }}>radio</span>
            <h1 className="text-4xl sm:text-5xl font-heading font-bold neon-text">Nuestros Programas</h1>
          </div>
          <p className="text-lg" style={{ color: "var(--textSecondary)" }}>Descubre la programación de <span className="freq">98.5 FM</span></p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border shadow-sm skeleton-3d" style={{ background: "var(--cardBg)", borderColor: "var(--border)" }}>
                <div style={{ background: "var(--bgSecondary)" }} className="w-full h-32 sm:h-48" />
                <div className="p-1.5 sm:p-4 flex flex-col gap-2">
                  <div style={{ background: "var(--bgSecondary)" }} className="h-4 rounded w-3/4" />
                  <div style={{ background: "var(--bgSecondary)" }} className="h-4 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : contenidoFiltrado.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <span className="material-icons-round text-6xl" style={{ color: "var(--color-neon-cian)", opacity: 0.5 }}>radio_button_checked</span>
            <p style={{ color: "var(--text)" }} className="font-semibold text-xl">Sin programas</p>
            <p style={{ color: "var(--textSecondary)" }} className="text-sm mt-1 max-w-60">
              Por el momento no hay programas disponibles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 animate-in fade-in duration-700">
            {contenidoFiltrado.map((p: any, index: number) => (
              <ProductoCard
                key={p.id}
                producto={p}
                index={index}
                showFav={false}
                isCompact={false}
              />
            ))}
          </div>
        )}
      </main>
      <BottomBarPublic />
    </div>
  );
}
