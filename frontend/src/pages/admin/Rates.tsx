import React, { useState, useEffect } from 'react';
import { Plus, Edit2, CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import { api } from '../../api/client';
import { ExchangeRate } from '../../types';
import { Modal } from '../../components/common/Modal';

export const Rates: React.FC = () => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [name, setName] = useState('');
  const [rateValue, setRateValue] = useState(65.5);
  const [symbol, setSymbol] = useState('VES');
  const [isActive, setIsActive] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState<{ date?: string; changePct?: number } | null>(null);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      const res = await api.get('/rates');
      setRates(res.data.rates || []);
    } catch (error) {
      console.error('Error al cargar tasas:', error);
    }
  };

  const handleSyncDolarVzla = async () => {
    try {
      setSyncing(true);
      setSyncMessage('');
      const res = await api.post('/rates/sync-dolarvzla');
      setSyncMessage(`¡Tasa BCV actualizada a ${res.data.rate.rate.toFixed(2)} Bs/$ exitosamente!`);
      if (res.data.apiData?.current) {
        setSyncInfo({
          date: res.data.apiData.current.date,
          changePct: res.data.apiData.changePercentage?.usd
        });
      }
      loadRates();
      setTimeout(() => setSyncMessage(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al sincronizar con la API de DolarVzla');
    } finally {
      setSyncing(false);
    }
  };

  const openCreateModal = () => {
    setEditingRate(null);
    setName('Paralelo');
    setRateValue(72.0);
    setSymbol('VES');
    setIsActive(false);
    setIsModalOpen(true);
  };

  const openEditModal = (r: ExchangeRate) => {
    setEditingRate(r);
    setName(r.name);
    setRateValue(r.rate);
    setSymbol(r.symbol);
    setIsActive(r.isActive);
    setIsModalOpen(true);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        rate: Number(rateValue),
        symbol,
        isActive
      };

      if (editingRate) {
        await api.put(`/rates/${editingRate.id}`, payload);
      } else {
        await api.post('/rates', payload);
      }

      setIsModalOpen(false);
      loadRates();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar tasa');
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await api.patch(`/rates/${id}/set-active`);
      loadRates();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al activar tasa');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tasas de Cambio & Monitor DolarVzla
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sincronización automática de tasa oficial BCV y administración de tasas paralelas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón de Sincronización en Vivo */}
          <button
            disabled={syncing}
            onClick={handleSyncDolarVzla}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            title="Consultar API oficial de DolarVzla / BCV"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Consultando BCV...' : 'Sincronizar BCV'}</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Tasa</span>
          </button>
        </div>
      </div>

      {/* Sync Success Banner */}
      {syncMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>{syncMessage}</span>
          </div>
          {syncInfo?.date && (
            <span className="text-[11px] text-emerald-700 font-semibold">
              Fecha valor oficial: {syncInfo.date} {syncInfo.changePct !== undefined ? `(${syncInfo.changePct > 0 ? '+' : ''}${syncInfo.changePct.toFixed(2)}%)` : ''}
            </span>
          )}
        </div>
      )}

      {/* Grid of Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rates.map((r) => (
          <div
            key={r.id}
            className={`bg-white rounded-2xl p-5 border transition-all ${
              r.isActive
                ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
                : 'border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">{r.name}</span>
              {r.isActive ? (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-amber-600" />
                  Tasa Activa en Tienda
                </span>
              ) : (
                <button
                  onClick={() => handleSetActive(r.id)}
                  className="text-[10px] font-bold text-slate-500 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Activar Tasa
                </button>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{r.rate.toFixed(2)}</span>
              <span className="text-xs font-bold text-amber-700">{r.symbol} / USD ($)</span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">
                Actualizado: {r.updatedAt ? new Date(r.updatedAt).toLocaleString('es-VE') : '-'}
              </span>
              <button
                onClick={() => openEditModal(r)}
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRate ? 'Editar Tasa de Cambio' : 'Registrar Nueva Tasa'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveRate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de la Tasa *</label>
            <input
              type="text"
              required
              placeholder="Ej. BCV Oficial o Paralelo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Valor en Bolívares *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={rateValue}
                onChange={(e) => setRateValue(parseFloat(e.target.value) || 0)}
                className="w-full p-2 text-xs font-black bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Símbolo</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveRate"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-amber-500"
            />
            <label htmlFor="isActiveRate" className="text-xs font-bold text-slate-700">
              Establecer inmediatamente como tasa activa de todo el sistema
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-md"
            >
              Guardar Tasa
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
