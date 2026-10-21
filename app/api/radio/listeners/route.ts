import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import admin from "firebase-admin";

// Evitar cache del endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Obtener estadísticas de oyentes
export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();

    const activeListenersSnapshot = await db
      .collection("radio_listeners")
      .where("date", "==", today)
      .get();

    const filteredDocs = activeListenersSnapshot.docs.filter(doc => {
      const lastSeen = doc.data().lastSeen;
      return lastSeen && lastSeen >= oneMinuteAgo;
    });

    const activeCount = filteredDocs.length;

    const dailyStatsDoc = await db.collection("radio_stats").doc(today).get();
    const totalToday = dailyStatsDoc.exists ? (dailyStatsDoc.data()?.totalListeners || 0) : 0;

    return NextResponse.json({
      activeListeners: activeCount,
      totalToday: totalToday,
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return NextResponse.json({ activeListeners: 0, totalToday: 0 });
  }
}

// POST: Registrar que un usuario está escuchando
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requerido" }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    // Crear documento de oyente activo
    await db.collection("radio_listeners").doc(sessionId).set({
      startedAt: now,
      lastSeen: now,
      date: today,
    });

    // Incrementar contador total del día
    const dailyStatsRef = db.collection("radio_stats").doc(today);
    await dailyStatsRef.set({
      totalListeners: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registrando oyente:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT: Actualizar heartbeat del oyente (mantener lastSeen actualizado)
export async function PUT(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requerido" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const today = new Date().toISOString().slice(0, 10);

    // Usar set con merge para crear si no existe o actualizar si existe
    await db.collection("radio_listeners").doc(sessionId).set({
      lastSeen: now,
      date: today,
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando heartbeat:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE: Registrar que un usuario dejó de escuchar
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requerido" }, { status: 400 });
    }

    await db.collection("radio_listeners").doc(sessionId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
