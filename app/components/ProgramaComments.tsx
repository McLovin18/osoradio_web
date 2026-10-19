"use client";

import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { useUser } from "../context/UserContext";
import type { ProgramaComment } from "../../lib/programa-comments-types";

interface ProgramaCommentsProps {
  programaId: string;
}

export default function ProgramaComments({ programaId }: ProgramaCommentsProps) {
  const [comments, setComments] = useState<ProgramaComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentName, setCommentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isLogged, user } = useUser();

  useEffect(() => {
    if (!programaId) return;

    const commentsRef = collection(db, "programaComments");
    const q = query(
      commentsRef,
      where("programaId", "==", programaId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toMillis() || Date.now(),
        })) as ProgramaComment[];
        setComments(commentsData);
      },
      (err) => {
        console.error("Error escuchando comentarios:", err);
      }
    );

    return () => unsubscribe();
  }, [programaId]);

  useEffect(() => {
    if (isLogged && user) {
      setCommentName(user.displayName || "");
    }
  }, [isLogged, user]);

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!commentText.trim()) {
      setError("Escribe un comentario");
      setLoading(false);
      return;
    }

    if (!isLogged && !commentName.trim()) {
      setError("Completa tu nombre para comentar");
      setLoading(false);
      return;
    }

    try {
      const commentsRef = collection(db, "programaComments");
      await addDoc(commentsRef, {
        programaId,
        userId: user?.uid || null,
        userName: commentName.trim() || user?.displayName || "Usuario",
        comment: commentText.trim(),
        createdAt: serverTimestamp(),
      });

      setCommentText("");
      if (!isLogged) {
        setCommentName("");
      }
    } catch (err) {
      console.error("Error enviando comentario:", err);
      setError("Error al enviar comentario");
    }

    setLoading(false);
  }

  const inputStyle = {
    borderColor: "var(--border)",
    background: "var(--bgSecondary)",
    color: "var(--text)"
  };

  return (
    <div className="space-y-6">
      {/* Lista de comentarios con scroll */}
      <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--cardBg)" }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="material-icons-round" style={{ color: "var(--color-neon-cian)" }}>chat</span>
          Comentarios en vivo
          <span className="text-sm font-normal" style={{ color: "var(--textSecondary)" }}>
            ({comments.length})
          </span>
        </h2>

        <div 
          className="space-y-4 max-h-[400px] overflow-y-auto pr-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--color-neon-rosa) transparent"
          }}
        >
          {comments.length === 0 ? (
            <p style={{ color: "var(--textSecondary)" }} className="text-sm text-center py-8">
              ¡Sé el primero en comentar!
            </p>
          ) : (
            comments.map((comment) => (
              <div 
                key={comment.id} 
                className="pb-4 border-b last:border-b-0"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span style={{ color: "var(--text)" }} className="text-sm font-semibold">
                    {comment.userName}
                  </span>
                  <span style={{ color: "var(--textSecondary)" }} className="text-xs ml-auto">
                    {new Date(comment.createdAt).toLocaleTimeString("es-EC", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </span>
                </div>
                <p style={{ color: "var(--textSecondary)" }} className="text-sm leading-relaxed">
                  {comment.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Formulario de comentario */}
      <form onSubmit={handleSubmitComment} className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--cardBg)" }}>
        <h3 className="text-lg font-bold mb-4">Deja tu comentario</h3>

        <div className="flex flex-col gap-1.5 mb-4">
          <label style={{ color: "var(--text)" }} className="text-xs">Nombre</label>
          <input 
            style={inputStyle} 
            className="w-full px-3 py-2.5 rounded-xl border text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--primary)] transition-colors" 
            placeholder="Tu nombre" 
            value={commentName}
            onChange={(e) => setCommentName(e.target.value)} 
            required={!isLogged} 
          />
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <label style={{ color: "var(--text)" }} className="text-xs">Comentario</label>
          <textarea 
            style={inputStyle} 
            className="w-full px-3 py-2.5 rounded-xl border text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--primary)] transition-colors resize-none" 
            rows={3}
            placeholder="Comenta sobre este programa..." 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)} 
            required 
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold transition-all btn-neon disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Enviando..." : "Enviar comentario"}
        </button>
      </form>
    </div>
  );
}
