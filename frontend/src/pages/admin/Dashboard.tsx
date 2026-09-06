import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Truck,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Calendar,
  Award,
  Clock,
  Download,
  Percent,
  Flame
} from 'lucide-react';
import { api } from '../../api/client';
import { DashboardStats } from '../../types';
import { exportToCSV } from '../../utils/exportToExcel';

export const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/stats/dashboard?period=${period}`);
      setStats(res.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const periodLabels = {
    day: 'Hoy (Día)',
    month: 'Este Mes',
    year: 'Este Año'
  };

  const handleExportManagerial = () => {
    if (!stats) return;
    const headers = ['Métrica / Indicador', 'Valor ($ USD)', 'Valor (Bs VES)', 'Notas / Cantidad'];
    const rows = [
      ['Ventas Brutas', stats.sales.totalUSD.toFixed(2), stats.sales.totalVES.toFixed(2), `${stats.sales.count} facturas emitidas`],
      ['Ticket Promedio', stats.sales.averageTicketUSD.toFixed(2), (stats.sales.averageTicketUSD * stats.activeRate.rate).toFixed(2), 'Por cliente'],
      ['Compras de Mercancía', stats.purchases.totalUSD.toFixed(2), stats.purchases.totalVES.toFixed(2), `${stats.purchases.count} compras a proveedores`],
      ['Ganancia Neta (Utilidad)', stats.netBalance.profitUSD.toFixed(2), stats.netBalance.profitVES.toFixed(2), `Margen: ${stats.netBalance.marginPercent || 0}%`],
      ['Cuentas por Cobrar (Deudas)', stats.debts.totalUSD.toFixed(2), stats.debts.totalVES.toFixed(2), `${stats.debts.count} deudas pendientes`],
      ['Tasa Oficial BCV', stats.activeRate.rate.toFixed(2), '-', stats.activeRate.name],
      ['Productos Activos en Catálogo', stats.inventory.totalActiveProducts, '-', `${stats.inventory.lowStockCount} con stock bajo`]
    ];
    exportToCSV(`Informe_Gerencial_${period.toUpperCase()}`, headers, rows);
  };

  // Filter peak hours (6 AM to 9 PM)
  const hourlyData = (stats?.sales.byHour || []).filter((h) => h.hour >= 6 && h.hour <= 21);
  const maxHourlySales = Math.max(...hourlyData.map((h) => h.totalUSD), 1);

  return (
    <div className="space-y-6">
      {/* Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500" />
            Dashboard Estadístico & Gerencial
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas clave de rendimiento, horas pico de venta, utilidad y flujo de caja
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportManagerial}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Informe</span>
          </button>

          {/* Period Selector Tabs */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {(['day', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === p
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{periodLabels[p]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading || !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Main KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* VENTAS */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Ventas ({periodLabels[period]})
                </span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  ${stats.sales.totalUSD.toFixed(2)}
                </div>
                <div className="text-xs font-bold text-emerald-600 mt-0.5">
                  {stats.sales.totalVES.toFixed(2)} Bs
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Facturas: <strong>{stats.sales.count}</strong></span>
                <span>Promedio: <strong>${stats.sales.averageTicketUSD.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* COMPRAS */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Compras ({periodLabels[period]})
                </span>
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  ${stats.purchases.totalUSD.toFixed(2)}
                </div>
                <div className="text-xs font-bold text-indigo-600 mt-0.5">
                  {stats.purchases.totalVES.toFixed(2)} Bs
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Registros: <strong>{stats.purchases.count}</strong></span>
                <span className="text-indigo-600 font-semibold">Reposición Stock</span>
              </div>
            </div>

            {/* BALANCE NETO & MARGEN */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Utilidad Neta ({periodLabels[period]})
                </span>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                  stats.netBalance.profitUSD >= 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-black ${
                  stats.netBalance.profitUSD >= 0 ? 'text-slate-900' : 'text-rose-600'
                }`}>
                  ${stats.netBalance.profitUSD.toFixed(2)}
                </div>
                <div className="text-xs font-bold text-amber-600 mt-0.5">
                  {stats.netBalance.profitVES.toFixed(2)} Bs
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Margen Comercial:</span>
                <span className={`font-bold flex items-center gap-0.5 ${
                  (stats.netBalance.marginPercent || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  <Percent className="w-3 h-3" />
                  {stats.netBalance.marginPercent || 0}%
                </span>
              </div>
            </div>

            {/* CUENTAS POR COBRAR */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Cuentas por Cobrar (Fiados)
                </span>
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-rose-600">
                  ${stats.debts.totalUSD.toFixed(2)}
                </div>
                <div className="text-xs font-bold text-rose-500 mt-0.5">
                  {stats.debts.totalVES.toFixed(2)} Bs
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Deudores Activos:</span>
                <span className="font-bold text-rose-700">{stats.debts.count} clientes</span>
              </div>
            </div>
          </div>

          {/* Peak Rush Hours Visual Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Horas Pico de Afluencia & Ventas ({periodLabels[period]})
                  </h3>
                  <p className="text-[11px] text-slate-400">Distribución de volumen de facturación por hora del día</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-8 sm:grid-cols-16 gap-2 pt-4 items-end h-40">
              {hourlyData.map((h) => {
                const heightPercent = maxHourlySales > 0 ? (h.totalUSD / maxHourlySales) * 100 : 0;
                const isPeak = heightPercent >= 75 && h.totalUSD > 0;
                return (
                  <div key={h.hour} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                      {h.label}: ${h.totalUSD.toFixed(2)} ({h.count} ventas)
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${Math.max(heightPercent, 6)}%` }}
                      className={`w-full max-w-[24px] rounded-t-lg transition-all ${
                        isPeak
                          ? 'bg-amber-500 group-hover:bg-amber-600 shadow-md shadow-amber-500/20'
                          : h.totalUSD > 0
                          ? 'bg-indigo-500 group-hover:bg-indigo-600'
                          : 'bg-slate-100'
                      }`}
                    ></div>

                    <span className="text-[9px] font-bold text-slate-400 mt-2">{h.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secondary Grid: Top Products, Payment Methods, Low Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Productos Más Vendidos ({periodLabels[period]})
                  </h3>
                </div>
              </div>

              {stats.topProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No hay ventas registradas en este período.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.topProducts.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-amber-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-500">{item.totalQuantity} unidades vendidas</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        ${item.totalUSD.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory Alerts & Rate Info */}
            <div className="space-y-6">
              {/* Tasa Activa Card */}
              <div className="bg-gradient-to-br from-slate-900 to-amber-950 text-white rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">Tasa de Cambio Oficial (BCV)</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 text-3xl font-black">
                  {stats.activeRate.rate.toFixed(2)} <span className="text-xs font-medium text-slate-300">Bs/$</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Sincronización automática activa cada 2h
                </p>
              </div>

              {/* Low Stock Alerts */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="font-bold text-xs uppercase tracking-wide">
                    Alertas de Stock Bajo ({stats.inventory.lowStockCount})
                  </h3>
                </div>

                {stats.inventory.lowStockItems.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-medium">✓ Todos los productos tienen buen stock.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.inventory.lowStockItems.map((prod) => (
                      <div key={prod.id} className="flex items-center justify-between text-xs p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
                        <span className="font-bold text-slate-800 truncate max-w-[150px]">{prod.name}</span>
                        <span className="font-black text-rose-600 bg-white px-2 py-0.5 rounded-lg shadow-sm">
                          {prod.stock} disp.
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
