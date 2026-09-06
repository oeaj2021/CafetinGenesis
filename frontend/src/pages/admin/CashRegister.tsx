import React, { useState, useEffect } from 'react';
import {
  Vault,
  Clock,
  DollarSign,
  Coins,
  Smartphone,
  CreditCard,
  Building2,
  History,
  Lock,
  Unlock,
  Download
} from 'lucide-react';
import { api } from '../../api/client';
import { CashShift } from '../../types';
import { exportToCSV } from '../../utils/exportToExcel';

export const CashRegister: React.FC = () => {
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [history, setHistory] = useState<CashShift[]>([]);

  // Open shift modal
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [initialUSD, setInitialUSD] = useState<number>(0);
  const [initialVES, setInitialVES] = useState<number>(0);
  const [openNotes, setOpenNotes] = useState('');

  // Close shift modal (Arqueo)
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [countedUSD, setCountedUSD] = useState<number>(0);
  const [countedVES, setCountedVES] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadShiftData();
  }, []);

  const loadShiftData = async () => {
    try {
      const [currRes, histRes] = await Promise.all([
        api.get('/cash-shifts/current'),
        api.get('/cash-shifts/history')
      ]);
      setCurrentShift(currRes.data.shift || null);
      setMetrics(currRes.data.metrics || null);
      setHistory(histRes.data.shifts || []);
    } catch (error) {
      console.error('Error cargando datos de caja:', error);
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/cash-shifts/open', {
        initialCashUSD: initialUSD,
        initialCashVES: initialVES,
        notes: openNotes
      });
      setIsOpenModalOpen(false);
      setInitialUSD(0);
      setInitialVES(0);
      setOpenNotes('');
      loadShiftData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al abrir caja');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/cash-shifts/close', {
        closedCashUSD: countedUSD,
        closedCashVES: countedVES,
        notes: closeNotes
      });
      alert('¡Cierre de caja y arqueo completado exitosamente!');
      setIsCloseModalOpen(false);
      setCountedUSD(0);
      setCountedVES(0);
      setCloseNotes('');
      loadShiftData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cerrar caja');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportHistory = () => {
    const headers = [
      'ID',
      'Cajero',
      'Estado',
      'Fondo Inicial ($)',
      'Fondo Inicial (Bs)',
      'Total Ventas ($)',
      'Total Ventas (Bs)',
      'Efectivo Esperado ($)',
      'Efectivo Contado ($)',
      'Diferencia ($)',
      'Apertura',
      'Cierre'
    ];
    const rows = history.map((s) => [
      s.id.slice(0, 8),
      s.cashierName,
      s.status === 'OPEN' ? 'ABIERTO' : 'CERRADO',
      s.initialCashUSD.toFixed(2),
      s.initialCashVES.toFixed(2),
      s.totalSalesUSD.toFixed(2),
      s.totalSalesVES.toFixed(2),
      (s.expectedCashUSD || 0).toFixed(2),
      (s.closedCashUSD || 0).toFixed(2),
      (s.differenceUSD || 0).toFixed(2),
      new Date(s.openedAt).toLocaleString('es-VE'),
      s.closedAt ? new Date(s.closedAt).toLocaleString('es-VE') : 'En curso'
    ]);
    exportToCSV('Historial_Cierres_Caja', headers, rows);
  };

  const diffUSD = metrics ? parseFloat((countedUSD - metrics.expectedCashUSD).toFixed(2)) : 0;
  const diffVES = metrics ? parseFloat((countedVES - metrics.expectedCashVES).toFixed(2)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Vault className="w-6 h-6 text-amber-600" /> Control & Arqueo de Caja
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestiona la apertura, monitoreo en vivo de turnos y cierre de caja diario (Reporte Z).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportHistory}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Historial</span>
          </button>
        </div>
      </div>

      {/* Main Status Hero Card */}
      {currentShift ? (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-300 mb-3 backdrop-blur-sm">
                <Unlock className="w-3.5 h-3.5" /> Turno de Caja Abierto
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                Cajero: {currentShift.cashierName}
              </h2>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Abierta el:{' '}
                {new Date(currentShift.openedAt).toLocaleString('es-VE')}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCountedUSD(metrics?.expectedCashUSD || 0);
                  setCountedVES(metrics?.expectedCashVES || 0);
                  setIsCloseModalOpen(true);
                }}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-lg shadow-rose-600/30 active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar Turno & Arqueo</span>
              </button>
            </div>
          </div>

          {/* Live Metrics Grid */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60">
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Fondo Inicial</span>
                <p className="text-lg font-black text-white mt-1">${currentShift.initialCashUSD.toFixed(2)}</p>
                <p className="text-[10px] text-amber-400 font-mono">{currentShift.initialCashVES.toFixed(2)} Bs</p>
              </div>

              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Ventas Turno</span>
                <p className="text-lg font-black text-white mt-1">${metrics.totalSalesUSD.toFixed(2)}</p>
                <p className="text-[10px] text-emerald-400 font-mono">{metrics.totalSalesVES.toFixed(2)} Bs</p>
              </div>

              <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/20">
                <span className="text-[11px] text-emerald-300 font-semibold uppercase">Efectivo Teórico en Gaveta ($)</span>
                <p className="text-lg font-black text-emerald-400 mt-1">${metrics.expectedCashUSD.toFixed(2)}</p>
                <p className="text-[10px] text-slate-300">Incluye fondo inicial</p>
              </div>

              <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/20">
                <span className="text-[11px] text-emerald-300 font-semibold uppercase">Efectivo Teórico en Gaveta (Bs)</span>
                <p className="text-lg font-black text-emerald-400 mt-1">{metrics.expectedCashVES.toFixed(2)} Bs</p>
                <p className="text-[10px] text-slate-300">Incluye fondo inicial</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Box is closed card */
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">La caja está actualmente CERRADA</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Inicia un nuevo turno de trabajo registrando el fondo base inicial en dólares y bolívares en efectivo.
          </p>
          <button
            onClick={() => setIsOpenModalOpen(true)}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-3 rounded-xl font-black text-xs transition-all shadow-md active:scale-95"
          >
            <Unlock className="w-4 h-4" />
            <span>Abrir Turno de Caja</span>
          </button>
        </div>
      )}

      {/* Electronic Payments Breakdown in Current Shift */}
      {currentShift && metrics && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            Desglose de Métodos de Pago en Este Turno
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Efectivo $</span>
              <p className="text-base font-black text-slate-900 mt-1">${metrics.totalCashUSD.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> Efectivo Bs</span>
              <p className="text-base font-black text-slate-900 mt-1">{metrics.totalCashVES.toFixed(2)} Bs</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> Pago Móvil</span>
              <p className="text-base font-black text-slate-900 mt-1">{metrics.totalPagoMovilVES.toFixed(2)} Bs</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Punto / Tarjeta</span>
              <p className="text-base font-black text-slate-900 mt-1">{metrics.totalCardVES.toFixed(2)} Bs</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Zelle</span>
              <p className="text-base font-black text-slate-900 mt-1">${metrics.totalZelleUSD.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <History className="w-5 h-5 text-amber-600" />
          <h3 className="font-extrabold text-slate-900 text-sm">Historial de Turnos & Arqueos Anteriores</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-3.5">Cajero</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5">Apertura</th>
                <th className="p-3.5">Cierre</th>
                <th className="p-3.5 text-right">Fondo Base</th>
                <th className="p-3.5 text-right">Ventas ($)</th>
                <th className="p-3.5 text-right">Diferencia ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No hay turnos registrados en el historial.
                  </td>
                </tr>
              ) : (
                history.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{s.cashierName}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          s.status === 'OPEN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.status === 'OPEN' ? 'ABIERTO' : 'CERRADO'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">{new Date(s.openedAt).toLocaleString('es-VE')}</td>
                    <td className="p-3.5 text-slate-500">
                      {s.closedAt ? new Date(s.closedAt).toLocaleString('es-VE') : 'En curso'}
                    </td>
                    <td className="p-3.5 text-right font-medium text-slate-700">
                      ${s.initialCashUSD.toFixed(2)} / {s.initialCashVES.toFixed(2)} Bs
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      ${s.totalSalesUSD.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-bold">
                      {s.differenceUSD !== null && s.differenceUSD !== undefined ? (
                        <span
                          className={
                            s.differenceUSD === 0
                              ? 'text-emerald-600'
                              : s.differenceUSD > 0
                              ? 'text-blue-600'
                              : 'text-rose-600'
                          }
                        >
                          {s.differenceUSD > 0 ? `+${s.differenceUSD.toFixed(2)}` : s.differenceUSD.toFixed(2)} $
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Apertura de Caja */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Apertura de Turno de Caja</h3>
            <form onSubmit={handleOpenShift} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Fondo Base en Dólares en Efectivo ($):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={initialUSD}
                  onChange={(e) => setInitialUSD(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Fondo Base en Bolívares en Efectivo (Bs):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={initialVES}
                  onChange={(e) => setInitialVES(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Notas de Apertura (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ej. Billetes de baja denominación para cambio"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md"
                >
                  {submitting ? 'Abriendo...' : 'Abrir Caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cierre de Caja (Arqueo Z) */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-6">
            <h3 className="text-base font-black text-slate-900">Arqueo & Cierre de Turno de Caja</h3>

            <form onSubmit={handleCloseShift} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-amber-900">
                  <span>Efectivo Teórico Esperado ($):</span>
                  <span>${(metrics?.expectedCashUSD || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-900">
                  <span>Efectivo Teórico Esperado (Bs):</span>
                  <span>{(metrics?.expectedCashVES || 0).toFixed(2)} Bs</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Conteo Físico en Dólares ($):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={countedUSD}
                  onChange={(e) => setCountedUSD(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Conteo Físico en Bolívares (Bs):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={countedVES}
                  onChange={(e) => setCountedVES(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold mt-1"
                />
              </div>

              {/* Difference feedback */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Diferencia en Dólares:</span>
                  <span className={diffUSD === 0 ? 'text-emerald-600' : diffUSD > 0 ? 'text-blue-600' : 'text-rose-600'}>
                    {diffUSD > 0 ? `+${diffUSD}` : diffUSD} $ {diffUSD === 0 ? '(Exacto)' : diffUSD > 0 ? '(Sobrante)' : '(Faltante)'}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Diferencia en Bolívares:</span>
                  <span className={diffVES === 0 ? 'text-emerald-600' : diffVES > 0 ? 'text-blue-600' : 'text-rose-600'}>
                    {diffVES > 0 ? `+${diffVES}` : diffVES} Bs
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Observaciones del Cierre (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ej. Cuadre perfecto o motivo de diferencia"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md"
                >
                  {submitting ? 'Cerrando...' : 'Confirmar Cierre & Reporte Z'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
