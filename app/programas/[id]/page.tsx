"use client";
import RadioPlayer from "../../components/StreammingButton";
import { obtenerProductoPorId } from "../../lib/productos-db";
import { Loading3DIcon } from "../../components/Loading3DIcon";
import React, { useState, useEffect, use } from "react";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import ProgramaComments from "../../components/ProgramaComments";
import dynamic from "next/dynamic";

const Markdown = dynamic(() => import("../../components/Markdown"), { ssr: false });

export default function ProgramaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [programa, setPrograma] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"descripcion" | "horarios" | null>("descripcion");

  const { isLogged, user, isAdmin, favoritos, addFavorito, removeFavorito } = useUser();
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchPrograma() {
      setLoading(true);
      try {
        const id = resolvedParams.id;
        const data = await obtenerProductoPorId(id);
        setPrograma(data);
      } catch (error) {
        console.error("Error cargando programa:", error);
        showToast("Error al cargar el programa", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchPrograma();
  }, [resolvedParams.id, showToast]);

  const isFav = favoritos?.some((p) => p.id === programa?.id);

  const handleFav = () => {
    if (!isLogged) {
      showToast("Debes iniciar sesión para agregar a favoritos", "error");
      return;
    }
    isFav ? removeFavorito(programa.id) : addFavorito(programa);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <Loading3DIcon />
      </div>
    );
  }

  if (!programa) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <p>Programa no encontrado</p>
      </div>
    );
  }

  const imagenes = programa.imagenes || [];
  const caracteristicas = programa.caracteristicas || [];

  return (
    <div className="min-h-screen flex flex-col transition-colors" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-5 py-6 sm:py-15 flex-1">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{programa.nombre}</h1>
          <p style={{ color: "var(--textSecondary)" }}>Programa de Radio Oso - 98.5 FM</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Imágenes */}
          <div className="order-1 lg:order-1">
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
              {imagenes.length > 0 ? (
                <img
                  src={imagenes[imgIdx]}
                  alt={programa.nombre}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center" style={{ background: "var(--cardBg)" }}>
                  <span className="material-icons-round text-6xl" style={{ color: "var(--textSecondary)" }}>
                    radio
                  </span>
                </div>
              )}
            </div>

            {/* Galería de imágenes */}
            {imagenes.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {imagenes.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImgIdx(idx)}
                    className={`rounded-xl overflow-hidden border-2 transition-all ${
                      imgIdx === idx ? "border-[var(--primary)]" : "border-transparent"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${programa.nombre} ${idx + 1}`}
                      className="w-full aspect-video object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón de streaming - en móvil entre imágenes e información */}
          <div className="order-2 lg:hidden flex justify-center py-6">
            <RadioPlayer />
          </div>

          {/* Información */}
          <div className="space-y-6 order-3 lg:order-2">
            {/* Descripción */}
            <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--cardBg)" }}>
              <h2 className="text-xl font-bold mb-4">Sobre el programa</h2>
              {programa.descripcion ? (
                <Markdown content={programa.descripcion} />
              ) : (
                <p style={{ color: "var(--textSecondary)" }}>Sin descripción disponible</p>
              )}
            </div>

            {/* Características (Horarios, etc.) */}
            {caracteristicas.length > 0 && caracteristicas.some(c => c.trim()) && (
              <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--cardBg)" }}>
                <h2 className="text-xl font-bold mb-4">Detalles del programa</h2>
                <ul className="space-y-2">
                  {caracteristicas.map((caracteristica, idx) => (
                    caracteristica.trim() && (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-icons-round text-sm mt-1" style={{ color: "var(--primary)" }}>
                          schedule
                        </span>
                        <span>{caracteristica}</span>
                      </li>
                    )
                  ))}
                </ul>
              </div>
            )}

            {/* Botón de favoritos */}
            {isLogged && (
              <button
                onClick={handleFav}
                className={`w-full rounded-full px-6 py-3 font-semibold transition-all ${
                  isFav
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "border hover:bg-[var(--cardBg)]"
                }`}
                style={{ borderColor: isFav ? undefined : "var(--border)" }}
              >
                {isFav ? "❤️ En favoritos" : "🤍 Agregar a favoritos"}
              </button>
            )}
          </div>
        </div>

        {/* Botón de streaming centrado para desktop */}
        <div className="hidden lg:flex justify-center mt-12 mb-8">
          <RadioPlayer />
        </div>

        {/* Sección de comentarios en vivo */}
        <div className="mt-12">
          <ProgramaComments programaId={programa.id} />
        </div>
      </main>
    </div>
  );
}
