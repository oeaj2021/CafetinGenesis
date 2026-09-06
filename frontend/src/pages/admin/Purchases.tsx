import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Download } from 'lucide-react';
import { api } from '../../api/client';
import { Purchase, Product } from '../../types';
import { Modal } from '../../components/common/Modal';
import { exportToCSV } from '../../utils/exportToExcel';

export const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Purchase Form
  const [supplierName, setSupplierName] = useState('');
  const [supplierRif, setSupplierRif] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; unitCostUSD: number }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [purchasesRes, productsRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/products')
      ]);
      setPurchases(purchasesRes.data.purchases || []);
      setProducts(productsRes.data.products || []);
    } catch (error) {
      console.error('Error al cargar compras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = [
      'N° Compra',
      'Fecha',
      'Proveedor',
      'RIF/Doc',
      'Método Pago',
      'Total USD',
      'Total VES',
      'Tasa de Cambio',
      'Cant. Ítems',
      'Notas'
    ];
    const rows = purchases.map((p) => [
      p.purchaseNumber,
      new Date(p.createdAt).toLocaleDateString('es-VE'),
      p.supplierName,
      p.supplierRif || 'N/A',
      p.paymentMethod,
      p.totalUSD.toFixed(2),
      p.totalVES.toFixed(2),
      p.exchangeRate.toFixed(2),
      p.items?.length || 0,
      p.notes || ''
    ]);
    exportToCSV('Reporte_Compras_Mercancia', headers, rows);
  };

  const addItemRow = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: firstProd.id,
        productName: firstProd.name,
        quantity: 10,
        unitCostUSD: firstProd.costUSD || 0.5
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (field === 'productId') {
          const selected = products.find((p) => p.id === value);
          return {
            ...item,
            productId: value,
            productName: selected ? selected.name : item.productName,
            unitCostUSD: selected ? selected.costUSD : item.unitCostUSD
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Debes agregar al menos un ítem a la compra');
      return;
    }

    try {
      await api.post('/purchases', {
        supplierName,
        supplierRif,
        notes,
        paymentMethod: 'CASH_USD',
        items
      });
      setIsModalOpen(false);
      setSupplierName('');
      setSupplierRif('');
      setNotes('');
      setItems([]);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar la compra');
    }
  };

  const totalPurchaseUSD = items.reduce((acc, i) => acc + i.quantity * i.unitCostUSD, 0);

  const filtered = purchases.filter(
    (p) =>
      p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Compras de Mercancía & Proveedores
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de gastos de compra, reposición de inventario y costos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar proveedor o N°..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={() => {
              setItems([]);
              addItemRow();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Compra</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">N° Compra</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4">Ítems</th>
                <th className="py-3 px-4">Total USD</th>
                <th className="py-3 px-4">Total Bs</th>
                <th className="py-3 px-4">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Cargando compras...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se han registrado compras aún.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.purchaseNumber}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString('es-VE')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{p.supplierName}</p>
                      {p.supplierRif && <p className="text-[10px] text-slate-400">{p.supplierRif}</p>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.items?.length || 0} productos ingresados
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">${p.totalUSD.toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold text-indigo-700">{p.totalVES.toFixed(2)} Bs</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[180px]">
                      {p.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Compra de Mercancía"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                Nombre del Proveedor *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Distribuidora Central C.A."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                RIF del Proveedor
              </label>
              <input
                type="text"
                placeholder="J-12345678-0"
                value={supplierRif}
                onChange={(e) => setSupplierRif(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase">
                Productos a Ingresar al Stock:
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Producto
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                    className="flex-1 p-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock actual: {p.stock})
                      </option>
                    ))}
                  </select>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                      className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg text-center"
                    />
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Costo $"
                      value={item.unitCostUSD}
                      onChange={(e) => updateItem(idx, 'unitCostUSD', parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg text-right"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Notas / Observaciones</label>
            <input
              type="text"
              placeholder="Ej. Factura proveedor #9924"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Total de la Compra:</span>
              <div className="text-lg font-black text-slate-900">${totalPurchaseUSD.toFixed(2)}</div>
            </div>

            <div className="flex gap-2">
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
                Guardar Compra
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
