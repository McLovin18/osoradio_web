/**
 * 📊 ANALYTICS WIDGET
 * Beautiful analytics dashboard for admin page
 * Shows page views, clicks, and interactions with date range filters
 */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

type RangeMode = "day" | "week" | "custom";

interface DayStat {
  date: string;
  uniqueVisitors: number;
  totalClicks: number;
  clicksByType: Record<string, number>;
}

interface RangeStats {
  from: string;
  to: string;
  days: DayStat[];
  totals: {
    uniqueVisitorsSum: number;
    uniqueVisitorsRange: number;
    totalClicks: number;
    clicksByType: Record<string, number>;
  };
}

interface LiveVisitors {
  activeVisitors: number;
  uniqueVisitorsToday: number;
}

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatYMD(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

const CLICK_ITEMS = [
  { type: "buttonClick", label: "Botones", icon: "smart_button", color: "orange" },
  { type: "blogClick", label: "Blogs", icon: "article", color: "indigo" },
  { type: "linkClick", label: "Enlaces", icon: "link", color: "pink" },
];

export default function AnalyticsWidget() {
  const [mode, setMode] = useState<RangeMode>("day");
  const [customFrom, setCustomFrom] = useState(toYMD(new Date()));
  const [customTo, setCustomTo] = useState(toYMD(new Date()));
  const [stats, setStats] = useState<RangeStats | null>(null);
  const [live, setLive] = useState<LiveVisitors>({ activeVisitors: 0, uniqueVisitorsToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    const today = new Date();
    if (mode === "week") {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: toYMD(from), to: toYMD(today) };
    }
    if (mode === "custom") {
      return { from: customFrom, to: customTo };
    }
    return { from: toYMD(today), to: toYMD(today) };
  }, [mode, customFrom, customTo]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, liveRes] = await Promise.all([
        fetch(`/api/analytics/stats?from=${range.from}&to=${range.to}`),
        fetch("/api/analytics/visitors"),
      ]);

      if (!statsRes.ok) throw new Error("Error cargando estadísticas");
      const statsData: RangeStats = await statsRes.json();
      setStats(statsData);

      if (liveRes.ok) {
        setLive(await liveRes.json());
      }
    } catch (err) {
      setError("Error cargando analytics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    loadData();
    // Reload every 30 seconds for near real-time data
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const totals = stats?.totals;
  const clicks = totals?.clicksByType || {};
  const uniqueVisitors = totals?.uniqueVisitorsRange ?? 0;

  const engagementScore = Math.min(
    100,
    Math.round(
      (totals?.totalClicks || 0) / Math.max(1, uniqueVisitors || 1) * 100
    )
  );

  const rangeLabel =
    mode === "day"
      ? "hoy"
      : mode === "week"
        ? "últimos 7 días"
        : `${formatYMD(range.from)} – ${formatYMD(range.to)}`;

  const filterBtn = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "bg-purple-600 text-white shadow"
        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
    }`;

  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
            <span className="material-icons-round text-white">show_chart</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Análisis de Visitas
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Range filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button className={filterBtn(mode === "day")} onClick={() => setMode("day")}>
            Día
          </button>
          <button className={filterBtn(mode === "week")} onClick={() => setMode("week")}>
            Semana
          </button>
          <button
            className={filterBtn(mode === "custom")}
            onClick={() => setMode("custom")}
          >
            Personalizado
          </button>
          {mode === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100"
              />
              <span className="text-slate-400 text-sm">a</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={toYMD(new Date())}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Online now (real-time, always today) */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700/50 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-300 mb-1">
                En línea ahora
              </p>
              <p className="text-4xl font-bold text-green-900 dark:text-green-100">
                {live.activeVisitors}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center relative">
              <span className="material-icons-round text-2xl text-green-600 dark:text-green-300">
                wifi_tethering
              </span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </div>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400">
            Visitantes activos en este momento (hoy)
          </p>
        </div>

        {/* Unique visitors in selected range */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700/50 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-1">
                Visitantes únicos
              </p>
              <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                {loading ? "…" : uniqueVisitors}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="material-icons-round text-2xl text-blue-600 dark:text-blue-300">
                people
              </span>
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Personas únicas {rangeLabel}
          </p>
        </div>

        {/* Total clicks in range */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700/50 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-1">
                Clicks
              </p>
              <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                {loading ? "…" : totals?.totalClicks || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <span className="material-icons-round text-2xl text-purple-600 dark:text-purple-300">
                touch_app
              </span>
            </div>
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            Interacciones {rangeLabel}
          </p>
        </div>

        {/* Engagement Score */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20 rounded-xl p-6 border border-amber-200 dark:border-amber-700/50 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-300 mb-1">
                Engagement
              </p>
              <p className="text-4xl font-bold text-amber-900 dark:text-amber-100">
                {loading ? "…" : `${engagementScore}%`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <span className="material-icons-round text-2xl text-amber-600 dark:text-amber-300">
                trending_up
              </span>
            </div>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Clicks por visitante {rangeLabel}
          </p>
        </div>
      </div>

      {/* Per-day breakdown (only when range > 1 day) */}
      {!loading && stats && stats.days.length > 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-icons-round text-blue-600 dark:text-blue-400">
              calendar_month
            </span>
            Visitas por día
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 pr-4 font-medium">Fecha</th>
                  <th className="pb-2 pr-4 font-medium text-right">Visitantes únicos</th>
                  <th className="pb-2 font-medium text-right">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {[...stats.days].reverse().map((d) => (
                  <tr
                    key={d.date}
                    className="border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                  >
                    <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                      {formatYMD(d.date)}
                    </td>
                    <td className="py-2 pr-4 text-right font-semibold text-blue-700 dark:text-blue-300">
                      {d.uniqueVisitors}
                    </td>
                    <td className="py-2 text-right font-semibold text-purple-700 dark:text-purple-300">
                      {d.totalClicks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Click Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
          <span className="material-icons-round text-purple-600 dark:text-purple-400">
            gesture
          </span>
          Desglose de Interacciones
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">
            ({rangeLabel})
          </span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CLICK_ITEMS.map((item) => (
            <div
              key={item.type}
              className={`bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded-lg p-4 border border-${item.color}-200 dark:border-${item.color}-700/50 text-center`}
            >
              <div
                className={`flex justify-center mb-2 text-${item.color}-600 dark:text-${item.color}-300`}
              >
                <span className="material-icons-round text-2xl">{item.icon}</span>
              </div>
              <p
                className={`text-2xl font-bold text-${item.color}-900 dark:text-${item.color}-100 mb-1`}
              >
                {clicks[item.type] || 0}
              </p>
              <p
                className={`text-xs text-${item.color}-600 dark:text-${item.color}-400`}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700/50 flex gap-3">
        <span className="material-icons-round text-blue-600 dark:text-blue-400 flex-shrink-0">
          info
        </span>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Los datos se actualizan cada 30 segundos. &quot;En línea ahora&quot; cuenta visitantes
          activos en los últimos 2 minutos. Los visitantes únicos se identifican por
          device-id y se reinician diariamente.
        </p>
      </div>
    </div>
  );
}
