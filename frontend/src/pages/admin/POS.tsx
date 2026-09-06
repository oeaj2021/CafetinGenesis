import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  ScanBarcode,
  Volume2,
  VolumeX,
  UserPlus,
  Utensils,
  ShoppingBag,
  Truck
} from 'lucide-react';
import { api } from '../../api/client';
import { Product, Category, Client, ExchangeRate, Invoice, PaymentBreakdownItem } from '../../types';
import { InvoicePrintModal } from '../../components/admin/InvoicePrintModal';
import { PaymentModal } from '../../components/admin/PaymentModal';
import { Modal } from '../../components/common/Modal';

export const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeRate, setActiveRate] = useState<ExchangeRate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart / Bill State
  const [items, setItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [customClientName, setCustomClientName] = useState('Cliente General');
  const [customClientIdNumber, setCustomClientIdNumber] = useState('V-00000000');
  const [customClientPhone, setCustomClientPhone] = useState('');
  const [orderType, setOrderType] = useState<'AQUÍ' | 'LLEVAR' | 'DELIVERY'>('AQUÍ');
  const [notes, setNotes] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Quick Client Form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientIdNumber, setNewClientIdNumber] = useState('V-');
  const [newClientPhone, setNewClientPhone] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Web Audio Synthesizer for instant cashier audio feedback
  const playSound = (type: 'beep' | 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      // Ignore audio context errors
    }
  };

  useEffect(() => {
    loadPOSData();

    // Keyboard Shortcuts (F2: Search/Barcode, F4: Pay, Escape: Clear/Close)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (items.length > 0 && !isPaymentModalOpen) {
          setIsPaymentModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, isPaymentModalOpen]);

  const loadPOSData = async () => {
    try {
      const [prodRes, catRes, clientRes, rateRes] = await Promise.all([
        api.get('/products?activeOnly=true'),
        api.get('/categories'),
        api.get('/clients'),
        api.get('/rates/active')
      ]);
      setProducts(prodRes.data.products || []);
      setCategories(catRes.data.categories || []);
      setClients(clientRes.data.clients || []);
      setActiveRate(rateRes.data.rate || null);
    } catch (error) {
      console.error('Error cargando POS data:', error);
    }
  };

  const rate = activeRate?.rate || 1;

  const addItemToBill = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          playSound('error');
          alert(`Stock insuficiente. Solo quedan ${product.stock} unidades de ${product.name}`);
          return prev;
        }
        playSound('beep');
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      playSound('beep');
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const item = items.find((i) => i.product.id === productId);
    if (item && quantity > item.product.stock) {
      playSound('error');
      alert(`Stock insuficiente. Solo quedan ${item.product.stock} unidades.`);
      return;
    }

    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    playSound('beep');
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const res = await api.get(`/products/barcode/${barcodeInput.trim()}`);
      if (res.data.product) {
        addItemToBill(res.data.product);
        setBarcodeInput('');
      }
    } catch (err) {
      const match = products.find(
        (p) => p.barcode === barcodeInput.trim() || p.id === barcodeInput.trim()
      );
      if (match) {
        addItemToBill(match);
      } else {
        playSound('error');
        alert('Producto con código de barras no encontrado');
      }
      setBarcodeInput('');
    }
  };

  const handleCreateQuickClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/clients', {
        name: newClientName,
        idNumber: newClientIdNumber,
        phone: newClientPhone
      });
      const created: Client = res.data.client;
      setClients((prev) => [created, ...prev]);
      setSelectedClient(created);
      setIsNewClientModalOpen(false);
      setNewClientName('');
      setNewClientIdNumber('V-');
      setNewClientPhone('');
      playSound('beep');
    } catch (err: any) {
      playSound('error');
      alert(err.response?.data?.message || 'Error al registrar cliente');
    }
  };

  const subtotalUSD = items.reduce((acc, i) => acc + i.product.priceUSD * i.quantity, 0);
  const totalVES = subtotalUSD * rate;

  const handleOpenPayment = () => {
    if (items.length === 0) {
      playSound('error');
      alert('Debes agregar al menos un producto a la cuenta antes de cobrar.');
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = async (paymentData: {
    paymentMethod: 'CASH_USD' | 'CASH_VES' | 'PAGO_MOVIL' | 'CARD' | 'ZELLE' | 'CREDIT' | 'MIXED';
    amountPaidUSD: number;
    changeUSD: number;
    paymentBreakdown?: PaymentBreakdownItem[];
  }) => {
    try {
      setLoading(true);
      const fullNotes = `[${orderType}] ${notes}`.trim();

      const payload = {
        clientId: selectedClient ? selectedClient.id : null,
        clientName: selectedClient ? selectedClient.name : customClientName,
        clientIdNumber: selectedClient ? selectedClient.idNumber : customClientIdNumber,
        clientPhone: selectedClient ? selectedClient.phone : customClientPhone,
        paymentMethod: paymentData.paymentMethod,
        amountPaidUSD: paymentData.amountPaidUSD,
        changeUSD: paymentData.changeUSD,
        paymentBreakdown: paymentData.paymentBreakdown,
        notes: fullNotes,
        items: items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
          unitPriceUSD: i.product.priceUSD
        }))
      };

      const res = await api.post('/invoices', payload);
      playSound('success');
      setCreatedInvoice(res.data.invoice);
      setIsPaymentModalOpen(false);
      setIsPrintModalOpen(true);

      // Limpiar cuenta
      setItems([]);
      setNotes('');
      setSelectedClient(null);
      setCustomClientName('Cliente General');
      setCustomClientIdNumber('V-00000000');
      setCustomClientPhone('');
      loadPOSData();
    } catch (err: any) {
      playSound('error');
      alert(err.response?.data?.message || 'Error al procesar la factura');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    return matchCat && matchSearch;
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Left: Product Catalog Selection & Barcode Scanner */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-5 flex flex-col overflow-hidden shadow-sm">
        {/* Search, Barcode & Categories */}
        <div className="space-y-3 mb-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por nombre (F2)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Barcode Scanner Box */}
            <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-64">
              <ScanBarcode className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Lector Código de Barras (F2)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-amber-50/50 border border-amber-300/80 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-amber-700/60"
              />
            </form>

            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                soundEnabled
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
              title={soundEnabled ? 'Sonido Activado' : 'Sonido Silenciado'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Categories Horizontal Scroller */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos los Productos ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map((p) => {
              const inStock = p.stock > 0;
              const priceVES = (p.priceUSD * rate).toFixed(2);

              return (
                <button
                  key={p.id}
                  disabled={!inStock}
                  onClick={() => addItemToBill(p)}
                  className={`flex flex-col text-left p-3 rounded-2xl border transition-all relative ${
                    inStock
                      ? 'bg-white border-slate-200/80 hover:border-amber-400 hover:shadow-md active:scale-95'
                      : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block mb-1">
                      {p.category?.name || 'General'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight mb-1 line-clamp-2">
                      {p.name}
                    </h4>
                    {p.barcode && (
                      <span className="text-[9px] font-mono text-slate-400 block mb-1">
                        #{p.barcode}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <span className="text-sm font-black text-slate-900">
                        ${p.priceUSD.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 block">
                        {priceVES} Bs
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${
                        p.stock <= 5
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {p.stock} disp.
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Active Ticket & Checkout Sidepanel */}
      <div className="w-full lg:w-96 bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
        {/* Client Selector & Order Type */}
        <div className="space-y-3 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">
              Datos de la Comanda
            </span>
            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-lg transition-colors"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ Cliente Rápido</span>
            </button>
          </div>

          {/* Client Select */}
          <select
            value={selectedClient?.id || ''}
            onChange={(e) => {
              const found = clients.find((c) => c.id === e.target.value);
              setSelectedClient(found || null);
            }}
            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="">Consumidor Final (General)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.idNumber} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>

          {/* Order Type Selector */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: 'AQUÍ', label: 'Aquí', icon: Utensils },
                { id: 'LLEVAR', label: 'Llevar', icon: ShoppingBag },
                { id: 'DELIVERY', label: 'Delivery', icon: Truck }
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setOrderType(t.id)}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderType === t.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Nota o detalle (ej: Sin azúcar)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        {/* Cart Item Rows */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-10">
              <Receipt className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-xs font-semibold">Comanda vacía</p>
              <p className="text-[10px] text-slate-400">Escanea o selecciona productos del catálogo</p>
            </div>
          ) : (
            items.map((i) => (
              <div
                key={i.product.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-800 truncate">{i.product.name}</p>
                  <p className="text-[10px] text-slate-500">
                    ${i.product.priceUSD.toFixed(2)} x {i.quantity} = ${(i.product.priceUSD * i.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg shadow-sm">
                  <button
                    onClick={() => updateQuantity(i.product.id, i.quantity - 1)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-700"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-black px-1.5 text-slate-900">{i.quantity}</span>
                  <button
                    onClick={() => updateQuantity(i.product.id, i.quantity + 1)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-700"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => updateQuantity(i.product.id, 0)}
                  className="text-slate-400 hover:text-rose-500 p-1 ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals & Cobrar Button */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Subtotal USD:</span>
            <span className="text-base font-black text-slate-900">${subtotalUSD.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-extrabold text-amber-900 bg-amber-50 p-2.5 rounded-2xl border border-amber-200/60">
            <span>Total en Bolívares:</span>
            <span className="text-sm font-black">{totalVES.toFixed(2)} Bs</span>
          </div>

          <button
            disabled={loading || items.length === 0}
            onClick={handleOpenPayment}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 py-3.5 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2"
          >
            <Receipt className="w-4 h-4" />
            <span>Cobrar (F4) • ${subtotalUSD.toFixed(2)}</span>
          </button>
        </div>
      </div>

      {/* Advanced Payment Modal (Split Payments & Change Calculator) */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalUSD={subtotalUSD}
        rate={rate}
        onConfirm={handleProcessPayment}
        loading={loading}
      />

      {/* Invoice Print & View Modal */}
      {isPrintModalOpen && (
        <InvoicePrintModal
          invoice={createdInvoice}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* Quick Client Modal */}
      <Modal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        title="Registrar Cliente Rápido"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleCreateQuickClient} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              placeholder="Ej. María Gómez"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cédula / RIF *</label>
            <input
              type="text"
              required
              placeholder="V-12345678"
              value={newClientIdNumber}
              onChange={(e) => setNewClientIdNumber(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono Móvil (WhatsApp)</label>
            <input
              type="tel"
              placeholder="04141234567"
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewClientModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-md"
            >
              Guardar y Seleccionar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
