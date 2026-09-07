import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  ShoppingCart,
  Lock,
  Search,
  X,
  Menu,
  MessageCircle,
  Pill,
  Coffee,
  UtensilsCrossed,
  Shirt,
  Smartphone,
  Sparkles,
  Package,
  Store,
  Tag,
  Layers,
  Flame,
  ChefHat,
  MapPin,
  Info
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { Category, ExchangeRate } from '../../types';

interface NavbarProps {
  activeRate: ExchangeRate | null;
  onOpenCart: () => void;
  businessName?: string;
  logo?: string;
  icon?: string;
  categories?: Category[];
  selectedCategory?: string;
  onSelectCategory?: (catId: string) => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onOpenDailyMenu?: () => void;
  supportPhone?: string;
  cartTotalUSD?: number;
}

export const getCategoryIcon = (categoryName: string) => {
  const n = categoryName.toLowerCase();
  if (n.includes('medic') || n.includes('farma') || n.includes('salud') || n.includes('pastill') || n.includes('droga')) {
    return Pill;
  }
  if (
    n.includes('bolso') ||
    n.includes('morral') ||
    n.includes('cartera') ||
    n.includes('mochila') ||
    n.includes('accesorio') ||
    n.includes('malet') ||
    n.includes('billeter')
  ) {
    return ShoppingBag;
  }
  if (n.includes('cafe') || n.includes('café') || n.includes('bebida') || n.includes('jugo') || n.includes('refresco') || n.includes('malteada')) {
    return Coffee;
  }
  if (
    n.includes('comida') ||
    n.includes('almuerzo') ||
    n.includes('desayuno') ||
    n.includes('plato') ||
    n.includes('menu') ||
    n.includes('menú') ||
    n.includes('snack') ||
    n.includes('dulce') ||
    n.includes('postre')
  ) {
    return UtensilsCrossed;
  }
  if (n.includes('ropa') || n.includes('calzado') || n.includes('vestir') || n.includes('zapato') || n.includes('camisa')) {
    return Shirt;
  }
  if (n.includes('tecno') || n.includes('celular') || n.includes('cable') || n.includes('cargador') || n.includes('electr')) {
    return Smartphone;
  }
  if (n.includes('aseo') || n.includes('limpieza') || n.includes('hogar') || n.includes('cuidado') || n.includes('cosmetic')) {
    return Sparkles;
  }
  return Package;
};

