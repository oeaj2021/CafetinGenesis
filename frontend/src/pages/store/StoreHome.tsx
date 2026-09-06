import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, MessageCircle, Coffee, Sparkles, Plus, Minus, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import { Product, Category, ExchangeRate } from '../../types';
import { Navbar } from '../../components/common/Navbar';
import { useCartStore } from '../../store/useCartStore';

export const StoreHome: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeRate, setActiveRate] = useState<ExchangeRate | null>(null);
  const [businessSettings, setBusinessSettings] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const cart = useCartStore();

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes, rateRes, settingsRes] = await Promise.all([
        api.get('/products?activeOnly=true'),
        api.get('/categories'),
        api.get('/rates/active'),
        api.get('/settings')
      ]);

      setProducts(prodsRes.data.products || []);
      setCategories(catsRes.data.categories || []);
      setActiveRate(rateRes.data.rate || null);
      setBusinessSettings(settingsRes.data.settings || {});
    } catch (error) {
      console.error('Error al cargar catálogo público:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentRate = activeRate?.rate || 1;

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Generar URL de WhatsApp para producto individual
  const sendSingleProductWhatsApp = (product: Product) => {
    const phone = businessSettings.BUSINESS_PHONE || '584120000000';
    const priceVES = (product.priceUSD * currentRate).toFixed(2);
    const message = `👋 ¡Hola! Vengo de la tienda virtual de *${businessSettings.BUSINESS_NAME || 'Cafetín Génesis'}*.\n\nMe gustaría pedir:\n☕ *${product.name}*\n💰 Precio: *$${product.priceUSD.toFixed(2)}* (~ *${priceVES} Bs*)\n\n¿Tienen disponibilidad para entrega/retiro? ¡Gracias!`;
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Generar URL de WhatsApp para el Carrito Completo
  const sendCartWhatsApp = () => {
    if (cart.items.length === 0) return;
    const phone = businessSettings.BUSINESS_PHONE || '584120000000';
    const totalUSD = cart.getTotalUSD();
    const totalVES = cart.getTotalVES(currentRate);

    let itemsText = cart.items
      .map(
        (i, idx) =>
          `${idx + 1}. *${i.product.name}* x${i.quantity} = $${(i.product.priceUSD * i.quantity).toFixed(2)} (~ ${((i.product.priceUSD * i.quantity) * currentRate).toFixed(2)} Bs)`
      )
      .join('\n');

    const message = `👋 ¡Hola! Deseo realizar el siguiente pedido desde su tienda virtual de *${businessSettings.BUSINESS_NAME || 'Cafetín Génesis'}*:\n\n📋 *DETALLE DEL PEDIDO:*\n${itemsText}\n\n💵 *TOTAL DÓLARES:* $${totalUSD.toFixed(2)}\n🇻🇪 *TOTAL BOLÍVARES:* ${totalVES.toFixed(2)} Bs (Tasa: ${currentRate.toFixed(2)} Bs/$)\n\nPor favor indiquen cómo proceder con el pago y retiro. ¡Muchas gracias!`;

    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        activeRate={activeRate}
        onOpenCart={() => setIsCartOpen(true)}
        businessName={businessSettings.BUSINESS_NAME}
      />

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4a253_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" /> Menú & Catálogo Virtual
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            {businessSettings.BUSINESS_NAME || 'Cafetín Génesis'}
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Disfruta de nuestros cafés gourmet, desayunos frescos y snacks. Haz tu pedido y recíbelo al instante por WhatsApp.
          </p>

          {/* Quick Rate info badge mobile */}
          {activeRate && (
            <div className="mt-4 sm:hidden inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-300">
              <span>Tasa del Día ({activeRate.name}):</span>
              <strong className="text-white">{activeRate.rate.toFixed(2)} Bs/$</strong>
            </div>
          )}
        </div>
      </section>

      {/* Main Content & Filters */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Search and Category Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar café, empanada, jugo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-sm"
            />
          </div>

          {/* Categories Pill List */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todos ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm animate-pulse space-y-3">
                <div className="h-44 bg-slate-200 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-8 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
            <Coffee className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No se encontraron productos</h3>
            <p className="text-xs text-slate-400 mt-1">Prueba con otra palabra clave o selecciona otra categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const priceVES = (product.priceUSD * currentRate).toFixed(2);
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Coffee className="w-12 h-12" />
                      </div>
                    )}
                    {product.category && (
                      <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {product.category.name}
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                        Agotado
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-xs text-slate-400 font-medium">Precio:</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-extrabold text-slate-900">
                              ${product.priceUSD.toFixed(2)}
                            </span>
                            <span className="text-xs font-bold text-amber-600">
                              / {priceVES} Bs
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-3.5">
                        <button
                          disabled={isOutOfStock}
                          onClick={() => cart.addItem(product)}
                          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                          title="Añadir al carrito"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Añadir</span>
                        </button>

                        <button
                          disabled={isOutOfStock}
                          onClick={() => sendSingleProductWhatsApp(product)}
                          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                          title="Pedir directo por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Mi Pedido</h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                  {cart.items.length}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Item list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
              {cart.items.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Tu pedido está vacío</p>
                  <p className="text-xs mt-1">Agrega productos del catálogo</p>
                </div>
              ) : (
                cart.items.map((item) => {
                  const itemPriceVES = (item.product.priceUSD * currentRate * item.quantity).toFixed(2);
                  return (
                    <div key={item.product.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs truncate">{item.product.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          ${item.product.priceUSD.toFixed(2)} c/u
                        </p>
                        <p className="text-xs font-extrabold text-amber-700">
                          ${(item.product.priceUSD * item.quantity).toFixed(2)} (~ {itemPriceVES} Bs)
                        </p>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                        <button
                          onClick={() => cart.updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-slate-600 hover:bg-white rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-1">{item.quantity}</span>
                        <button
                          onClick={() => cart.updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 text-slate-600 hover:bg-white rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => cart.removeItem(item.product.id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & WhatsApp Order Button */}
            {cart.items.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Tasa de cambio:</span>
                    <span className="font-bold">{currentRate.toFixed(2)} Bs/$</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-800">
                    <span>Total USD:</span>
                    <span>${cart.getTotalUSD().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-amber-900 bg-amber-100/60 p-2 rounded-xl">
                    <span>Total en Bolívares:</span>
                    <span>{cart.getTotalVES(currentRate).toFixed(2)} Bs</span>
                  </div>
                </div>

                <button
                  onClick={sendCartWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Enviar Pedido a WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-300">{businessSettings.BUSINESS_NAME || 'Cafetín Génesis'}</p>
          <p className="mt-1">{businessSettings.BUSINESS_ADDRESS}</p>
          <p className="mt-4 text-slate-500">© 2026 Cafetín Génesis. Sistema Modular de Gestión & Tienda.</p>
        </div>
      </footer>
    </div>
  );
};
