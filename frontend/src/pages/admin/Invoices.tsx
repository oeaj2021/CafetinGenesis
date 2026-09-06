import React, { useState, useEffect } from 'react';
import { Search, Printer, Download } from 'lucide-react';
import { api } from '../../api/client';
import { Invoice } from '../../types';
import { InvoicePrintModal } from '../../components/admin/InvoicePrintModal';
import { exportToCSV } from '../../utils/exportToExcel';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      setInvoices(res.data.invoices || []);
    } catch (error) {
      console.error('Error al cargar facturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = [
      'N° Factura',
      'Fecha',
      'Cliente',
      'Cédula/RIF',
      'Teléfono',
      'Método de Pago',
      'Tasa de Cambio',
      'Total USD',
      'Total VES',
      'Estado'
    ];
    const rows = invoices.map(i => [
      i.invoiceNumber,
      new Date(i.createdAt).toLocaleString('es-VE'),
      i.clientName,
      i.clientIdNumber,
      i.clientPhone || 'N/A',
      i.paymentMethod,
      i.exchangeRate.toFixed(2),
      i.totalUSD.toFixed(2),
      i.totalVES.toFixed(2),
      i.paymentStatus
    ]);
    exportToCSV('Reporte_Ventas_Facturas', headers, rows);
  };

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientIdNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Facturas & Comprobantes de Venta
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historial de facturas emitidas, reimpresión de tickets y auditoría
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por N° factura o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">N° Factura</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Total USD</th>
                <th className="py-3 px-4">Total Bs</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Cargando facturas...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron facturas registradas.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(inv.createdAt).toLocaleString('es-VE')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{inv.clientName}</p>
                      <p className="text-[10px] text-slate-400">{inv.clientIdNumber}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">
                      {inv.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      ${inv.totalUSD.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-700">
                      {inv.totalVES.toFixed(2)} Bs
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {inv.paymentStatus === 'PAID' ? 'Pagada' : 'Crédito / Pendiente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                        title="Ver e Imprimir Ticket"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Modal */}
      {selectedInvoice && (
        <InvoicePrintModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
