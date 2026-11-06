"use client";

import React, { useEffect, useState } from "react";
import { obtenerTodasOrdenes } from "../lib/ordenes-db";
import { obtenerProductos, Producto } from "../lib/productos-db";
import { useRouter } from "next/navigation";
import { Loading3DIcon } from "../components/Loading3DIcon";
import AnalyticsWidget from "../components/AnalyticsWidget";
import { useTrackPageView } from "../lib/useAnalytics";

type Orden = {
	id: string;
	estado?: string;
	total?: number;
	productos?: { cantidad?: number; nombre?: string }[];
	orderId?: string;
	userName?: string;
	userId?: string;
	userEmail?: string;
	guestEmail?: string;
	visitaFecha?: string;
	visitaHora?: string;
	metodoPago?: string;
};

function getTodayYMD() {
	return new Date().toISOString().slice(0, 10);
}

function formatDate(ymd: string) {
	const [y, m, d] = ymd.split("-");
	return `${d}/${m}/${y}`;
}

export default function AdminPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [stats, setStats] = useState<{
		totalVentas: number;
		productosVendidos: number;
		productosSinStock: Producto[];
		ordenesHoy: Orden[];
		radioListenersToday: number;
		radioListenersActive: number;
	}>({
		totalVentas: 0,
		productosVendidos: 0,
		productosSinStock: [],
		ordenesHoy: [],
		radioListenersToday: 0,
		radioListenersActive: 0,
	});
	const router = useRouter();
	const today = getTodayYMD();

	// Track page view on admin page load
	useTrackPageView();

	useEffect(() => {
		async function fetchStats() {
			setLoading(true);
			setError("");
			try {
				const [ordenesRaw, productosRaw, radioStats] = await Promise.all([
					obtenerTodasOrdenes(),
					obtenerProductos({ incluirSinStock: true }),
					fetch("/api/radio/listeners").then(res => res.json()).catch(() => ({ activeListeners: 0, totalToday: 0 })),
				]);

				const ordenes = ordenesRaw as Orden[];
				const productos = productosRaw as Producto[];

				let totalVentas = 0;
				let productosVendidos = 0;
				for (const orden of ordenes) {
					if (orden.estado === "pagada" || orden.estado === "entregada") {
						totalVentas += Number(orden.total || 0);
						if (Array.isArray(orden.productos)) {
							productosVendidos += orden.productos.reduce(
								(acc, p) => acc + (Number(p.cantidad) || 0),
								0
							);
						}
					}
				}

				const productosSinStock = productos.filter((p) => Number(p.stock) === 0);

				// Órdenes con visita hoy (cualquier estado activo)
				const ordenesHoy = ordenes.filter(
					(o) =>
						o.visitaFecha === today &&
						o.estado !== "rechazada" &&
						o.estado !== "cancelada"
				);

				setStats({
					totalVentas,
					productosVendidos,
					productosSinStock,
					ordenesHoy,
					radioListenersToday: radioStats.totalToday || 0,
					radioListenersActive: radioStats.activeListeners || 0,
				});
			} catch (e) {
				setError("Error al cargar estadísticas. Intenta de nuevo.");
			} finally {
				setLoading(false);
			}
		}
		fetchStats();
	}, []);

	const getNombreCliente = (o: Orden) =>
		o.userName || o.userEmail || o.guestEmail || o.userId || "Sin datos";

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
			<div className="max-w-3xl mx-auto px-4 py-10">

				{/* Header */}
				<div className="mb-8">
					<p className="text-sm text-slate-400 dark:text-slate-500 mb-1">
						{new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
					</p>
					<h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Panel de administración</h1>
				</div>

				{loading ? (
					<div className="flex flex-col items-center justify-center py-20">
						<Loading3DIcon />
					</div>
				) : error ? (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm font-medium">
						{error}
					</div>
				) : (

					<div className="flex flex-col gap-8">						
						{/* Stats Cards Grid */}
						<div className="grid grid-cols-5 gap-4">

							{/* Oyentes en Vivo */}
							<div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:border-red-400 dark:hover:border-red-600 transition-colors">
								<p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Oyentes en vivo</p>
								<p className="text-2xl font-bold text-red-600 dark:text-red-400">
									{stats.radioListenersActive}
								</p>
							</div>

							{/* Oyentes de Radio */}
							<div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
								<p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Oyentes radio hoy</p>
								<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
									{stats.radioListenersToday}
								</p>
							</div>
						</div>


						{/* Analytics Widget - First Section */}
						<AnalyticsWidget />			

						{/* Accesos rápidos */}
						<div>
							<h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
								Accesos rápidos
							</h2>
							<div className="grid grid-cols-2 gap-3">
								{[
									{ label: "Pedidos", desc: "Gestionar todas las órdenes", href: "/admin/pedidos", icon: "📋" },
									{ label: "Productos", desc: "Inventario y stock", href: "/admin/productos", icon: "📦" },
									{ label: "Clientes", desc: "Ver usuarios registrados", href: "/admin/clientes", icon: "👥" },
									{ label: "Configuración", desc: "Ajustes del sistema", href: "/admin/configuracion", icon: "⚙️" },
								].map((item) => (
									<button
										key={item.href}
										onClick={() => router.push(item.href)}
										className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-left hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all"
									>
										<span className="text-xl mb-2 block" style={{ fontSize: 20 }}>{item.icon}</span>
										<p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{item.label}</p>
										<p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.desc}</p>
									</button>
								))}
							</div>
						</div>

					</div>
				)}
			</div>
		</div>
	);
}
