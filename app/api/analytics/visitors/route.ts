/**
 * 👥 ENDPOINT: WEBSITE VISITORS (REAL-TIME)
 *
 * GET /api/analytics/visitors
 *
 * Devuelve visitantes únicos de hoy y cuántos están activos ahora
 * (lastSeen en los últimos 2 minutos, alimentado por heartbeat del cliente)
 */

import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACTIVE_WINDOW_MS = 2 * 60 * 1000; // 2 minutos

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();

    const [activeSnapshot, todayDoc] = await Promise.all([
      db
        .collection("website_visitors")
        .where("lastSeen", ">=", cutoff)
        .get(),
      db.collection("analytics").doc(today).get(),
    ]);

    return NextResponse.json({
      activeVisitors: activeSnapshot.size,
      uniqueVisitorsToday: todayDoc.exists
        ? todayDoc.data()?.uniqueVisitors || 0
        : 0,
    });
  } catch (error) {
    console.error("[Visitors API] Error:", error);
    return NextResponse.json({ activeVisitors: 0, uniqueVisitorsToday: 0 });
  }
}
