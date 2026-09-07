import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Vault,
  Receipt,
  Truck,
  Package,
  Users,
  CreditCard,
  DollarSign,
  Settings,
  Store,
  LogOut,
  Menu,
  X,
  Coffee,
  ChefHat,
  UtensilsCrossed,
  ChevronDown,
  ChevronRight,
  Boxes,
  WalletCards,
  SlidersHorizontal,
  ShieldCheck,
  History
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../api/client';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'operaciones',
    title: 'Operaciones & Ventas',
    icon: Boxes,
    items: [
      { name: 'Punto de Venta / POS', href: '/admin/pos', icon: ShoppingCart },
      { name: 'Menús Diarios & WhatsApp', href: '/admin/daily-menu', icon: UtensilsCrossed },
      { name: 'Cocina & Baristas (KDS)', href: '/admin/cocina', icon: ChefHat },
      { name: 'Caja & Arqueo', href: '/admin/caja', icon: Vault },
      { name: 'Facturación / Recibos', href: '/admin/invoices', icon: Receipt },
    ],
  },
  {
    id: 'inventario',
    title: 'Inventario & Proveedores',
    icon: Package,
    items: [
      { name: 'Inventario & Productos', href: '/admin/inventory', icon: Package },
      { name: 'Compras de Mercancía', href: '/admin/purchases', icon: Truck },
    ],
  },
  {
    id: 'finanzas',
    title: 'Clientes & Finanzas',
    icon: WalletCards,
    items: [
      { name: 'Cuentas por Cobrar (Fiados)', href: '/admin/debts', icon: CreditCard },
      { name: 'Clientes', href: '/admin/clients', icon: Users },
    ],
  },
  {
    id: 'sistema',
    title: 'Administración & Control',
    icon: SlidersHorizontal,
    items: [
      { name: 'Dashboard General', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Usuarios & Roles', href: '/admin/users', icon: ShieldCheck },
      { name: 'Auditoría de Cambios', href: '/admin/audit', icon: History },
      { name: 'Tasas de Cambio', href: '/admin/rates', icon: DollarSign },
      { name: 'Configuración Global', href: '/admin/settings', icon: Settings },
    ],
  },
];

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data?.settings) {
          setBusinessSettings(data.settings);
        } else if (data && typeof data === 'object') {
          setBusinessSettings(data);
        }
      } catch (err) {
        console.error('Error loading business settings for AdminLayout:', err);
      }
    };
    fetchSettings();
  }, []);

  // Persistence of collapsed state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('genesis_sidebar_collapsed');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Ensure active route section is automatically expanded
  useEffect(() => {
    const activeSection = NAV_SECTIONS.find((section) =>
      section.items.some((item) => item.href === location.pathname)
    );
    if (activeSection && collapsedSections[activeSection.id]) {
      setCollapsedSections((prev) => {
        const next = { ...prev, [activeSection.id]: false };
        localStorage.setItem('genesis_sidebar_collapsed', JSON.stringify(next));
        return next;
      });
    }
  }, [location.pathname]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      localStorage.setItem('genesis_sidebar_collapsed', JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const brandName = businessSettings.BUSINESS_NAME || 'Cafetín Génesis';
  const brandIcon = businessSettings.BUSINESS_ICON || businessSettings.BUSINESS_LOGO;

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-5 bg-slate-950/50 border-b border-slate-800">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
            {brandIcon ? (
              <img
                src={brandIcon}
                alt={brandName}
                className="w-8 h-8 rounded-lg object-contain bg-slate-800 p-0.5 border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
            )}
            <span className="font-bold text-white tracking-wide text-sm truncate">
              {brandName}
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto custom-scrollbar">
          {NAV_SECTIONS.map((section) => {
            const isCollapsed = !!collapsedSections[section.id];
            const hasActiveChild = section.items.some(
              (item) => item.href === location.pathname
            );
            const SectionIcon = section.icon;

            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors select-none ${
                    hasActiveChild
                      ? 'text-amber-400/90 hover:bg-slate-800/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <SectionIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-[11px]">{section.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {section.items.length}
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Section Items */}
                {!isCollapsed && (
                  <div className="space-y-1 pl-1 pt-0.5 animate-fadeIn">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'stroke-[2.5]' : ''}`} />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom User Section */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2 w-full px-3 py-2 mb-2 text-xs font-medium text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Ver Tienda Pública</span>
          </Link>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrador'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@genesis.com'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Mobile */}
        <header className="lg:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-slate-900 text-sm">Panel Administrativo</span>
          <div className="w-8" />
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around py-2 px-1 text-[10px] font-bold text-slate-400">
          {[
            { name: 'POS', href: '/admin/pos', icon: ShoppingCart },
            { name: 'Cocina', href: '/admin/cocina', icon: ChefHat },
            { name: 'Resumen', href: '/admin/dashboard', icon: LayoutDashboard },
            { name: 'Caja', href: '/admin/caja', icon: Vault },
            { name: 'Deudores', href: '/admin/debts', icon: CreditCard }
          ].map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-amber-400 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
