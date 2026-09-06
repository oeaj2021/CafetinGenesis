import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Smartphone,
  CreditCard,
  Building2,
  FileSpreadsheet,
  Coins,
  CheckCircle,
  X,
  Plus,
  Trash2,
  Calculator
} from 'lucide-react';
import { PaymentBreakdownItem } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalUSD: number;
  rate: number;
  onConfirm: (paymentData: {
    paymentMethod: 'CASH_USD' | 'CASH_VES' | 'PAGO_MOVIL' | 'CARD' | 'ZELLE' | 'CREDIT' | 'MIXED';
    amountPaidUSD: number;
    changeUSD: number;
    paymentBreakdown?: PaymentBreakdownItem[];
  }) => void;
  loading: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalUSD,
  rate,
  onConfirm,
  loading
}) => {
  const [mode, setMode] = useState<'SINGLE' | 'SPLIT'>('SINGLE');
  const [singleMethod, setSingleMethod] = useState<'CASH_USD' | 'CASH_VES' | 'PAGO_MOVIL' | 'CARD' | 'ZELLE' | 'CREDIT'>('CASH_USD');
  const [tenderedUSD, setTenderedUSD] = useState<number>(totalUSD);
  const [tenderedCurrency, setTenderedCurrency] = useState<'USD' | 'VES'>('USD');
  const [reference, setReference] = useState('');

  // Split payment list
  const [splitItems, setSplitItems] = useState<PaymentBreakdownItem[]>([]);
  const [currentSplitMethod, setCurrentSplitMethod] = useState<string>('CASH_USD');
  const [currentSplitAmountUSD, setCurrentSplitAmountUSD] = useState<number>(0);
  const [currentSplitRef, setCurrentSplitRef] = useState<string>('');

  const totalVES = totalUSD * rate;

  useEffect(() => {
    setTenderedUSD(totalUSD);
    setSplitItems([]);
  }, [totalUSD, isOpen]);

  if (!isOpen) return null;

  // Calculo de cambio
  const changeUSD = Math.max(0, parseFloat((tenderedUSD - totalUSD).toFixed(2)));
  const changeVES = parseFloat((changeUSD * rate).toFixed(2));

  // Split calculations
  const totalSplitUSD = splitItems.reduce((acc, i) => acc + i.amountUSD, 0);
  const remainingSplitUSD = Math.max(0, parseFloat((totalUSD - totalSplitUSD).toFixed(2)));
  const remainingSplitVES = parseFloat((remainingSplitUSD * rate).toFixed(2));

  const handleAddSplitItem = () => {
    if (currentSplitAmountUSD <= 0) return;
    const amountVES = parseFloat((currentSplitAmountUSD * rate).toFixed(2));
    setSplitItems((prev) => [
      ...prev,
      {
        method: currentSplitMethod,
        amountUSD: currentSplitAmountUSD,
        amountVES,
        reference: currentSplitRef || null
      }
    ]);
    setCurrentSplitAmountUSD(0);
    setCurrentSplitRef('');
  };

  const handleRemoveSplitItem = (index: number) => {
    setSplitItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmPayment = () => {
    if (mode === 'SINGLE') {
      onConfirm({
        paymentMethod: singleMethod,
        amountPaidUSD: tenderedUSD,
        changeUSD,
        paymentBreakdown: reference ? [{ method: singleMethod, amountUSD: totalUSD, amountVES: totalVES, reference }] : undefined
      });
    } else {
      if (remainingSplitUSD > 0.01) {
        alert(`Aún falta por cubrir $${remainingSplitUSD.toFixed(2)} (${remainingSplitVES.toFixed(2)} Bs) en el pago dividido.`);
        return;
      }
      onConfirm({
        paymentMethod: 'MIXED',
        amountPaidUSD: totalSplitUSD,
        changeUSD: 0,
        paymentBreakdown: splitItems
      });
    }
  };

  const setQuickCash = (cashVal: number) => {
    setTenderedCurrency('USD');
    setTenderedUSD(cashVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-slate-900 text-base">Cobro & Calculadora de Vuelto</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-amber-950 p-6 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Total a Cobrar</span>
            <div className="text-3xl font-black mt-0.5">${totalUSD.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-300">Tasa Oficial: {rate.toFixed(2)} Bs</span>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5">{totalVES.toFixed(2)} Bs</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-2">
          <button
            onClick={() => setMode('SINGLE')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'SINGLE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Pago Único + Vuelto
          </button>
          <button
            onClick={() => setMode('SPLIT')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'SPLIT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Pago Dividido / Mixto
          </button>
        </div>

        <div className="p-6 space-y-5">
          {mode === 'SINGLE' ? (
            <>
              {/* Payment Methods Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Selecciona Método de Pago:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH_USD', label: 'Efectivo $', icon: DollarSign },
                    { id: 'CASH_VES', label: 'Efectivo Bs', icon: Coins },
                    { id: 'PAGO_MOVIL', label: 'Pago Móvil', icon: Smartphone },
                    { id: 'CARD', label: 'Punto (Tarjeta)', icon: CreditCard },
                    { id: 'ZELLE', label: 'Zelle', icon: Building2 },
                    { id: 'CREDIT', label: 'Crédito / Fiado', icon: FileSpreadsheet }
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = singleMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSingleMethod(m.id as any)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash & Change Calculator Section */}
              {(singleMethod === 'CASH_USD' || singleMethod === 'CASH_VES') && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Monto Entregado por Cliente:</label>
                    <div className="flex bg-slate-200 p-0.5 rounded-lg text-[11px] font-bold">
                      <button
                        onClick={() => setTenderedCurrency('USD')}
                        className={`px-2 py-0.5 rounded ${tenderedCurrency === 'USD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                      >
                        En $
                      </button>
                      <button
                        onClick={() => setTenderedCurrency('VES')}
                        className={`px-2 py-0.5 rounded ${tenderedCurrency === 'VES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                      >
                        En Bs
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tenderedCurrency === 'USD' ? (tenderedUSD || '') : parseFloat(((tenderedUSD || 0) * rate).toFixed(2))}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (tenderedCurrency === 'USD') setTenderedUSD(val);
                        else setTenderedUSD(parseFloat((val / rate).toFixed(2)));
                      }}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-base font-bold focus:ring-2 focus:ring-amber-500/50 outline-none"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      {tenderedCurrency === 'USD' ? '$' : 'Bs'}
                    </span>
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1">Rápido:</span>
                    <button
                      onClick={() => setTenderedUSD(totalUSD)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Exacto
                    </button>
                    {[5, 10, 20, 50, 100].map((cash) => (
                      <button
                        key={cash}
                        onClick={() => setQuickCash(cash)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:border-amber-400"
                      >
                        ${cash}
                      </button>
                    ))}
                  </div>

                  {/* Change / Vuelto Display */}
                  <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 uppercase">Cambio / Vuelto a entregar:</span>
                      <div className="text-xl font-black text-emerald-700">${changeUSD.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-emerald-600">Equivalente en Bolívares:</span>
                      <div className="text-base font-extrabold text-emerald-900">{changeVES.toFixed(2)} Bs</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reference number for electronic payments */}
              {(singleMethod === 'PAGO_MOVIL' || singleMethod === 'CARD' || singleMethod === 'ZELLE') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">N° de Referencia / Aprobación (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ej. #849120"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/50 outline-none"
                  />
                </div>
              )}
            </>
          ) : (
            /* Split / Mixed Payment Mode */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900">
                <span>Resta por cubrir:</span>
                <span className="text-sm font-black">${remainingSplitUSD.toFixed(2)} (~ {remainingSplitVES.toFixed(2)} Bs)</span>
              </div>

              {/* Add Split Payment Form */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700">Agregar Método al Pago Dividido:</span>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={currentSplitMethod}
                    onChange={(e) => setCurrentSplitMethod(e.target.value)}
                    className="col-span-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="CASH_USD">💵 Efectivo $</option>
                    <option value="CASH_VES">🇻🇪 Efectivo Bs</option>
                    <option value="PAGO_MOVIL">📲 Pago Móvil</option>
                    <option value="CARD">💳 Tarjeta</option>
                    <option value="ZELLE">🏦 Zelle</option>
                  </select>

                  <div className="relative col-span-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Monto ($)"
                      value={currentSplitAmountUSD || ''}
                      onChange={(e) => setCurrentSplitAmountUSD(parseFloat(e.target.value) || 0)}
                      className="w-full pl-6 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSplitItem}
                    className="col-span-1 flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir</span>
                  </button>
                </div>
              </div>

              {/* Split Items List */}
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {splitItems.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">No has agregado pagos parciales aún.</p>
                ) : (
                  splitItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{item.method}</span>
                        <p className="text-[10px] text-slate-500">${item.amountUSD.toFixed(2)} (~ {item.amountVES.toFixed(2)} Bs)</p>
                      </div>
                      <button
                        onClick={() => handleRemoveSplitItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
          >
            Cancelar
          </button>
          <button
            disabled={loading || (mode === 'SPLIT' && remainingSplitUSD > 0.01)}
            onClick={handleConfirmPayment}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{loading ? 'Procesando...' : 'Completar y Generar Factura'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
