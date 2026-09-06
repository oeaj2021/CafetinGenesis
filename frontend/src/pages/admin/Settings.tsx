import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Store, Phone, MapPin, FileText } from 'lucide-react';
import { api } from '../../api/client';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    BUSINESS_NAME: 'Cafetín Génesis',
    BUSINESS_RIF: 'J-12345678-9',
    BUSINESS_PHONE: '584120000000',
    BUSINESS_ADDRESS: 'Plaza Bolívar, Local 4, Venezuela',
    BUSINESS_FOOTER_NOTE: '¡Gracias por su compra! Vuelva pronto.'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.settings) {
        setSettings((prev) => ({ ...prev, ...res.data.settings }));
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
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
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Configuración del Negocio
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Datos de la empresa, número de WhatsApp para pedidos y formato de comprobante
        </p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>¡Configuraciones guardadas exitosamente!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
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
            <p className="text-[10px] text-slate-400 mt-1">Código de país + número sin espacios (ej: 584121234567)</p>
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
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
};
