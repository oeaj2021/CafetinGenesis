import React, { useState, useEffect } from 'react';
import { CreditCard, Search, PlusCircle, History, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { api } from '../../api/client';
import { Debt, ExchangeRate } from '../../types';
import { Modal } from '../../components/common/Modal';
import { exportToCSV } from '../../utils/exportToExcel';

export const Debts: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [activeRate, setActiveRate] = useState<ExchangeRate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Payment Form
  const [amountUSD, setAmountUSD] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH_USD' | 'CASH_VES' | 'PAGO_MOVIL' | 'CARD' | 'ZELLE'>('CASH_USD');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const [debtsRes, rateRes] = await Promise.all([
        api.get('/debts'),
        api.get('/rates/active')
      ]);
      setDebts(debtsRes.data.debts || []);
      setActiveRate(rateRes.data.rate || null);
    } catch (error) {
      console.error('Error al cargar deudas:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentRate = activeRate?.rate || 1;

  const handleExport = () => {
    const headers = [
      'Cliente',
      'Cédula/RIF',
      'Teléfono',
      'Factura',
      'Monto Original ($)',
      'Saldo Pendiente ($)',
      'Saldo al Día (Bs)',
      'Tasa de Cambio',
      'Estado',
      'Fecha Emisión'
    ];
    const rows = debts.map((d) => [
      d.client?.name || 'Consumidor Final',
      d.client?.idNumber || 'N/A',
      d.client?.phone || 'N/A',
      d.invoice?.invoiceNumber || 'Venta a Crédito',
      d.totalUSD.toFixed(2),
      d.remainingUSD.toFixed(2),
      (d.remainingUSD * currentRate).toFixed(2),
      currentRate.toFixed(2),
      d.status === 'PAID' ? 'SALDADA' : d.status === 'PARTIAL' ? 'CON ABONOS' : 'PENDIENTE',
      new Date(d.createdAt).toLocaleDateString('es-VE')
    ]);
    exportToCSV('Reporte_Deudores_Cuentas_Por_Cobrar', headers, rows);
  };

  const openPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setAmountUSD(debt.remainingUSD);
    setPaymentMethod('CASH_USD');
    setReference('');
    setNote('');
    setIsPaymentModalOpen(true);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    try {
      await api.post(`/debts/${selectedDebt.id}/payments`, {
        amountUSD: Number(amountUSD),
        paymentMethod,
        reference: reference || null,
        note: note || null
      });

      setIsPaymentModalOpen(false);
      loadDebts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar el abono');
    }
  };

  const handleDownloadPDF = async (debt: Debt) => {
    try {
      const response = await api.get(`/debts/${debt.id}/pdf`, {
        responseType: 'blob'
      });
      const isPaid = debt.status === 'PAID';
      const filename = `${isPaid ? 'Finiquito_Solvente' : 'Estado_Cuenta'}_${(debt.client?.name || 'Cliente').replace(/\s+/g, '_')}.pdf`;
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al descargar PDF');
    }
  };

  const handleDownloadImage = async (debt: Debt) => {
    try {
      const response = await api.get(`/debts/${debt.id}/image`, {
        responseType: 'blob'
      });
      const isPaid = debt.status === 'PAID';
      const filename = `${isPaid ? 'Finiquito_Solvente' : 'Estado_Cuenta'}_${(debt.client?.name || 'Cliente').replace(/\s+/g, '_')}.png`;
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al descargar imagen');
    }
  };

  const filtered = debts.filter((d) => {
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchSearch =
      d.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.client?.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.invoice?.invoiceNumber && d.invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const totalPendingUSD = debts
    .filter((d) => d.status !== 'PAID')
    .reduce((acc, d) => acc + d.remainingUSD, 0);

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Cuentas por Cobrar & Deudores (Fiados)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de saldos pendientes de clientes y registro de abonos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          {/* Balance Card */}
          <div className="bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-rose-600" />
            <div>
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Total por Cobrar:</span>
              <span className="text-base font-black text-rose-700">
                ${totalPendingUSD.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-rose-600 ml-1.5">
                (~ {(totalPendingUSD * currentRate).toFixed(2)} Bs)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente o Cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['ALL', 'PENDING', 'PARTIAL', 'PAID'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL'
                ? 'Todos'
                : status === 'PENDING'
                ? 'Sin Pagar'
                : status === 'PARTIAL'
                ? 'Con Abonos'
                : 'Saldadas'}
            </button>
          ))}
        </div>
      </div>

      {/* Debts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Cliente Deudor</th>
                <th className="py-3 px-4">Factura / Concepto</th>
                <th className="py-3 px-4">Deuda Original</th>
                <th className="py-3 px-4">Saldo Restante ($)</th>
                <th className="py-3 px-4">Saldo al Día (Bs)</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Cargando deudas...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No hay cuentas por cobrar registradas con este filtro.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const pendingVES = (d.remainingUSD * currentRate).toFixed(2);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{d.client?.name}</p>
                        <p className="text-[10px] text-slate-500">{d.client?.idNumber} • {d.client?.phone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {d.invoice?.invoiceNumber || 'Venta a Crédito'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(d.createdAt).toLocaleDateString('es-VE')}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        ${d.totalUSD.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-black text-rose-600">
                        ${d.remainingUSD.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {pendingVES} Bs
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : d.status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {d.status === 'PAID'
                            ? 'Saldada'
                            : d.status === 'PARTIAL'
                            ? 'Abonando'
                            : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {d.status !== 'PAID' && (
                            <button
                              onClick={() => openPaymentModal(d)}
                              className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-extrabold shadow-sm transition-all"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Abonar</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPDF(d)}
                            className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1 rounded-lg text-xs font-bold transition-all shadow-sm"
                            title={d.status === 'PAID' ? 'Descargar Finiquito PDF' : 'Descargar Estado de Cuenta PDF'}
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => handleDownloadImage(d)}
                            className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1 rounded-lg text-xs font-bold transition-all shadow-sm"
                            title={d.status === 'PAID' ? 'Descargar Finiquito Imagen (PNG)' : 'Descargar Estado de Cuenta Imagen (PNG)'}
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>IMG</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDebt(d);
                              setIsHistoryModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            title="Ver Historial de Abonos"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>Historial</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment / Abono Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Registrar Abono / Pago de Deuda"
        maxWidth="max-w-md"
      >
        {selectedDebt && (
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Cliente:</span>
                <span className="font-bold text-slate-900">{selectedDebt.client?.name}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Saldo Pendiente:</span>
                <span className="font-extrabold text-rose-600">${selectedDebt.remainingUSD.toFixed(2)} (~ {(selectedDebt.remainingUSD * currentRate).toFixed(2)} Bs)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Monto a Abonar en Dólares ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedDebt.remainingUSD}
                required
                value={amountUSD}
                onChange={(e) => setAmountUSD(parseFloat(e.target.value) || 0)}
                className="w-full p-2 text-sm font-black bg-slate-50 border border-slate-200 rounded-xl"
              />
              <p className="text-[11px] text-amber-700 font-bold mt-1">
                Equivalente en Bolívares: {(amountUSD * currentRate).toFixed(2)} Bs (Tasa: {currentRate.toFixed(2)} Bs/$)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Método de Pago *
              </label>
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="CASH_USD">💵 Efectivo Dólares ($)</option>
                <option value="CASH_VES">🇻🇪 Efectivo Bolívares (Bs)</option>
                <option value="PAGO_MOVIL">📲 Pago Móvil</option>
                <option value="CARD">💳 Tarjeta / Punto</option>
                <option value="ZELLE">🏦 Zelle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Referencia / Comprobante
              </label>
              <input
                type="text"
                placeholder="Ej. Ref #482910 o billete de $10"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nota</label>
              <input
                type="text"
                placeholder="Observación opcional..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-md"
              >
                Registrar Abono
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Payment History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Historial de Abonos - ${selectedDebt?.client?.name}`}
        maxWidth="max-w-lg"
      >
        {selectedDebt && (
          <div className="space-y-3">
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <span>Deuda Total: <strong>${selectedDebt.totalUSD.toFixed(2)}</strong></span>
              <span>Restante: <strong className="text-rose-600">${selectedDebt.remainingUSD.toFixed(2)}</strong></span>
            </div>

            {selectedDebt.payments?.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs">No hay abonos registrados para esta deuda.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedDebt.payments?.map((p) => (
                  <div key={p.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">${p.amountUSD.toFixed(2)} (~ {p.amountVES.toFixed(2)} Bs)</p>
                      <p className="text-[10px] text-slate-500">
                        {p.paymentMethod} {p.reference ? `• Ref: ${p.reference}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString('es-VE')}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleDownloadImage(selectedDebt)}
                className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Descargar Imagen (PNG)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF(selectedDebt)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