export const Navbar: React.FC<NavbarProps> = ({
  activeRate,
  onOpenCart,
  businessName = 'Génesis Store & Market',
  logo,
  icon,
  categories = [],
  selectedCategory = 'ALL',
  onSelectCategory,
  searchTerm = '',
  onSearchChange,
  onOpenDailyMenu,
  supportPhone = '584120000000',
  cartTotalUSD = 0
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const cleanPhone = supportPhone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `👋 ¡Hola! Estoy navegando en el catálogo virtual de *${businessName}* y me gustaría hacer una consulta sobre sus productos y disponibilidad.`
  )}`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Notification / Tasa Bar (Slim) */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 sm:px-6 lg:px-8 border-b border-slate-800 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
              <Store className="w-3.5 h-3.5" />
              <span>Catálogo Comercial Multirubro & Variedades</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Alimentos • Medicamentos • Bolsos & Accesorios • Abarrotes
            </span>
          </div>

          <div className="flex items-center gap-4">
            {activeRate && (
              <div className="inline-flex items-center gap-1.5 bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Tasa Oficial ({activeRate.name}):</span>
                <strong className="text-amber-400 font-mono font-bold">
                  {activeRate.rate.toFixed(2)} Bs/$
                </strong>
              </div>
            )}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Atención WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Brand Logo / Isotipo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0 select-none">
            {logo ? (
              <img
                src={logo}
                alt={businessName}
                className="h-10 sm:h-12 max-w-[170px] sm:max-w-[210px] object-contain group-hover:scale-102 transition-transform"
              />
            ) : icon ? (
              <div className="flex items-center gap-3">
                <img
                  src={icon}
                  alt={businessName}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover shadow-sm border border-slate-200 group-hover:scale-105 transition-transform"
                />
                <div>
                  <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight block leading-tight">
                    {businessName}
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold tracking-wider uppercase">
                    Tienda & Variedades
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight block leading-tight">
                    {businessName}
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold tracking-wider uppercase">
                    Portal Comercial & Market
                  </span>
                </div>
              </div>
            )}
          </Link>

          {/* Quick Interactive Search Bar (Desktop / Tablet) */}
          {onSearchChange && (
            <div className="hidden md:flex flex-1 max-w-md relative">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar medicamentos, bolsos, café, comida..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-800 text-xs sm:text-sm rounded-xl border border-transparent focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition-all placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct WhatsApp Contact Button (Tablet/Desktop) */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              title="Escríbenos por WhatsApp para consultas"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Consultar</span>
            </a>

            {/* Daily Menu Shortcut (If Active) */}
            {onOpenDailyMenu && (
              <button
                onClick={onOpenDailyMenu}
                className="hidden sm:inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                <ChefHat className="w-4 h-4 text-amber-600" />
                <span>Menú Diario</span>
              </button>
            )}

            {/* About & Location Shortcut */}
            <a
              href="#sobre-nosotros"
              className="hidden xl:inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>Nosotros & Ubicación</span>
            </a>

            {/* Cart Button with Counter and Amount */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 group"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Carrito</span>
              {cartTotalUSD > 0 && (
                <span className="hidden md:inline text-amber-300 text-xs font-mono">
                  ${cartTotalUSD.toFixed(2)}
                </span>
              )}
              {totalCount > 0 ? (
                <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-xs animate-bounce">
                  {totalCount}
                </span>
              ) : (
                <span className="text-slate-400 text-xs hidden sm:inline">(0)</span>
              )}
            </button>

            {/* Admin Lock Button */}
            <Link
              to="/admin/dashboard"
              className="flex items-center justify-center p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Panel Administrativo"
            >
              <Lock className="w-4 h-4" />
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition-colors"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Quick Category Bar (Desktop / Horizontal Strip) */}
        {categories.length > 0 && onSelectCategory && (
          <div className="hidden md:flex items-center gap-1.5 py-2.5 border-t border-slate-100 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-2 shrink-0">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Departamentos:
            </span>

            <button
              onClick={() => onSelectCategory('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Tag className="w-3 h-3" />
              <span>Todos los Artículos</span>
            </button>

            {categories.map((cat) => {
              const IconComp = getCategoryIcon(cat.name);
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{cat.name}</span>
                  {cat._count?.products !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat._count.products}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Search & Drawer Accordion */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-4 shadow-xl animate-in slide-in-from-top duration-200">
          {/* Mobile Search Bar */}
          {onSearchChange && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar bolsos, medicamentos, café, etc..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-100 text-slate-800 text-xs rounded-xl border border-transparent focus:border-amber-400 focus:bg-white focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Active Rate Mobile Banner */}
          {activeRate && (
            <div className="flex items-center justify-between p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tasa Oficial ({activeRate.name}):</span>
              </div>
              <span className="font-mono font-bold text-amber-950">
                {activeRate.rate.toFixed(2)} Bs/$
              </span>
            </div>
          )}

          {/* Daily Menu Button Mobile */}
          {onOpenDailyMenu && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenDailyMenu();
              }}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm"
            >
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4" />
                <span>Ver Menú Diario & Almuerzos</span>
              </div>
              <Flame className="w-4 h-4 animate-bounce" />
            </button>
          )}

          {/* Department Categories Mobile Grid */}
          {categories.length > 0 && onSelectCategory && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Departamentos & Rubros
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onSelectCategory('ALL');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-left border ${
                    selectedCategory === 'ALL'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span className="truncate">Todos</span>
                </button>

                {categories.map((cat) => {
                  const IconComp = getCategoryIcon(cat.name);
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onSelectCategory(cat.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 text-left border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* About & Location Mobile Button */}
          <a
            href="#sobre-nosotros"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>Acerca de la Empresa & Ubicación</span>
            </div>
            <Info className="w-4 h-4 text-slate-400" />
          </a>

          {/* WhatsApp Direct Support Button Mobile */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Atención por WhatsApp</span>
            </a>

            <Link
              to="/admin/dashboard"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              title="Panel Administrativo"
            >
              <Lock className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
