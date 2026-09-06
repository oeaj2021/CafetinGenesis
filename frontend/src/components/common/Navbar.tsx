import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ShoppingCart, Lock } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { ExchangeRate } from '../../types';

interface NavbarProps {
  activeRate: ExchangeRate | null;
  onOpenCart: () => void;
  businessName?: string;
  logo?: string;
  icon?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRate,
  onOpenCart,
  businessName = 'Cafetín Génesis',
  logo,
  icon
}) => {
  const cartItems = useCartStore((state) => state.items);
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo / Icon */}
          <Link to="/" className="flex items-center gap-3 group">
            {logo ? (
              <img
                src={logo}
                alt={businessName}
                className="h-10 max-w-[180px] object-contain group-hover:scale-105 transition-transform"
              />
            ) : icon ? (
              <img
                src={icon}
                alt={businessName}
                className="w-10 h-10 rounded-xl object-cover shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Coffee className="w-5 h-5" />
              </div>
            )}

            {!logo && (
              <div>
                <span className="text-xl font-bold text-slate-900 tracking-tight block">
                  {businessName}
                </span>
                <span className="text-xs text-amber-700 font-medium tracking-wide">
                  Tienda & Cafetería
                </span>
              </div>
            )}
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Tasa Badge */}
            {activeRate && (
              <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-full text-xs font-semibold shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tasa {activeRate.name}:</span>
                <span className="text-amber-800 font-extrabold">{activeRate.rate.toFixed(2)} Bs/$</span>
              </div>
            )}

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-all shadow-md active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden md:inline">Mi Pedido</span>
              {totalCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Admin Link */}
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-xl text-xs font-semibold transition-colors"
              title="Panel Administrativo"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden lg:inline">Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
