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
    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId requerido" }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    // Verificar si el documento ya existe (para saber si es primera vez hoy)
    const listenerDoc = await db.collection("radio_listeners").doc(deviceId).get();
    const isFirstTimeToday = !listenerDoc.exists || listenerDoc.data()?.date !== today;

    // Crear o actualizar documento de oyente activo
    await db.collection("radio_listeners").doc(deviceId).set({
      startedAt: now,
      lastSeen: now,
      date: today,
    });

    // Solo incrementar contador si es la primera vez que este dispositivo escucha hoy
    if (isFirstTimeToday) {
      const dailyStatsRef = db.collection("radio_stats").doc(today);
      await dailyStatsRef.set({
        totalListeners: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      }, { merge: true });
    }

    return NextResponse.json({ success: true, isFirstTimeToday });
  } catch (error) {
    console.error("Error registrando oyente:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT: Actualizar heartbeat del oyente (mantener lastSeen actualizado)
export async function PUT(request: NextRequest) {
  try {
    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId requerido" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const today = new Date().toISOString().slice(0, 10);

    // Usar set con merge para crear si no existe o actualizar si existe
    await db.collection("radio_listeners").doc(deviceId).set({
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
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId requerido" }, { status: 400 });
    }

    await db.collection("radio_listeners").doc(deviceId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
