import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Store, Phone, MapPin, FileText, Palette, Check } from 'lucide-react';
import { api } from '../../api/client';
import { useThemeStore, THEME_PRESETS } from '../../store/useThemeStore';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    BUSINESS_NAME: 'Cafetín Génesis',
    BUSINESS_RIF: 'J-12345678-9',
    BUSINESS_PHONE: '584120000000',
    BUSINESS_ADDRESS: 'Plaza Bolívar, Local 4, Venezuela',
    BUSINESS_FOOTER_NOTE: '¡Gracias por su compra! Vuelva pronto.',
    THEME_COLOR: 'amber'
  });
  const [saved, setSaved] = useState(false);

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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Configuración del Sistema & Marca
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Personaliza los colores de la tienda, datos fiscales y números de atención de WhatsApp
        </p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>¡Configuraciones y paleta de colores guardadas exitosamente!</span>
        </div>
      )}

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

