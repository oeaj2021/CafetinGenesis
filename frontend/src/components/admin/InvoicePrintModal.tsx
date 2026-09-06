import React, { useState, useEffect } from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { Invoice } from '../../types';
import { api } from '../../api/client';

interface BusinessInfo {
  name: string;
  rif: string;
  phone: string;
  address: string;
  footerNote: string;
  logo?: string;
  icon?: string;
}

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  businessInfo?: Partial<BusinessInfo>;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  onClose,
  businessInfo: customBusinessInfo
}) => {
  const [ticketWidth, setTicketWidth] = useState<'80mm' | '58mm'>('80mm');
  const [fetchedSettings, setFetchedSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data && typeof data === 'object') {
          setFetchedSettings(data);
        }
      } catch (e) {
        // Fallback gracefully
      }
    };
    loadSettings();
  }, []);

  const businessInfo: BusinessInfo = {
    name: customBusinessInfo?.name || fetchedSettings.BUSINESS_NAME || 'Cafetín Génesis',
    rif: customBusinessInfo?.rif || fetchedSettings.BUSINESS_RIF || 'J-12345678-9',
    phone: customBusinessInfo?.phone || fetchedSettings.BUSINESS_PHONE || '584120000000',
    address: customBusinessInfo?.address || fetchedSettings.BUSINESS_ADDRESS || 'Plaza Bolívar, Local 4, Venezuela',
    footerNote: customBusinessInfo?.footerNote || fetchedSettings.BUSINESS_FOOTER_NOTE || '¡Gracias por su compra!',
    logo: customBusinessInfo?.logo || fetchedSettings.BUSINESS_LOGO || '',
    icon: customBusinessInfo?.icon || fetchedSettings.BUSINESS_ICON || ''
  };

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const paymentLabels: Record<string, string> = {
    CASH_USD: 'Efectivo $ (Dólares)',
    CASH_VES: 'Efectivo Bs (Bolívares)',
    PAGO_MOVIL: 'Pago Móvil',
    CARD: 'Punto de Venta (Tarjeta)',
    ZELLE: 'Zelle',
    CREDIT: 'Crédito / Cuenta por Cobrar',
    MIXED: 'Pago Mixto / Dividido'
  };

  let parsedBreakdown: any[] = [];
  if (invoice.paymentBreakdown) {
    try {
      parsedBreakdown = JSON.parse(invoice.paymentBreakdown);
    } catch (e) {
      parsedBreakdown = [];
    }
  }

  const changeUSD = invoice.changeUSD || 0;
  const changeVES = changeUSD * invoice.exchangeRate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Actions (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Comprobante de Venta</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Ticket Width Toggle */}
            <div className="bg-slate-200 p-0.5 rounded-lg flex text-[10px] font-bold">
              <button
                onClick={() => setTicketWidth('80mm')}
                className={`px-2 py-1 rounded ${ticketWidth === '80mm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                80mm
              </button>
              <button
                onClick={() => setTicketWidth('58mm')}
                className={`px-2 py-1 rounded ${ticketWidth === '58mm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                58mm
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Receipt Content */}
        <div
          id="printable-invoice"
          className={`p-6 text-slate-900 font-mono text-xs leading-relaxed bg-white mx-auto ${
            ticketWidth === '58mm' ? 'max-w-[280px]' : 'max-w-[360px]'
          }`}
        >
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            {(businessInfo.logo || businessInfo.icon) && (
              <div className="flex justify-center mb-2">
                <img
                  src={businessInfo.logo || businessInfo.icon}
                  alt={businessInfo.name}
                  className="max-h-12 max-w-[150px] object-contain"
                />
              </div>
            )}
            <h2 className="text-sm font-black uppercase tracking-wider">{businessInfo.name}</h2>
            <p className="text-[10px] text-slate-600">RIF: {businessInfo.rif}</p>
            <p className="text-[10px] text-slate-600">{businessInfo.address}</p>
            <p className="text-[10px] text-slate-600">Tel: {businessInfo.phone}</p>
          </div>

          {/* Invoice Metadata */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between font-bold text-slate-800">
              <span>TICKET / FACTURA:</span>
              <span className="font-mono">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Fecha & Hora:</span>
              <span>{new Date(invoice.createdAt).toLocaleString('es-VE')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Cliente:</span>
              <span className="font-semibold">{invoice.clientName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Cédula/RIF:</span>
              <span>{invoice.clientIdNumber}</span>
            </div>
            {invoice.clientPhone && (
              <div className="flex justify-between text-slate-600">
                <span>Teléfono:</span>
                <span>{invoice.clientPhone}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Método Pago:</span>
              <span className="font-semibold">{paymentLabels[invoice.paymentMethod] || invoice.paymentMethod}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-slate-300">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-[9px] text-slate-500 font-bold uppercase">
                  <th className="pb-1">Cant</th>
                  <th className="pb-1">Descripción</th>
                  <th className="pb-1 text-right">P.Unit</th>
                  <th className="pb-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="text-slate-800">
                    <td className="py-1 font-bold align-top">{item.quantity}</td>
                    <td className="py-1 pr-1">
                      <p className="font-medium truncate max-w-[130px]">{item.productName}</p>
                      <p className="text-[9px] text-slate-400">{(item.unitPriceVES).toFixed(2)} Bs</p>
                    </td>
                    <td className="py-1 text-right align-top text-slate-600">${item.unitPriceUSD.toFixed(2)}</td>
                    <td className="py-1 text-right align-top font-bold">${item.totalUSD.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Exchange Rate */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Tasa Oficial BCV:</span>
              <span className="font-bold">{invoice.exchangeRate.toFixed(2)} Bs/$</span>
            </div>
            <div className="flex justify-between text-slate-800 text-xs font-bold pt-1 border-t border-slate-200">
              <span>TOTAL USD:</span>
              <span className="text-sm font-black">${invoice.totalUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-amber-900 font-extrabold bg-amber-50/80 px-2 py-1 rounded">
              <span>TOTAL BS:</span>
              <span>{invoice.totalVES.toFixed(2)} Bs</span>
            </div>
          </div>

          {/* Payment & Change breakdown */}
          {(parsedBreakdown.length > 0 || changeUSD > 0 || (invoice.amountPaidUSD && invoice.amountPaidUSD > 0)) && (
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px] text-slate-600">
              {parsedBreakdown.length > 0 && (
                <div className="space-y-0.5 mb-1">
                  <span className="font-bold text-slate-700">Desglose de Pago:</span>
                  {parsedBreakdown.map((p, i) => (
                    <div key={i} className="flex justify-between pl-1">
                      <span>• {paymentLabels[p.method] || p.method}:</span>
                      <span>${p.amountUSD.toFixed(2)} ({p.amountVES.toFixed(2)} Bs)</span>
                    </div>
                  ))}
                </div>
              )}

              {changeUSD > 0 && (
                <div className="flex justify-between font-bold text-emerald-700 bg-emerald-50 p-1.5 rounded">
                  <span>CAMBIO / VUELTO:</span>
                  <span>${changeUSD.toFixed(2)} (~ {changeVES.toFixed(2)} Bs)</span>
                </div>
              )}
            </div>
          )}

          {/* Footer Note */}
          <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
            <p className="font-semibold">{businessInfo.footerNote}</p>
            <p className="text-[9px] text-slate-400">Documento sin valor fiscal • Comprobante de Entrega</p>
          </div>
        </div>
      </div>
    </div>
  );
};
