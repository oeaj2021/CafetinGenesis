import React, { useState, useEffect, useRef } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  Calendar,
  Plus,
  Trash2,
  Download,
  Share2,
  Copy,
  ChefHat,
  Send,
  Coffee,
  CheckCircle2,
  Soup,
  GlassWater,
  Cake,
  Flame,
  Clock,
  Phone,
  Camera,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { api } from '../../api/client';
import { DailyMenuData, DailyMenuItem, ExchangeRate } from '../../types';
import { Modal } from '../../components/common/Modal';

const DEFAULT_MENU: DailyMenuData = {
  title: 'Menú Ejecutivo del Día',
  date: new Date().toISOString().split('T')[0],
  subtitle: 'Comida casera, fresca y caliente preparada al momento',
  chefNote: 'Incluye sopa del día y bebida natural refrescante',
  isActive: true,
  basePriceUSD: 5.0,
  soupOrStarter: 'Sopa de Res con Verduras Criollas',
  mainDishes: [
    { id: '1', name: 'Pabellón Criollo Tradicional', description: 'Carne mechada, caraotas con queso, arroz y tajadas', priceUSD: 5.5, available: true },
    { id: '2', name: 'Pollo a la Plancha al Romero', description: 'Pechuga jugosa marinada con ensalada y puré', priceUSD: 5.0, available: true },
    { id: '3', name: 'Pescado Frito / Rueda de Pargo', description: 'Pescado crujiente con tostones y ensalada', priceUSD: 6.5, available: true },
    { id: '4', name: 'Chuleta Ahumada Glaseada', description: 'Chuleta glaseada con piña y papas doradas', priceUSD: 5.5, available: true }
  ],
  sideDishes: ['Arroz Blanco', 'Puré de Papas', 'Ensalada Rallada Criolla', 'Tajadas con Queso', 'Papas Fritas', 'Tostones con Ajo'],
  drinks: ['Papelón con Limón Frío', 'Jugo Natural de Maracuyá', 'Té Frío de Durazno', 'Agua Mineral'],
  desserts: ['Quesillo Casero', 'Torta Tres Leches'],
  includesSoup: true,
  includesDrink: true,
  contactPhone: '584149998877',
  deliveryAvailable: true
};

