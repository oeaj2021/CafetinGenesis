import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  MessageCircle,
  Coffee,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  X,
  MapPin,
  ChevronRight,
  UtensilsCrossed,
  Flame,
  Soup,
  ChefHat,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../api/client';
import { Product, Category, ExchangeRate, DailyMenuData, DailyMenuItem } from '../../types';
import { Navbar } from '../../components/common/Navbar';
import { useCartStore } from '../../store/useCartStore';
import { useThemeStore } from '../../store/useThemeStore';

export const StoreHome: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeRate, setActiveRate] = useState<ExchangeRate | null>(null);
  const [businessSettings, setBusinessSettings] = useState<Record<string, string>>({});
  const [dailyMenu, setDailyMenu] = useState<DailyMenuData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderType, setOrderType] = useState<'AQUI' | 'LLEVAR' | 'DELIVERY'>('AQUI');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // Daily Menu Interactive Modal State
  const [isDailyMenuModalOpen, setIsDailyMenuModalOpen] = useState(false);
  const [selectedDailyDish, setSelectedDailyDish] = useState<DailyMenuItem | null>(null);
  const [selectedDailySides, setSelectedDailySides] = useState<string[]>([]);
  const [selectedDailyDrink, setSelectedDailyDrink] = useState<string>('');
  const [dailyOrderName, setDailyOrderName] = useState('');
  const [dailyOrderPhone, setDailyOrderPhone] = useState('');
  const [dailyOrderNotes, setDailyOrderNotes] = useState('');
  const [dailyOrderType, setDailyOrderType] = useState<'AQUÍ' | 'LLEVAR' | 'DELIVERY'>('AQUÍ');
  const [sendingDailyOrder, setSendingDailyOrder] = useState(false);
  const [dailyOrderSuccess, setDailyOrderSuccess] = useState(false);

  const cart = useCartStore();
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes, rateRes, settingsRes, menuRes] = await Promise.all([
        api.get('/products?activeOnly=true'),
        api.get('/categories'),
        api.get('/rates/active'),
        api.get('/settings'),
        api.get('/daily-menu').catch(() => ({ data: { menu: null } }))
      ]);

      setProducts(prodsRes.data.products || []);
      setCategories(catsRes.data.categories || []);
      setActiveRate(rateRes.data.rate || null);
      const settings = settingsRes.data.settings || {};
      setBusinessSettings(settings);

      if (menuRes.data?.menu && menuRes.data.menu.isActive) {
        setDailyMenu(menuRes.data.menu);
        if (menuRes.data.menu.mainDishes?.length > 0) {
          const available = menuRes.data.menu.mainDishes.find((d: DailyMenuItem) => d.available);
          setSelectedDailyDish(available || menuRes.data.menu.mainDishes[0]);
          setSelectedDailySides(menuRes.data.menu.sideDishes?.slice(0, 2) || []);
          setSelectedDailyDrink(menuRes.data.menu.drinks?.[0] || '');
        }
      }

      if (settings.THEME_COLOR) {
        setTheme(settings.THEME_COLOR);
      }
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
    const phone = businessSettings.BUSINESS_PHONE || '584149998877';
    const priceVES = (product.priceUSD * currentRate).toFixed(2);
    const message = `👋 ¡Hola! Vengo del catálogo virtual de *${businessSettings.BUSINESS_NAME || 'Cafetín Génesis'}*.\n\nMe gustaría pedir:\n☕ *${product.name}*\n💰 Precio: *$${product.priceUSD.toFixed(2)}* (~ *${priceVES} Bs*)\n\n¿Tienen disponibilidad? ¡Muchas gracias!`;
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Generar URL de WhatsApp para el Carrito Completo con notas y tipo de pedido
  const sendCartWhatsApp = () => {
    if (cart.items.length === 0) return;
    const phone = businessSettings.BUSINESS_PHONE || '584149998877';
    const totalUSD = cart.getTotalUSD();
    const totalVES = cart.getTotalVES(currentRate);

    const typeLabel = orderType === 'AQUI' ? '🍽️ Comer en el local' : orderType === 'LLEVAR' ? '🛍️ Para Llevar' : '🛵 Delivery a domicilio';

    let itemsText = cart.items
      .map(
        (i, idx) =>
          `  ${idx + 1}. *${i.product.name}* x${i.quantity} ➔ $${(i.product.priceUSD * i.quantity).toFixed(2)} (~ ${((i.product.priceUSD * i.quantity) * currentRate).toFixed(2)} Bs)`
      )
      .join('\n');

    const customerLine = customerName.trim() ? `👤 *Cliente:* ${customerName.trim()}\n` : '';
    const notesLine = orderNotes.trim() ? `📝 *Indicaciones/Mesa/Dirección:* ${orderNotes.trim()}\n` : '';

    const message = `👋 ¡Hola! Deseo realizar el siguiente pedido desde el portal virtual de *${businessSettings.BUSINESS_NAME || 'Cafetín Génesis'}*:\n\n${customerLine}📍 *Modalidad:* ${typeLabel}\n${notesLine}\n📋 *DETALLE DEL PEDIDO:*\n${itemsText}\n\n━━━━━━━━━━━━━━━━━━━━\n💵 *TOTAL DÓLARES:* $${totalUSD.toFixed(2)}\n🇻🇪 *TOTAL BOLÍVARES:* ${totalVES.toFixed(2)} Bs\n📊 *Tasa BCV del día:* ${currentRate.toFixed(2)} Bs/$\n━━━━━━━━━━━━━━━━━━━━\n\n¿Me confirman disponibilidad y datos para el pago? ¡Gracias!`;

    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Generar URL de WhatsApp para Menú Diario Personalizado
  const sendDailyMenuWhatsApp = () => {
    if (!dailyMenu || !selectedDailyDish) return;
    const phone = businessSettings.BUSINESS_PHONE || dailyMenu.contactPhone || '584149998877';
    const dishPriceVES = (selectedDailyDish.priceUSD * currentRate).toFixed(2);
    const typeLabel = dailyOrderType === 'AQUÍ' ? '🍽️ Comer en el local' : dailyOrderType === 'LLEVAR' ? '🛍️ Para Llevar' : '🛵 Delivery a domicilio';

    const customerLine = dailyOrderName.trim() ? `👤 *Cliente:* ${dailyOrderName.trim()}\n` : '';
    const phoneLine = dailyOrderPhone.trim() ? `📞 *Teléfono:* ${dailyOrderPhone.trim()}\n` : '';
    const sidesLine = selectedDailySides.length > 0 ? `🥗 *Contornos:* ${selectedDailySides.join(', ')}\n` : '';
    const drinkLine = selectedDailyDrink ? `🥤 *Bebida:* ${selectedDailyDrink}\n` : '';
    const soupLine = dailyMenu.soupOrStarter && dailyMenu.includesSoup ? `🍲 *Sopa/Entrada:* ${dailyMenu.soupOrStarter}\n` : '';
    const notesLine = dailyOrderNotes.trim() ? `📝 *Instrucciones:* ${dailyOrderNotes.trim()}\n` : '';

    const message = `👋 ¡Hola! Deseo pedir el *${dailyMenu.title.toUpperCase()}* de hoy (*${dailyMenu.date}*):\n\n${customerLine}${phoneLine}📍 *Modalidad:* ${typeLabel}\n\n🔥 *PLATO ELEGIDO:* *${selectedDailyDish.name}*\n${soupLine}${sidesLine}${drinkLine}${notesLine}\n━━━━━━━━━━━━━━━━━━━━\n💵 *TOTAL DÓLARES:* $${selectedDailyDish.priceUSD.toFixed(2)}\n🇻🇪 *TOTAL BOLÍVARES:* ${dishPriceVES} Bs\n📊 *Tasa Oficial BCV:* ${currentRate.toFixed(2)} Bs/$\n━━━━━━━━━━━━━━━━━━━━\n\n¿Me confirman disponibilidad y tiempo estimado de entrega? ¡Gracias!`;

    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setIsDailyMenuModalOpen(false);
  };

  // Enviar pedido directo de Menú Diario a Producción / Cocina (KDS)
  const sendDailyMenuDirectToKitchen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDailyDish) return;
    try {
      setSendingDailyOrder(true);
      await api.post('/daily-menu/order', {
        clientName: dailyOrderName.trim() || 'Cliente Portal Web',
        clientPhone: dailyOrderPhone.trim() || 'N/A',
        mainDishName: selectedDailyDish.name,
        mainDishPriceUSD: selectedDailyDish.priceUSD,
        quantity: 1,
        sides: selectedDailySides,
        drink: selectedDailyDrink,
        orderType: dailyOrderType,
        notes: dailyOrderNotes,
        paymentMethod: 'CASH_USD'
      });
      setDailyOrderSuccess(true);
      setTimeout(() => {
        setDailyOrderSuccess(false);
        setIsDailyMenuModalOpen(false);
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al enviar pedido a cocina');
    } finally {
      setSendingDailyOrder(false);
    }
  };

  const totalCartCount = cart.items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/80 font-sans selection:bg-amber-500 selection:text-white">
      <Navbar
        activeRate={activeRate}
        onOpenCart={() => setIsCartOpen(true)}
        businessName={businessSettings.BUSINESS_NAME}
      />

      {/* Hero Banner Dinámico con Glassmorphism */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-bold backdrop-blur-md shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Menú Interactivo & Pedidos Directos</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-sm">
            {businessSettings.BUSINESS_NAME || 'Cafetín Génesis'}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Cafés de especialidad, desayunos calientes, almuerzos y snacks recién preparados. Haz tu selección y envíala a WhatsApp en un clic.
          </p>

          {/* Quick Rate info & Location Pill */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {activeRate && (
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-300 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Tasa Oficial ({activeRate.name}):</span>
                <strong className="text-white font-mono">{activeRate.rate.toFixed(2)} Bs/$</strong>
              </div>
            )}
            {businessSettings.BUSINESS_ADDRESS && (
              <div className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full text-xs font-semibold text-slate-300 backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate max-w-xs">{businessSettings.BUSINESS_ADDRESS}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Daily Menu Banner Feature if Active */}
        {dailyMenu && dailyMenu.isActive && (
          <div className="mb-10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Platos del Día • {dailyMenu.date}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {dailyMenu.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {dailyMenu.subtitle || 'Comida casera, fresca y caliente preparada al momento.'}
                </p>
                {dailyMenu.soupOrStarter && dailyMenu.includesSoup && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 font-medium">
                    <Soup className="w-3.5 h-3.5" />
                    <span>Incluye: <strong>{dailyMenu.soupOrStarter}</strong></span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setIsDailyMenuModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Elegir Menú del Día</span>
                </button>
              </div>
            </div>

            {/* Quick Preview of available main dishes */}
            <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {dailyMenu.mainDishes
                .filter((d) => d.available)
                .map((dish) => {
                  const ves = (dish.priceUSD * currentRate).toFixed(2);
                  return (
                    <div
                      key={dish.id}
                      onClick={() => {
                        setSelectedDailyDish(dish);
                        setIsDailyMenuModalOpen(true);
                      }}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors cursor-pointer flex flex-col justify-between"
                    >
                      <div className="font-extrabold text-xs text-white truncate">{dish.name}</div>
                      <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-white/5">
                        <span className="text-amber-400 font-mono font-extrabold text-sm">${dish.priceUSD.toFixed(2)}</span>
                        <span className="text-slate-400 font-mono text-[11px] font-bold">~ {ves} Bs</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Search and Category Filter Bar */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Box with Clear Button */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar café, empanada, jugo, postre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all shadow-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Result Counter */}
            <div className="text-xs text-slate-500 font-semibold self-start md:self-center">
              Mostrando <span className="text-slate-900 font-extrabold">{filteredProducts.length}</span> productos
            </div>
          </div>

          {/* Categories Pill Scroller */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-[1.02]'
                  : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200'
              }`}
            >
              <span>Todos</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {products.length}
              </span>
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-[1.02]'
                      : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm animate-pulse space-y-4">
                <div className="h-48 bg-slate-200 rounded-2xl"></div>
                <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded-md w-1/2"></div>
                <div className="h-10 bg-slate-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 p-8 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
              <Coffee className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">No encontramos productos</h3>
            <p className="text-xs text-slate-500 mt-1">Prueba con otro término de búsqueda o selecciona otra categoría.</p>
            <button
              onClick={() => { setSelectedCategory('ALL'); setSearchTerm(''); }}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const priceVES = (product.priceUSD * currentRate).toFixed(2);
              const isOutOfStock = product.stock <= 0;
              const cartItem = cart.items.find((i) => i.product.id === product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Image Container */}
                  <div
                    onClick={() => setPreviewProduct(product)}
                    className="relative h-52 bg-slate-100 overflow-hidden cursor-pointer"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                        <Coffee className="w-12 h-12 stroke-1" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cafetín Génesis</span>
                      </div>
                    )}

                    {/* Category Pill */}
                    {product.category && (
                      <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                        {product.category.name}
                      </span>
                    )}

                    {/* Stock Status Badge */}
                    {isOutOfStock ? (
                      <span className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                        Agotado
                      </span>
                    ) : product.stock <= 5 ? (
                      <span className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                        ¡Últimos {product.stock}!
                      </span>
                    ) : null}
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3
                        onClick={() => setPreviewProduct(product)}
                        className="font-extrabold text-slate-900 text-base group-hover:text-amber-600 transition-colors cursor-pointer line-clamp-1"
                      >
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-baseline justify-between mb-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Precio</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-extrabold text-slate-900 font-mono">
                              ${product.priceUSD.toFixed(2)}
                            </span>
                            <span className="text-xs font-extrabold text-amber-600 font-mono">
                              / {priceVES} Bs
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Controllers */}
                      {cartItem ? (
                        <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl">
                          <button
                            onClick={() => cart.updateQuantity(product.id, cartItem.quantity - 1)}
                            className="w-8 h-8 rounded-xl bg-white text-slate-800 flex items-center justify-center font-bold hover:bg-slate-200 transition-colors shadow-xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-extrabold text-xs text-slate-900">
                            {cartItem.quantity} en pedido
                          </span>
                          <button
                            disabled={isOutOfStock || cartItem.quantity >= product.stock}
                            onClick={() => cart.updateQuantity(product.id, cartItem.quantity + 1)}
                            className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            disabled={isOutOfStock}
                            onClick={() => cart.addItem(product)}
                            className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar</span>
                          </button>

                          <button
                            disabled={isOutOfStock}
                            onClick={() => sendSingleProductWhatsApp(product)}
                            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Bar on Mobile when Cart has items */}
      {totalCartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 inset-x-4 z-40 lg:hidden animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-slate-800 active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-sm">
                {totalCartCount}
              </div>
              <div className="text-left">
                <div className="font-extrabold text-sm">Ver Mi Pedido</div>
                <div className="text-xs text-slate-300 font-mono">
                  ${cart.getTotalUSD().toFixed(2)} • {cart.getTotalVES(currentRate).toFixed(2)} Bs
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-extrabold bg-white/10 px-3 py-1.5 rounded-full">
              <span>Continuar</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Product Lightbox / Detail Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="relative h-64 bg-slate-100">
              {previewProduct.image ? (
                <img
                  src={previewProduct.image}
                  alt={previewProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Coffee className="w-16 h-16" />
                </div>
              )}
              <button
                onClick={() => setPreviewProduct(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {previewProduct.category && (
                <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                  {previewProduct.category.name}
                </span>
              )}
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{previewProduct.name}</h2>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900 font-mono">${previewProduct.priceUSD.toFixed(2)}</span>
                  <span className="text-sm font-bold text-amber-600 font-mono">/ {(previewProduct.priceUSD * currentRate).toFixed(2)} Bs</span>
                </div>
              </div>

              {previewProduct.description && (
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {previewProduct.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  disabled={previewProduct.stock <= 0}
                  onClick={() => {
                    cart.addItem(previewProduct);
                    setPreviewProduct(null);
                  }}
                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl font-extrabold text-xs transition-all shadow-md active:scale-95 disabled:opacity-40"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Añadir al Carrito</span>
                </button>

                <button
                  disabled={previewProduct.stock <= 0}
                  onClick={() => {
                    sendSingleProductWhatsApp(previewProduct);
                    setPreviewProduct(null);
                  }}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-extrabold text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-40"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Pedir WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Mi Pedido Virtual</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Revisa y envía a WhatsApp</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Item list & Customer Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.items.length === 0 ? (
                <div className="text-center py-20 text-slate-400 space-y-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Tu pedido está vacío</p>
                  <p className="text-xs text-slate-400">Agrega cafés, comidas o postres desde el menú</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 divide-y divide-slate-100">
                    {cart.items.map((item) => {
                      const itemPriceVES = (item.product.priceUSD * currentRate * item.quantity).toFixed(2);
                      return (
                        <div key={item.product.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-xs truncate">{item.product.name}</h4>
                            <p className="text-[11px] text-slate-400 font-mono">
                              ${item.product.priceUSD.toFixed(2)} c/u
                            </p>
                            <p className="text-xs font-black text-amber-700 font-mono">
                              ${(item.product.priceUSD * item.quantity).toFixed(2)} (~ {itemPriceVES} Bs)
                            </p>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                            <button
                              onClick={() => cart.updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 shadow-xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black px-1.5 font-mono">{item.quantity}</span>
                            <button
                              onClick={() => cart.updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 shadow-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => cart.removeItem(item.product.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Options */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      Modalidad del Pedido
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderType('AQUI')}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                          orderType === 'AQUI'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        🍽️ En Local
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('LLEVAR')}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                          orderType === 'LLEVAR'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        🛍️ Para Llevar
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('DELIVERY')}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                          orderType === 'DELIVERY'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        🛵 Delivery
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                        Tu Nombre (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Juan Pérez"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                        Notas / Mesa / Dirección de entrega
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ej: Mesa 4 / Sin azúcar / Dirección..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 resize-none"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Summary & Action */}
            {cart.items.length > 0 && (
              <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Tasa BCV Referencial:</span>
                    <span className="font-mono font-bold text-slate-700">{currentRate.toFixed(2)} Bs/$</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-800">
                    <span>Total USD:</span>
                    <span className="font-mono text-base font-extrabold text-slate-900">${cart.getTotalUSD().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-amber-900 bg-amber-100/70 p-3 rounded-2xl border border-amber-200/50">
                    <span>Total en Bolívares:</span>
                    <span className="font-mono text-lg">{cart.getTotalVES(currentRate).toFixed(2)} Bs</span>
                  </div>
                </div>

                <button
                  onClick={sendCartWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-extrabold text-sm transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Enviar Pedido a WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Menu Customizer Modal */}
      {isDailyMenuModalOpen && dailyMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base leading-tight">
                    {dailyMenu.title}
                  </h3>
                  <p className="text-[11px] text-amber-400 font-bold">
                    📅 {dailyMenu.date} • Tasa: {currentRate.toFixed(2)} Bs/$
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDailyMenuModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {dailyOrderSuccess ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">¡Pedido Enviado a Cocina!</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Tu orden del Menú del Día ya está en cola de preparación en la pantalla de cocina (KDS).
                  </p>
                </div>
              ) : (
                <>
                  {/* Sopa / Entrada Banner */}
                  {dailyMenu.soupOrStarter && dailyMenu.includesSoup && (
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 flex items-center gap-2.5 text-xs text-amber-900">
                      <Soup className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Sopa del día incluida: <strong>{dailyMenu.soupOrStarter}</strong>
                      </span>
                    </div>
                  )}

                  {/* 1. Selección de Plato Principal */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      1. Selecciona tu Plato Principal *
                    </label>
                    <div className="space-y-2">
                      {dailyMenu.mainDishes
                        .filter((d) => d.available)
                        .map((dish) => {
                          const isSelected = selectedDailyDish?.id === dish.id;
                          const vesPrice = (dish.priceUSD * currentRate).toFixed(2);
                          return (
                            <div
                              key={dish.id}
                              onClick={() => setSelectedDailyDish(dish)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 shadow-xs'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                      isSelected
                                        ? 'border-amber-600 bg-amber-600'
                                        : 'border-slate-400'
                                    }`}
                                  >
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <span className="font-extrabold text-xs text-slate-900 truncate">
                                    {dish.name}
                                  </span>
                                </div>
                                {dish.description && (
                                  <p className="text-[11px] text-slate-500 mt-0.5 ml-6">
                                    {dish.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-sm font-black text-slate-900 font-mono">
                                  ${dish.priceUSD.toFixed(2)}
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 block font-mono">
                                  {vesPrice} Bs
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* 2. Selección de Contornos */}
                  {dailyMenu.sideDishes.length > 0 && (
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        2. Elige tus Contornos / Guarniciones
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {dailyMenu.sideDishes.map((side) => {
                          const isChecked = selectedDailySides.includes(side);
                          return (
                            <button
                              key={side}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedDailySides(selectedDailySides.filter((s) => s !== side));
                                } else {
                                  setSelectedDailySides([...selectedDailySides, side]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isChecked
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {isChecked ? '✓ ' : '+ '}
                              {side}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Selección de Bebida */}
                  {dailyMenu.drinks.length > 0 && (
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                        3. Bebida
                      </label>
                      <select
                        value={selectedDailyDrink}
                        onChange={(e) => setSelectedDailyDrink(e.target.value)}
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                      >
                        {dailyMenu.drinks.map((drink) => (
                          <option key={drink} value={drink}>
                            🥤 {drink}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 4. Modalidad y Datos */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      Modalidad
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['AQUÍ', 'LLEVAR', 'DELIVERY'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setDailyOrderType(type)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            dailyOrderType === type
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {type === 'AQUÍ' ? '🍽️ En Local' : type === 'LLEVAR' ? '🛍️ Para Llevar' : '🛵 Delivery'}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Tu Nombre (Ej: Carlos)"
                        value={dailyOrderName}
                        onChange={(e) => setDailyOrderName(e.target.value)}
                        className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono / WhatsApp"
                        value={dailyOrderPhone}
                        onChange={(e) => setDailyOrderPhone(e.target.value)}
                        className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Instrucciones especiales (Mesa 2, sin picante, etc.)..."
                      value={dailyOrderNotes}
                      onChange={(e) => setDailyOrderNotes(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            {!dailyOrderSuccess && (
              <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-3">
                <div className="flex items-baseline justify-between text-slate-900">
                  <span className="text-xs font-bold text-slate-600">Total a Pagar:</span>
                  <div className="text-right">
                    <span className="text-xl font-black font-mono">
                      ${selectedDailyDish?.priceUSD.toFixed(2) || '0.00'}
                    </span>
                    <span className="text-xs font-extrabold text-amber-700 font-mono ml-2">
                      (~ {((selectedDailyDish?.priceUSD || 0) * currentRate).toFixed(2)} Bs)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={sendDailyMenuWhatsApp}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Pedir por WhatsApp</span>
                  </button>

                  <button
                    onClick={sendDailyMenuDirectToKitchen}
                    disabled={sendingDailyOrder}
                    className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    <span>{sendingDailyOrder ? 'Enviando...' : 'Mandar a Cocina'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-900 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-white font-extrabold text-sm">
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>{businessSettings.BUSINESS_NAME || 'Cafetín Génesis'}</span>
          </div>
          {businessSettings.BUSINESS_ADDRESS && (
            <p className="text-slate-400 max-w-md mx-auto">{businessSettings.BUSINESS_ADDRESS}</p>
          )}
          {businessSettings.BUSINESS_FOOTER_NOTE && (
            <p className="text-amber-400/90 font-medium italic">{businessSettings.BUSINESS_FOOTER_NOTE}</p>
          )}
          <p className="pt-4 text-slate-600 border-t border-slate-900/80">
            © 2026 Cafetín Génesis. Sistema Integral de Punto de Venta & Catálogo Digital.
          </p>
        </div>
      </footer>
    </div>
  );
};

