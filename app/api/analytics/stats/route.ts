/**
 * 📊 ENDPOINT: ANALYTICS STATS BY DATE RANGE
 *
 * GET /api/analytics/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Agrega los docs diarios de la colección `analytics` para el rango pedido.
 * Devuelve desglose por día y totales (incluye visitantes únicos
 * deduplicados por device-id en todo el rango).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const today = new Date().toISOString().slice(0, 10);

    const from = searchParams.get("from") || today;
    const to = searchParams.get("to") || today;

    if (!DATE_RE.test(from) || !DATE_RE.test(to) || from > to) {
      return NextResponse.json(
        { error: "Rango de fechas inválido. Usa from/to en formato YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const snapshot = await db
      .collection("analytics")
      .where("date", ">=", from)
      .where("date", "<=", to)
      .orderBy("date", "asc")
      .get();

    const days: {
      date: string;
      uniqueVisitors: number;
      totalClicks: number;
      clicksByType: Record<string, number>;
    }[] = [];

    const allVisitorIds = new Set<string>();
    const totals = {
      uniqueVisitorsSum: 0,
      totalClicks: 0,
      clicksByType: {} as Record<string, number>,
    };

    for (const doc of snapshot.docs) {
      const data = doc.data() as {
        date?: string;
        uniqueVisitors?: number;
        totalClicks?: number;
        clicksByType?: Record<string, number>;
        visitorIds?: string[];
      };
      const date = data.date || doc.id;
      const uniqueVisitors = data.uniqueVisitors || 0;
      const totalClicks = data.totalClicks || 0;
      const clicksByType = data.clicksByType || {};

      days.push({ date, uniqueVisitors, totalClicks, clicksByType });

      totals.uniqueVisitorsSum += uniqueVisitors;
      totals.totalClicks += totalClicks;

      for (const id of data.visitorIds || []) {
        allVisitorIds.add(id);
      }
      for (const [key, value] of Object.entries(clicksByType)) {
        totals.clicksByType[key] =
          (totals.clicksByType[key] || 0) + (Number(value) || 0);
      }
    }

    return NextResponse.json({
      from,
      to,
      days,
      totals: {
        uniqueVisitorsSum: totals.uniqueVisitorsSum,
        uniqueVisitorsRange: allVisitorIds.size,
        totalClicks: totals.totalClicks,
        clicksByType: totals.clicksByType,
      },
    });
  } catch (error) {
    console.error("[Analytics Stats API] Error:", error);
    return NextResponse.json({ error: "Error obteniendo estadísticas" }, { status: 500 });
  }
}