export const DailyMenu: React.FC = () => {
  const [menu, setMenu] = useState<DailyMenuData>(DEFAULT_MENU);
  const [activeRate, setActiveRate] = useState<ExchangeRate | null>(null);
  const [businessSettings, setBusinessSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Quick Side/Drink/Dessert text inputs
  const [newSideInput, setNewSideInput] = useState('');
  const [newDrinkInput, setNewDrinkInput] = useState('');
  const [newDessertInput, setNewDessertInput] = useState('');

  // Kitchen Production Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderClientName, setOrderClientName] = useState('Cliente General');
  const [orderClientPhone, setOrderClientPhone] = useState('');
  const [orderSelectedDish, setOrderSelectedDish] = useState<DailyMenuItem | null>(null);
  const [orderSelectedSides, setOrderSelectedSides] = useState<string[]>([]);
  const [orderSelectedDrink, setOrderSelectedDrink] = useState('');
  const [orderSelectedDessert, setOrderSelectedDessert] = useState('');
  const [orderType, setOrderType] = useState<'AQUÍ' | 'LLEVAR' | 'DELIVERY'>('AQUÍ');
  const [orderNotes, setOrderNotes] = useState('');
  const [sendingToKitchen, setSendingToKitchen] = useState(false);

  const flyerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [menuRes, rateRes, settingsRes] = await Promise.all([
        api.get('/daily-menu'),
        api.get('/rates/active'),
        api.get('/settings')
      ]);

      if (menuRes.data?.menu) {
        setMenu(menuRes.data.menu);
      }
      setActiveRate(rateRes.data?.rate || null);
      setBusinessSettings(settingsRes.data?.settings || {});
    } catch (error) {
      console.error('Error cargando menú diario:', error);
    }
  };

  const currentRate = activeRate?.rate || 1;

  const handleSaveMenu = async () => {
    try {
      setSaving(true);
      await api.post('/daily-menu', menu);
      alert('¡Menú diario guardado y actualizado con éxito!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar el menú');
    } finally {
      setSaving(false);
    }
  };

  // Dish Image Handlers
  const handleDishImageUpload = (id: string, file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen no debe superar los 3 MB para garantizar un rendimiento óptimo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateMainDish(id, 'image', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSoupImageUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen no debe superar los 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setMenu((prev) => ({ ...prev, soupImage: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // Main Dish Handlers
  const addMainDish = () => {
    const newDish: DailyMenuItem = {
      id: Date.now().toString(),
      name: 'Nuevo Plato Especial',
      description: 'Descripción e ingredientes del plato',
      priceUSD: 5.0,
      available: true,
      image: ''
    };
    setMenu((prev) => ({
      ...prev,
      mainDishes: [...prev.mainDishes, newDish]
    }));
  };

  const updateMainDish = (id: string, field: keyof DailyMenuItem, value: any) => {
    setMenu((prev) => ({
      ...prev,
      mainDishes: prev.mainDishes.map((dish) =>
        dish.id === id ? { ...dish, [field]: value } : dish
      )
    }));
  };

  const removeMainDish = (id: string) => {
    setMenu((prev) => ({
      ...prev,
      mainDishes: prev.mainDishes.filter((d) => d.id !== id)
    }));
  };

  // Side Dish Handlers
  const addSideDish = () => {
    if (!newSideInput.trim()) return;
    if (!menu.sideDishes.includes(newSideInput.trim())) {
      setMenu((prev) => ({
        ...prev,
        sideDishes: [...prev.sideDishes, newSideInput.trim()]
      }));
    }
    setNewSideInput('');
  };

  const removeSideDish = (name: string) => {
    setMenu((prev) => ({
      ...prev,
      sideDishes: prev.sideDishes.filter((s) => s !== name)
    }));
  };

  // Drink Handlers
  const addDrink = () => {
    if (!newDrinkInput.trim()) return;
    if (!menu.drinks.includes(newDrinkInput.trim())) {
      setMenu((prev) => ({
        ...prev,
        drinks: [...prev.drinks, newDrinkInput.trim()]
      }));
    }
    setNewDrinkInput('');
  };

  const removeDrink = (name: string) => {
    setMenu((prev) => ({
      ...prev,
      drinks: prev.drinks.filter((d) => d !== name)
    }));
  };

  // Dessert Handlers
  const addDessert = () => {
    if (!newDessertInput.trim()) return;
    const desserts = menu.desserts || [];
    if (!desserts.includes(newDessertInput.trim())) {
      setMenu((prev) => ({
        ...prev,
        desserts: [...desserts, newDessertInput.trim()]
      }));
    }
    setNewDessertInput('');
  };

  const removeDessert = (name: string) => {
    setMenu((prev) => ({
      ...prev,
      desserts: (prev.desserts || []).filter((d) => d !== name)
    }));
  };

  // Generación de Imagen HD para WhatsApp
  const handleDownloadFlyer = async () => {
    if (!flyerRef.current) return;
    try {
      setExportingImage(true);
      const dataUrl = await toPng(flyerRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#0f172a'
      });
      const link = document.createElement('a');
      link.download = `Menu-Genesis-${menu.date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generando imagen:', err);
      alert('No se pudo generar la imagen. Intenta nuevamente.');
    } finally {
      setExportingImage(false);
    }
  };

  const handleCopyFlyerToClipboard = async () => {
    if (!flyerRef.current) return;
    try {
      setExportingImage(true);
      const blob = await toBlob(flyerRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0f172a'
      });
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob })
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } else {
        alert('Copiado directo no soportado en este navegador. Utiliza el botón "Descargar Imagen PNG".');
      }
    } catch (err) {
      console.error('Error copiando imagen al portapapeles:', err);
      alert('No se pudo copiar la imagen al portapapeles.');
    } finally {
      setExportingImage(false);
    }
  };

  const handleShareWhatsAppText = () => {
    const phone = businessSettings.BUSINESS_PHONE || menu.contactPhone || '584149998877';
    const businessName = businessSettings.BUSINESS_NAME || 'Cafetín Génesis';

    let dishesText = menu.mainDishes
      .filter((d) => d.available)
      .map((d, idx) => {
        const ves = (d.priceUSD * currentRate).toFixed(2);
        return `*${idx + 1}. ${d.name}* ➔ *$${d.priceUSD.toFixed(2)}* (~${ves} Bs)\n   _${d.description || ''}_`;
      })
      .join('\n\n');

    const soupText = menu.soupOrStarter && menu.includesSoup ? `🍲 *Entrada/Sopa:* ${menu.soupOrStarter}\n` : '';
    const sidesText = menu.sideDishes.length > 0 ? `🥗 *Contornos a elegir:* ${menu.sideDishes.join(', ')}\n` : '';
    const drinksText = menu.drinks.length > 0 ? `🥤 *Bebidas:* ${menu.drinks.join(', ')}\n` : '';
    const dessertsText = menu.desserts && menu.desserts.length > 0 ? `🍰 *Postres del día:* ${menu.desserts.join(', ')}\n` : '';
    const noteText = menu.chefNote ? `\n👨‍🍳 _"${menu.chefNote}"_\n` : '';

    const message = `✨🍽️ *${menu.title.toUpperCase()}* 🍽️✨\n📍 *${businessName}* | 📅 *${menu.date}*\n\n${soupText}\n🔥 *PLATOS PRINCIPALES DISPONIBLES:*\n${dishesText}\n\n${sidesText}${drinksText}${dessertsText}${noteText}\n━━━━━━━━━━━━━━━━━━━━\n📊 *Tasa Oficial BCV:* ${currentRate.toFixed(2)} Bs/$\n🛵 *Servicio:* ${menu.deliveryAvailable ? 'Comer en el local, Para Llevar y Delivery 🛵' : 'Comer en el local y Para Llevar 🛍️'}\n━━━━━━━━━━━━━━━━━━━━\n\n¿Deseas apartar tu menú del día? ¡Escríbenos tu selección ahora! 🙌`;

    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Kitchen Production Dispatch Handlers
  const handleOpenKitchenOrder = (dish?: DailyMenuItem) => {
    const selected = dish || menu.mainDishes.find((d) => d.available) || menu.mainDishes[0];
    setOrderSelectedDish(selected || null);
    setOrderSelectedSides(menu.sideDishes.slice(0, 2));
    setOrderSelectedDrink(menu.drinks[0] || '');
    setOrderSelectedDessert('');
    setOrderNotes('');
    setIsOrderModalOpen(true);
  };

  const handleSendToKitchen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSelectedDish) {
      alert('Selecciona un plato principal');
      return;
    }

    try {
      setSendingToKitchen(true);
      await api.post('/daily-menu/order', {
        clientName: orderClientName,
        clientPhone: orderClientPhone,
        mainDishName: orderSelectedDish.name,
        mainDishPriceUSD: orderSelectedDish.priceUSD,
        quantity: 1,
        sides: orderSelectedSides,
        drink: orderSelectedDrink,
        dessert: orderSelectedDessert,
        orderType,
        notes: orderNotes,
        paymentMethod: 'CASH_USD'
      });

      alert('¡Comanda de Menú Diario enviada exitosamente a la Pantalla de Cocina / KDS!');
      setIsOrderModalOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al enviar comanda a cocina');
    } finally {
      setSendingToKitchen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <UtensilsCrossed className="w-7 h-7 text-amber-600" />
            Menús Diarios & Flyer para WhatsApp
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configura el Menú del Día, genera la imagen publicitaria para WhatsApp y manda órdenes a producción de cocina
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenKitchenOrder()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <ChefHat className="w-4 h-4" />
            <span>+ Comanda a Cocina (KDS)</span>
          </button>

          <button
            disabled={saving}
            onClick={handleSaveMenu}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Menú'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* General Information Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Datos Generales del Menú</span>
              </h3>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-bold text-slate-600">Publicado</span>
                <input
                  type="checkbox"
                  checked={menu.isActive}
                  onChange={(e) => setMenu({ ...menu, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Título Principal
                </label>
                <input
                  type="text"
                  value={menu.title}
                  onChange={(e) => setMenu({ ...menu, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  placeholder="Ej: Menú Ejecutivo del Día"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Fecha del Menú
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={menu.date}
                    onChange={(e) => setMenu({ ...menu, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setMenu({ ...menu, date: new Date().toISOString().split('T')[0] })}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl whitespace-nowrap"
                  >
                    Hoy
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Sopa o Entrada Incluida
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={menu.soupOrStarter || ''}
                  onChange={(e) => setMenu({ ...menu, soupOrStarter: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  placeholder="Ej: Sopa de Res Criolla con Verduras"
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 whitespace-nowrap cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menu.includesSoup}
                      onChange={(e) => setMenu({ ...menu, includesSoup: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600"
                    />
                    <span>Incluida</span>
                  </label>

                  {/* Soup Image Uploader */}
                  {menu.soupImage ? (
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-amber-300 group/soup shrink-0">
                      <img src={menu.soupImage} alt="Sopa" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setMenu({ ...menu, soupImage: undefined })}
                        className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover/soup:opacity-100 flex items-center justify-center transition-opacity"
                        title="Eliminar foto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors">
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <span>Foto Sopa</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleSoupImageUpload(f);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Nota / Especial del Chef
              </label>
              <input
                type="text"
                value={menu.chefNote || ''}
                onChange={(e) => setMenu({ ...menu, chefNote: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                placeholder="Ej: Incluye postre de la casa para pedidos antes de las 12:00 PM"
              />
            </div>
          </div>

          {/* Main Dishes List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>Platos Principales del Día ({menu.mainDishes.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Define las opciones con foto, precio y descripción</p>
              </div>
              <button
                type="button"
                onClick={addMainDish}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Plato</span>
              </button>
            </div>

            <div className="space-y-4">
              {menu.mainDishes.map((dish, idx) => {
                const vesPrice = (dish.priceUSD * currentRate).toFixed(2);
                return (
                  <div
                    key={dish.id || idx}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={dish.name}
                          onChange={(e) => updateMainDish(dish.id, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                          placeholder="Nombre del plato..."
                        />
                      </div>

                      {/* Price USD */}
                      <div className="flex items-center gap-1.5 w-32 shrink-0">
                        <span className="text-xs font-bold text-slate-500">$</span>
                        <input
                          type="number"
                          step="0.1"
                          value={dish.priceUSD}
                          onChange={(e) => updateMainDish(dish.id, 'priceUSD', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 text-right"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeMainDish(dish.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={dish.description || ''}
                        onChange={(e) => updateMainDish(dish.id, 'description', e.target.value)}
                        className="flex-1 px-3 py-1 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-600"
                        placeholder="Descripción de acompañamientos o cocción..."
                      />

                      <div className="text-[11px] font-mono font-bold text-amber-700 shrink-0">
                        ~ {vesPrice} Bs
                      </div>

                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={dish.available}
                          onChange={(e) => updateMainDish(dish.id, 'available', e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-amber-600"
                        />
                        <span>Disponible</span>
                      </label>
                    </div>

                    {/* Dish Photo Uploader Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2.5 border-t border-slate-200/60">
                      {dish.image ? (
                        <div className="flex items-center gap-3 w-full">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-xs group/img">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => updateMainDish(dish.id, 'image', '')}
                              className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"
                              title="Eliminar foto"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Foto lista para WhatsApp y Catálogo</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <label className="cursor-pointer text-[10px] font-extrabold text-amber-700 hover:text-amber-800 underline">
                                Cambiar Foto
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleDishImageUpload(dish.id, f);
                                  }}
                                />
                              </label>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={() => updateMainDish(dish.id, 'image', '')}
                                className="text-[10px] font-extrabold text-rose-600 hover:text-rose-700"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 hover:border-amber-400 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-xs group/btn">
                            <Camera className="w-3.5 h-3.5 text-amber-600 group-hover/btn:scale-110 transition-transform" />
                            <span>Cargar Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleDishImageUpload(dish.id, f);
                              }}
                            />
                          </label>
                          <input
                            type="text"
                            placeholder="O pegar URL de imagen..."
                            value={dish.image || ''}
                            onChange={(e) => updateMainDish(dish.id, 'image', e.target.value)}
                            className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Dishes & Drinks & Desserts */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            {/* Side Dishes */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                  <Soup className="w-4 h-4 text-amber-600" />
                  <span>Contornos / Guarniciones a elegir</span>
                </h4>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {menu.sideDishes.map((side) => (
                  <span
                    key={side}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold"
                  >
                    <span>{side}</span>
                    <button
                      type="button"
                      onClick={() => removeSideDish(side)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSideInput}
                  onChange={(e) => setNewSideInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSideDish())}
                  placeholder="Agregar contorno (ej: Yuca con Mojo, Plátano Asado)..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={addSideDish}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  + Agregar
                </button>
              </div>
            </div>

            {/* Drinks */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                  <GlassWater className="w-4 h-4 text-amber-600" />
                  <span>Bebidas / Jugos Naturales</span>
                </h4>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {menu.drinks.map((drink) => (
                  <span
                    key={drink}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200/50"
                  >
                    <span>{drink}</span>
                    <button
                      type="button"
                      onClick={() => removeDrink(drink)}
                      className="text-amber-500 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDrinkInput}
                  onChange={(e) => setNewDrinkInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDrink())}
                  placeholder="Agregar bebida (ej: Jugo de Guayaba, Limonada Frappé)..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={addDrink}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  + Agregar
                </button>
              </div>
            </div>

            {/* Desserts */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                  <Cake className="w-4 h-4 text-amber-600" />
                  <span>Postres del Día (Opcionales)</span>
                </h4>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {(menu.desserts || []).map((dessert) => (
                  <span
                    key={dessert}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-900 text-xs font-semibold border border-rose-200/50"
                  >
                    <span>{dessert}</span>
                    <button
                      type="button"
                      onClick={() => removeDessert(dessert)}
                      className="text-rose-400 hover:text-rose-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDessertInput}
                  onChange={(e) => setNewDessertInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDessert())}
                  placeholder="Agregar postre (ej: Dulce de Lechosa, Brownie)..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={addDessert}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  + Agregar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Visual Flyer & Export Tools (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Action Toolbar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Flyer Visual para WhatsApp</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                1080p HD Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={exportingImage}
                onClick={handleDownloadFlyer}
                className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>{exportingImage ? 'Generando...' : 'Descargar Imagen'}</span>
              </button>

              <button
                disabled={exportingImage}
                onClick={handleCopyFlyerToClipboard}
                className="flex items-center justify-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-xs active:scale-95"
              >
                <Copy className="w-4 h-4 text-slate-600" />
                <span>{copySuccess ? '¡Copiado!' : 'Copiar Imagen'}</span>
              </button>
            </div>

            <button
              onClick={handleShareWhatsAppText}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl text-xs font-black transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar Menú Directo a WhatsApp</span>
            </button>
          </div>

          {/* The Visual Canvas / Flyer Card (High Resolution Snapshot Target) */}
          <div className="bg-slate-950 p-2 rounded-3xl shadow-2xl border border-slate-800">
            <div
              ref={flyerRef}
              className="w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6 rounded-2xl font-sans relative overflow-hidden border border-slate-800"
              style={{ minHeight: '680px' }}
            >
              {/* Background ambient lights */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header Brand */}
              <div className="text-center relative z-10 space-y-1.5 pb-4 border-b border-slate-800/80">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[11px] font-black uppercase tracking-widest">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>{businessSettings.BUSINESS_NAME || 'Cafetín Génesis'}</span>
                </div>

                <h2 className="text-2xl font-black tracking-tight text-white uppercase drop-shadow-md">
                  {menu.title}
                </h2>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{menu.date}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    Tasa: {currentRate.toFixed(2)} Bs/$
                  </span>
                </div>

                {menu.soupOrStarter && menu.includesSoup && (
                  <div className="mt-2 py-1 px-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 font-bold inline-flex items-center gap-2">
                    {menu.soupImage && (
                      <img
                        src={menu.soupImage}
                        alt="Sopa"
                        crossOrigin="anonymous"
                        className="w-6 h-6 rounded-md object-cover border border-amber-500/40"
                      />
                    )}
                    <span>🍲 Sopa del Día: {menu.soupOrStarter}</span>
                  </div>
                )}
              </div>

              {/* Main Dishes List */}
              <div className="py-4 space-y-3 relative z-10">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Platos Principales Calientes</span>
                </div>

                {menu.mainDishes
                  .filter((d) => d.available)
                  .map((dish, idx) => {
                    const ves = (dish.priceUSD * currentRate).toFixed(2);
                    return (
                      <div
                        key={dish.id || idx}
                        className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800/90 flex items-center justify-between gap-3 shadow-sm hover:border-amber-500/40 transition-colors"
                      >
                        {/* Dish Photo if Available */}
                        {dish.image && (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80 shrink-0 shadow-sm">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-amber-400">
                              {idx + 1}.
                            </span>
                            <span className="text-xs font-extrabold text-white truncate">
                              {dish.name}
                            </span>
                          </div>
                          {dish.description && (
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-2">
                              {dish.description}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-black text-white font-mono">
                            ${dish.priceUSD.toFixed(2)}
                          </div>
                          <div className="text-[10px] font-extrabold text-amber-400 font-mono">
                            {ves} Bs
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Side Dishes & Extras */}
              <div className="pt-3 pb-4 border-t border-slate-800/80 space-y-2 relative z-10">
                {menu.sideDishes.length > 0 && (
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      🥗 Contornos a elegir:
                    </span>
                    <p className="text-[11px] font-bold text-slate-200 leading-snug">
                      {menu.sideDishes.join(' • ')}
                    </p>
                  </div>
                )}

                {menu.drinks.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      🥤 Bebidas disponibles:
                    </span>
                    <p className="text-[11px] font-bold text-amber-300 leading-snug">
                      {menu.drinks.join(' • ')}
                    </p>
                  </div>
                )}

                {menu.desserts && menu.desserts.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      🍰 Postres del día:
                    </span>
                    <p className="text-[11px] font-bold text-rose-300 leading-snug">
                      {menu.desserts.join(' • ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer WhatsApp Banner inside Flyer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300 relative z-10">
                <div className="flex items-center gap-1.5 font-bold">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pedidos WhatsApp:</span>
                  <span className="font-mono text-white font-extrabold">
                    {businessSettings.BUSINESS_PHONE || menu.contactPhone || '0414-9998877'}
                  </span>
                </div>
                <div className="text-[10px] font-extrabold text-amber-400">
                  ¡Haz tu pedido ya!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kitchen Production Comanda Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Enviar Comanda de Menú Diario a Cocina (KDS)"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSendToKitchen} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/60 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-amber-600" />
              <span>Esta orden se enviará en tiempo real a la Pantalla de Cocina / KDS</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
                Nombre del Cliente / Mesa
              </label>
              <input
                type="text"
                required
                value={orderClientName}
                onChange={(e) => setOrderClientName(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                placeholder="Ej: Mesa 3 / Carlos Gómez"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                value={orderClientPhone}
                onChange={(e) => setOrderClientPhone(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                placeholder="04141234567"
              />
            </div>
          </div>

          {/* Modalidad */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
              Modalidad de Consumo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['AQUÍ', 'LLEVAR', 'DELIVERY'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    orderType === type
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type === 'AQUÍ' ? '🍽️ En Local' : type === 'LLEVAR' ? '🛍️ Para Llevar' : '🛵 Delivery'}
                </button>
              ))}
            </div>
          </div>

          {/* Plato Principal */}
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold uppercase text-slate-700">
              Plato Principal Seleccionado *
            </label>
            <select
              value={orderSelectedDish?.id || ''}
              onChange={(e) => {
                const found = menu.mainDishes.find((d) => d.id === e.target.value);
                setOrderSelectedDish(found || null);
              }}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
            >
              {menu.mainDishes
                .filter((d) => d.available)
                .map((dish) => (
                  <option key={dish.id} value={dish.id}>
                    {dish.name} - ${dish.priceUSD.toFixed(2)} (~ {(dish.priceUSD * currentRate).toFixed(2)} Bs)
                  </option>
                ))}
            </select>

            {orderSelectedDish?.image && (
              <div className="flex items-center gap-2.5 p-2 bg-slate-100 rounded-2xl border border-slate-200">
                <img
                  src={orderSelectedDish.image}
                  alt={orderSelectedDish.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-300 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">{orderSelectedDish.name}</span>
                  <span className="text-[11px] font-extrabold text-amber-700">${orderSelectedDish.priceUSD.toFixed(2)} USD</span>
                </div>
              </div>
            )}
          </div>

          {/* Contornos */}
          {menu.sideDishes.length > 0 && (
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
                Contornos Deseados (Selecciona los que apliquen)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {menu.sideDishes.map((side) => {
                  const isChecked = orderSelectedSides.includes(side);
                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setOrderSelectedSides(orderSelectedSides.filter((s) => s !== side));
                        } else {
                          setOrderSelectedSides([...orderSelectedSides, side]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        isChecked
                          ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

          {/* Bebida */}
          {menu.drinks.length > 0 && (
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
                Bebida Elegida
              </label>
              <select
                value={orderSelectedDrink}
                onChange={(e) => setOrderSelectedDrink(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">Sin bebida / Por defecto</option>
                {menu.drinks.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notas Cocina */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
              Indicaciones Especiales para Cocina
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl resize-none"
              placeholder="Ej: Servir con salsa aparte, sin ensalada..."
            />
          </div>

          {/* Total & Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold block">Total a Pagar</span>
              <span className="text-base font-black text-slate-900 font-mono">
                ${orderSelectedDish?.priceUSD.toFixed(2) || '0.00'}{' '}
                <span className="text-xs font-bold text-amber-700">
                  (~ {((orderSelectedDish?.priceUSD || 0) * currentRate).toFixed(2)} Bs)
                </span>
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sendingToKitchen}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sendingToKitchen ? 'Enviando...' : 'Mandar a Cocina'}</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
