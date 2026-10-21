import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";

// Evitar cache del endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Obtener estadísticas de oyentes
export async function GET(request: NextRequest) {
  console.log("[GET /api/radio/stats] === GET RECIBIDO ===");
  console.log("[GET /api/radio/stats] === VERSIÓN ACTUALIZADA ===");

  try {
    console.log("[GET /api/radio/stats] Iniciando consulta de estadísticas...");

    // Verificar que db esté disponible
    if (!db) {
      console.error("[GET /api/radio/stats] Firebase db no está inicializado");
      return NextResponse.json({ activeListeners: 0, totalToday: 0 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();

    console.log("[GET /api/radio/stats] Fecha hoy:", today);
    console.log("[GET /api/radio/stats] Ventana de tiempo:", oneMinuteAgo, "a", now.toISOString());

    // Obtener oyentes activos (últimos 1 minuto)
    let activeCount = 0;
    try {
      console.log("[GET /api/radio/stats] Consultando oyentes activos...");
      // Consultar solo por fecha para evitar índice compuesto
      const activeListenersSnapshot = await db
        .collection("radio_listeners")
        .where("date", "==", today)
        .get();

      console.log("[GET /api/radio/stats] Total documentos con fecha hoy:", activeListenersSnapshot.size);

      // Filtrar por lastSeen en memoria (últimos 1 minuto)
      const filteredDocs = activeListenersSnapshot.docs.filter(doc => {
        const data = doc.data();
        const lastSeen = data.lastSeen;
        const isActive = lastSeen && lastSeen >= oneMinuteAgo;
        console.log(`[GET /api/radio/stats] Documento ${doc.id}: lastSeen=${lastSeen}, cumple=${isActive}`);
        return isActive;
      });

      activeCount = filteredDocs.length;
      console.log("[GET /api/radio/stats] Oyentes activos (últimos 1 min):", activeCount);
    } catch (queryError) {
      console.error("[GET /api/radio/stats] Error consultando oyentes activos:", queryError);
      // Continuar con activeCount = 0
    }

    // Obtener total de oyentes del día
    let totalToday = 0;
    try {
      console.log("[GET /api/radio/stats] Consultando estadísticas diarias...");
      const dailyStatsDoc = await db.collection("radio_stats").doc(today).get();
      totalToday = dailyStatsDoc.exists ? (dailyStatsDoc.data()?.totalListeners || 0) : 0;
      console.log("[GET /api/radio/stats] Total hoy:", totalToday);
    } catch (statsError) {
      console.error("[GET /api/radio/stats] Error consultando estadísticas diarias:", statsError);
      // Continuar con totalToday = 0
    }

    console.log("[GET /api/radio/stats] Respuesta:", { activeListeners: activeCount, totalToday: totalToday });
    return NextResponse.json({
      activeListeners: activeCount,
      totalToday: totalToday,
    });
  } catch (error) {
    console.error("[GET /api/radio/stats] Error general obteniendo estadísticas:", error);
    return NextResponse.json({ activeListeners: 0, totalToday: 0 });
  }
}
