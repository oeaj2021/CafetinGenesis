import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Coffee,
  RefreshCw,
  Volume2,
  VolumeX
} from 'lucide-react';
import { api } from '../../api/client';
import { Invoice } from '../../types';

export const KitchenDisplay: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PREPARING' | 'READY' | 'DAILY_MENU'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Local state for kitchen preparation status per invoice
  const [orderStatus, setOrderStatus] = useState<Record<string, 'PREPARING' | 'READY' | 'DELIVERED'>>({});

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      loadOrders(false);
    }, 10000); // Polling cada 10s
    return () => clearInterval(interval);
  }, []);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Ignore audio context errors
    }
  };

  const loadOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/invoices?limit=40');
      const fetched: Invoice[] = res.data.invoices || [];

      // Only today's orders
      const today = new Date().toDateString();
      const todayOrders = fetched.filter(
        (inv) => new Date(inv.createdAt).toDateString() === today
      );

      setInvoices(todayOrders);
    } catch (error) {
      console.error('Error cargando comandas de cocina:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const setStatus = (id: string, st: 'PREPARING' | 'READY' | 'DELIVERED') => {
    setOrderStatus((prev) => ({ ...prev, [id]: st }));
    if (st === 'READY') {
      playChime();
    }
  };

  const getStatus = (id: string): 'PREPARING' | 'READY' | 'DELIVERED' => {
    return orderStatus[id] || 'PREPARING';
  };

  const filteredInvoices = invoices.filter((inv) => {
    const st = getStatus(inv.id);
    if (st === 'DELIVERED') return false;
    if (filter === 'PREPARING') return st === 'PREPARING';
    if (filter === 'READY') return st === 'READY';
    if (filter === 'DAILY_MENU') {
      return inv.notes?.includes('[MENÚ DEL DÍA') || inv.items?.some(i => i.productName.toLowerCase().includes('menú del día'));
    }
    return true;
  });

  const getMinutesElapsed = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    return Math.max(0, diff);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ChefHat className="w-7 h-7 text-amber-600" />
            Pantalla de Cocina & Baristas (KDS)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cola de preparación de comandas, menús del día y pedidos en tiempo real
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              soundEnabled
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
            title={soundEnabled ? 'Sonido Activado' : 'Sonido Silenciado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => loadOrders(true)}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refrescar</span>
          </button>

          {/* Filter Tabs */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {(['ALL', 'PREPARING', 'READY', 'DAILY_MENU'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filter === tab
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'ALL'
                  ? 'Todos'
                  : tab === 'PREPARING'
                  ? 'En Cocina'
                  : tab === 'READY'
                  ? 'Listos'
                  : '⭐ Menú del Día'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse h-64"></div>
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800">¡Todo al día en cocina!</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No hay comandas pendientes de preparación en este momento. Las nuevas órdenes del POS y del Menú Diario aparecerán automáticamente aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInvoices.map((inv) => {
            const st = getStatus(inv.id);
            const minutes = getMinutesElapsed(inv.createdAt);
            const isLate = minutes >= 10 && st === 'PREPARING';
            const isDailyMenu =
              inv.notes?.includes('[MENÚ DEL DÍA') ||
              inv.items?.some((i) => i.productName.toLowerCase().includes('menú del día'));

            return (
              <div
                key={inv.id}
                className={`rounded-3xl border transition-all shadow-sm flex flex-col justify-between overflow-hidden ${
                  st === 'READY'
                    ? 'bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-400/30'
                    : isLate
                    ? 'bg-rose-50/40 border-rose-300 ring-2 ring-rose-400/30'
                    : isDailyMenu
                    ? 'bg-amber-50/30 border-amber-300 ring-2 ring-amber-400/30'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900">
                        {inv.invoiceNumber}
                      </span>
                      {isDailyMenu && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                          ⭐ MENÚ DEL DÍA
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-600 truncate max-w-[160px]">
                      {inv.clientName}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black ${
                        st === 'READY'
                          ? 'bg-emerald-500 text-white'
                          : isLate
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {minutes} min
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(inv.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 space-y-2.5 flex-1">
                  {inv.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs pb-2 border-b border-dashed border-slate-100 last:border-0">
                      <div className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                          {item.quantity}x
                        </span>
                        <span className="font-bold text-slate-800 leading-tight">
                          {item.productName}
                        </span>
                      </div>
                    </div>
                  ))}

                  {inv.notes && (
                    <div className="mt-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] font-medium text-amber-950 space-y-1">
                      <div className="font-bold text-[10px] uppercase tracking-wider text-amber-800">
                        📋 Detalle de Producción / Cocina:
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {inv.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  {st === 'PREPARING' ? (
                    <button
                      onClick={() => setStatus(inv.id, 'READY')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Marcar Listo</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => setStatus(inv.id, 'PREPARING')}
                        className="py-2 px-3 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                      >
                        Regresar
                      </button>
                      <button
                        onClick={() => setStatus(inv.id, 'DELIVERED')}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm"
                      >
                        Despachado ✓
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
