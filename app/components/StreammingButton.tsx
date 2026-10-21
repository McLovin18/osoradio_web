"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Radio, Loader2 } from "lucide-react";

const STREAM_URL = "https://radiostreaming.pro/8466/stream";

type Status = "idle" | "loading" | "playing" | "offline";

interface RadioPlayerProps {
  buttonText?: string;
}

export default function RadioPlayer({ buttonText = "Escuchar en vivo" }: RadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [activeListeners, setActiveListeners] = useState<number>(0);
  const sessionId = useRef<string>(`listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const isRegistered = useRef<boolean>(false);

  // Registrar oyente cuando empieza a escuchar
  const registerListener = async () => {
    try {
      await fetch("/api/radio/listeners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current }),
      });
    } catch (error) {
      console.error("Error registrando oyente:", error);
    }
  };

  // Eliminar registro de oyente cuando deja de escuchar
  const unregisterListener = async () => {
    try {
      await fetch(`/api/radio/listeners?sessionId=${sessionId.current}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error eliminando registro de oyente:", error);
    }
  };

  // Enviar heartbeat para mantener lastSeen actualizado
  const sendHeartbeat = async () => {
    try {
      await fetch("/api/radio/listeners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current }),
      });
    } catch (error) {
      console.error("Error enviando heartbeat:", error);
    }
  };

  // Obtener número de oyentes activos
  const fetchActiveListeners = async () => {
    try {
      const res = await fetch(`/api/radio/listeners?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        setActiveListeners(0);
        return;
      }
      const data = await res.json();
      setActiveListeners(data.activeListeners || 0);
    } catch (error) {
      console.error("Error obteniendo oyentes activos:", error);
      setActiveListeners(0);
    }
  };

  // Actualizar oyentes activos cada 2 segundos (tiempo real)
  useEffect(() => {
    fetchActiveListeners();
    const interval = setInterval(fetchActiveListeners, 2000);
    return () => clearInterval(interval);
  }, []);

  // Registrar/deregistrar oyente según estado
  useEffect(() => {
    if (status === "playing" && !isRegistered.current) {
      // Registrar oyente
      registerListener();
      isRegistered.current = true;

      // Enviar heartbeat cada 2 segundos mientras está escuchando
      const heartbeatInterval = setInterval(sendHeartbeat, 2000);

      return () => {
        clearInterval(heartbeatInterval);
      };
    } else if (status !== "playing" && isRegistered.current) {
      // Eliminar registro de oyente
      unregisterListener();
      isRegistered.current = false;
    }
  }, [status]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (status === "playing" || status === "loading") {
      audio.pause();
      audio.removeAttribute("src");
      audio.load(); // corta la conexión
      setStatus("idle");
      return;
    }

    try {
      setStatus("loading");
      audio.src = STREAM_URL;
      audio.load();
      await audio.play();
      setStatus("playing");
    } catch (err) {
      console.error("No se pudo reproducir el stream", err);
      setStatus("offline");
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <audio
        ref={audioRef}
        preload="none"
        onError={() => {
          if (audioRef.current?.getAttribute("src")) setStatus("offline");
        }}
        onStalled={() => setStatus((s) => (s === "playing" ? "loading" : s))}
        onPlaying={() => setStatus("playing")}
      />

      <button
        onClick={toggle}
        disabled={status === "loading"}
        className="flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          background: status === "playing" ? "var(--cardBg)" : "var(--primary)",
          color: status === "playing" ? "var(--text)" : "var(--primaryForeground)",
          border: `2px solid ${status === "playing" ? "var(--primary)" : "transparent"}`,
          boxShadow: status === "playing" ? "none" : "0 4px 20px rgba(232, 200, 98, 0.4)",
          minWidth: "280px",
        }}
      >
        {status === "loading" ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : status === "playing" ? (
          <Pause className="w-6 h-6" />
        ) : (
          <Play className="w-6 h-6" />
        )}
        <span>
          {status === "loading"
            ? "Conectando..."
            : status === "playing"
            ? "Pausar"
            : buttonText}
        </span>
      </button>

      {status === "playing" && (
        <div	className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium animate-pulse"
          style={{
            background: "rgba(232, 200, 98, 0.15)",
            color: "var(--primary)",
            border: "1px solid rgba(232, 200, 98, 0.3)",
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--primary)" }} />
          <span>EN VIVO</span>
        </div>
      )}

      {status === "offline" && (
        <p className="text-sm text-center" style={{ color: "var(--textSecondary)" }}>
          La radio está fuera del aire. Intenta más tarde.
        </p>
      )}
    </div>
  );
}