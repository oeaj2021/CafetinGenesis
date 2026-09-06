import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  CheckCircle,
  Store,
  Phone,
  MapPin,
  FileText,
  Palette,
  Check,
  Image,
  Upload,
  Trash2,
  Sparkles,
  Coffee
} from 'lucide-react';
import { api } from '../../api/client';
import { useThemeStore, THEME_PRESETS } from '../../store/useThemeStore';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    BUSINESS_NAME: 'Cafetín Génesis',
    BUSINESS_RIF: 'J-12345678-9',
    BUSINESS_PHONE: '584120000000',
    BUSINESS_ADDRESS: 'Plaza Bolívar, Local 4, Venezuela',
    BUSINESS_FOOTER_NOTE: '¡Gracias por su compra! Vuelva pronto.',
    THEME_COLOR: 'amber',
    BUSINESS_LOGO: '',
    BUSINESS_ICON: ''
  });
  const [saved, setSaved] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const { currentThemeId, setTheme } = useThemeStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.settings) {
        setSettings((prev) => ({ ...prev, ...res.data.settings }));
        if (res.data.settings.THEME_COLOR) {
          setTheme(res.data.settings.THEME_COLOR);
        }
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  };

  const handleSelectTheme = (themeId: string) => {
    setTheme(themeId);
    setSettings((prev) => ({ ...prev, THEME_COLOR: themeId }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        alert('El archivo no debe superar los 2.5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings((prev) => ({ ...prev, BUSINESS_LOGO: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert('El archivo no debe superar 1.5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings((prev) => ({ ...prev, BUSINESS_ICON: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar configuración');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-amber-600" />
          Configuración del Sistema & Marca
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Carga el logo, ícono de la marca, paleta de colores, datos fiscales y números de atención de WhatsApp
        </p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>¡Configuraciones, logos e identidad de marca guardadas exitosamente!</span>
        </div>
      )}

      {/* Sección de Carga de Logo & Ícono de la Marca */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Image className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Logotipo e Ícono de la Marca</h3>
            <p className="text-xs text-slate-500">
              Personaliza el logotipo que aparece en el catálogo, tickets, flyers de WhatsApp y el ícono de la app
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Logo Principal */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Logo Principal (Header / Flyers)
                </label>
                {settings.BUSINESS_LOGO && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, BUSINESS_LOGO: '' })}
                    className="text-rose-600 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Quitar</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Recomendado: Formato horizontal o rectangular con fondo transparente (PNG, JPG, SVG).
              </p>

              {/* Preview Container */}
              <div className="h-32 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-center p-3 relative overflow-hidden group">
                {settings.BUSINESS_LOGO ? (
                  <img
                    src={settings.BUSINESS_LOGO}
                    alt="Logo Empresa"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400 space-y-1">
                    <Coffee className="w-8 h-8 mx-auto text-slate-300" />
                    <span className="text-[11px] font-bold block">Sin logo asignado</span>
                    <span className="text-[10px] text-slate-400">Usa el ícono por defecto</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings.BUSINESS_LOGO ? 'Cambiar Logo' : 'Subir Imagen de Logo'}</span>
              </button>

              <input
                type="text"
                placeholder="O pegar URL directa de imagen..."
                value={settings.BUSINESS_LOGO}
                onChange={(e) => setSettings({ ...settings, BUSINESS_LOGO: e.target.value })}
                className="w-full px-3 py-1.5 text-[11px] bg-white border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* 2. Ícono / Isotipo de la Marca */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Ícono / Isotipo (Navbar & Sidebar)
                </label>
                {settings.BUSINESS_ICON && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, BUSINESS_ICON: '' })}
                    className="text-rose-600 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Quitar</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Recomendado: Formato cuadrado o circular (1:1), 512x512px o similar.
              </p>

              {/* Preview Container */}
              <div className="h-32 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-center gap-4 p-3 relative overflow-hidden">
                {settings.BUSINESS_ICON ? (
                  <>
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={settings.BUSINESS_ICON}
                        alt="Ícono Redondo"
                        className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200"
                      />
                      <span className="text-[9px] text-slate-400 font-bold">Circular</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={settings.BUSINESS_ICON}
                        alt="Ícono Cuadrado"
                        className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-200"
                      />
                      <span className="text-[9px] text-slate-400 font-bold">Cuadrado</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-400 space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center mx-auto">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold block">Ícono por defecto</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <input
                ref={iconInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => iconInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings.BUSINESS_ICON ? 'Cambiar Ícono' : 'Subir Imagen de Ícono'}</span>
              </button>

              <input
                type="text"
                placeholder="O pegar URL directa de imagen..."
                value={settings.BUSINESS_ICON}
                onChange={(e) => setSettings({ ...settings, BUSINESS_ICON: e.target.value })}
                className="w-full px-3 py-1.5 text-[11px] bg-white border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Color y Tema */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Paleta de Colores del Frontend & Portal</h3>
            <p className="text-xs text-slate-500">Selecciona el color corporativo que vestirá tu tienda pública y panel de control</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {THEME_PRESETS.map((preset) => {
            const isSelected = currentThemeId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectTheme(preset.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-md bg-slate-50/80 scale-[1.02]'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className="w-7 h-7 rounded-xl shadow-sm border border-white flex items-center justify-center"
                    style={{ backgroundColor: preset.primary }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
                      Activo
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs text-slate-800">{preset.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Información Comercial & Fiscal</h3>
            <p className="text-xs text-slate-500">Datos mostrados en tickets, facturas y portal virtual</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Nombre del Negocio / Tienda *
          </label>
          <div className="relative">
            <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={settings.BUSINESS_NAME}
              onChange={(e) => setSettings({ ...settings, BUSINESS_NAME: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              RIF del Negocio *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={settings.BUSINESS_RIF}
                onChange={(e) => setSettings({ ...settings, BUSINESS_RIF: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              WhatsApp para Recibir Pedidos *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="584120000000"
                value={settings.BUSINESS_PHONE}
                onChange={(e) => setSettings({ ...settings, BUSINESS_PHONE: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Código de país + número sin espacios (ej: 584149998877)</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Dirección Física
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={settings.BUSINESS_ADDRESS}
              onChange={(e) => setSettings({ ...settings, BUSINESS_ADDRESS: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Pie de Factura / Mensaje de Agradecimiento
          </label>
          <input
            type="text"
            value={settings.BUSINESS_FOOTER_NOTE}
            onChange={(e) => setSettings({ ...settings, BUSINESS_FOOTER_NOTE: e.target.value })}
            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-7 py-3 rounded-2xl text-xs font-extrabold shadow-lg transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración General</span>
          </button>
        </div>
      </form>
    </div>
  );
};

