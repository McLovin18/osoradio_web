"use client";

import { obtenerProductoPorId } from "../../lib/productos-db";
import { Loading3DIcon } from "../../components/Loading3DIcon";
import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import dynamic from "next/dynamic";

const Markdown = dynamic(() => import("../../components/Markdown"), { ssr: false });

export default function InterlocutorDetailPage({ params }) {
  const [interlocutor, setInterlocutor] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"biografia" | "horarios" | null>("biografia");

  const { isLogged, user, isAdmin, favoritos, addFavorito, removeFavorito } = useUser();
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchInterlocutor() {
      setLoading(true);
      try {
        const id = params.id;
        const data = await obtenerProductoPorId(id);
        setInterlocutor(data);
      } catch (error) {
        console.error("Error cargando interlocutor:", error);
        showToast("Error al cargar el interlocutor", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchInterlocutor();
  }, [params.id, showToast]);

  const isFav = favoritos?.some((p) => p.id === interlocutor?.id);

  const handleFav = () => {
    if (!isLogged) {
      showToast("Debes iniciar sesión para agregar a favoritos", "error");
      return;
    }
    isFav ? removeFavorito(interlocutor.id) : addFavorito(interlocutor);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <Loading3DIcon />
      </div>
    );
  }

  if (!interlocutor) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <p>Interlocutor no encontrado</p>
      </div>
    );
  }

  const imagenes = interlocutor.imagenes || [];
  const caracteristicas = interlocutor.caracteristicas || [];

  return (
    <div className="min-h-screen flex flex-col transition-colors" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-5 py-6 sm:py-15 flex-1">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{interlocutor.nombre}</h1>
          <p style={{ color: "var(--textSecondary)" }}>Interlocutor de Radio Oso - 98.5 FM</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Imágenes */}
          <div>
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
              {imagenes.length > 0 ? (
                <img
                  src={imagenes[imgIdx]}
                  alt={interlocutor.nombre}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center" style={{ background: "var(--cardBg)" }}>
                  <span className="material-icons-round text-6xl" style={{ color: "var(--textSecondary)" }}>
                    person
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
                      alt={`${interlocutor.nombre} ${idx + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información */}
          <div className="space-y-6">
            {/* Descripción */}
            <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--cardBg)" }}>
              <h2 className="text-xl font-bold mb-4">Biografía</h2>
              {interlocutor.descripcion ? (
                <Markdown content={interlocutor.descripcion} />
              ) : (
                <p style={{ color: "var(--textSecondary)" }}>Sin biografía disponible</p>
              )}
            </div>

            {/* Características */}
            {caracteristicas.length > 0 && caracteristicas.some(c => c.trim()) && (
              <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--cardBg)" }}>
                <h2 className="text-xl font-bold mb-4">Información adicional</h2>
                <ul className="space-y-2">
                  {caracteristicas.map((caracteristica, idx) => (
                    caracteristica.trim() && (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-icons-round text-sm mt-1" style={{ color: "var(--primary)" }}>
                          check_circle
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
      </main>
    </div>
  );
}
