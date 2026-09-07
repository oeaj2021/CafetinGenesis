import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Eye,
  PlusCircle,
  FileEdit,
  Trash2,
  LogIn,
  RefreshCw,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Building2,
  FileText,
  Activity,
  Layers,
  Database
} from 'lucide-react';
import { api } from '../../api/client';
import { AuditLog, AuditStats } from '../../types';
import { Modal } from '../../components/common/Modal';

const ACTION_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  CREATE: { label: 'Creación', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: PlusCircle },
  UPDATE: { label: 'Modificación', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: FileEdit },
  DELETE: { label: 'Eliminación', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: Trash2 },
  LOGIN: { label: 'Inicio Sesión', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: LogIn },
  RATE_SYNC: { label: 'Sincronización Tasa', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: RefreshCw },
  CASH_OPEN: { label: 'Apertura Caja', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: DollarSign },
  CASH_CLOSE: { label: 'Arqueo / Cierre Caja', bg: 'bg-slate-100 border-slate-300', text: 'text-slate-800', icon: DollarSign },
  PAYMENT: { label: 'Cobro / Pago', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-800', icon: ShoppingCart }
};

const MODULE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  AUTH: { label: 'Seguridad & Acceso', icon: ShieldCheck, color: 'text-purple-600' },
  PRODUCTS: { label: 'Inventario & Productos', icon: Package, color: 'text-amber-600' },
  CATEGORIES: { label: 'Departamentos / Categorías', icon: Layers, color: 'text-blue-600' },
  INVOICES: { label: 'Ventas & Facturación', icon: ShoppingCart, color: 'text-emerald-600' },
  PURCHASES: { label: 'Compras de Mercancía', icon: Package, color: 'text-indigo-600' },
  USERS: { label: 'Cuentas de Usuarios', icon: Users, color: 'text-rose-600' },
  SETTINGS: { label: 'Configuración Global', icon: Building2, color: 'text-slate-600' },
  RATES: { label: 'Tasas de Cambio', icon: DollarSign, color: 'text-emerald-600' },
  CASH: { label: 'Caja & Arqueos', icon: DollarSign, color: 'text-amber-600' },
  CLIENTS: { label: 'Clientes & Fiados', icon: Users, color: 'text-cyan-600' },
  DAILY_MENU: { label: 'Menú Diario', icon: FileText, color: 'text-orange-600' }
};

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedModule, selectedAction]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        api.get('/audit', {
          params: {
            module: selectedModule,
            action: selectedAction,
            search: searchTerm
          }
        }),
        api.get('/audit/stats')
      ]);

      setLogs(logsRes.data.logs || []);
      setStats(statsRes.data || null);
    } catch (err: any) {
      console.error('Error cargando auditoría:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openLogDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  const parseJsonSafe = (raw: string | null | undefined) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Trazabilidad & Seguridad Operacional</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pista de Auditoría de Cambios
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro cronológico inmutable de creaciones, modificaciones, eliminaciones e inicios de sesión
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Actualizar Registro</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total de Eventos</span>
            <div className="text-2xl font-black text-slate-900">{stats?.totalLogs || logs.length}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Actividad Hoy</span>
            <div className="text-2xl font-black text-slate-900">{stats?.todayLogsCount || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Integridad de Datos</span>
            <div className="text-xs font-extrabold text-emerald-600 flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>100% Protegido & Auditado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descripción, usuario, IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </form>

          {/* Module Selector */}
          <div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="ALL">Todos los Módulos</option>
              {Object.entries(MODULE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>

          {/* Action Selector */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="ALL">Todas las Acciones</option>
              {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Fecha & Hora</th>
                <th className="py-3.5 px-4">Operador / Usuario</th>
                <th className="py-3.5 px-4">Módulo</th>
                <th className="py-3.5 px-4">Acción Realizada</th>
                <th className="py-3.5 px-5">Descripción del Cambio</th>
                <th className="py-3.5 px-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Cargando eventos de auditoría...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se han encontrado registros de auditoría para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const act = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    bg: 'bg-slate-100 border-slate-200',
                    text: 'text-slate-700',
                    icon: History
                  };
                  const mod = MODULE_CONFIG[log.module] || {
                    label: log.module,
                    icon: Layers,
                    color: 'text-slate-600'
                  };
                  const ActIcon = act.icon;
                  const ModIcon = mod.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date / Time */}
                      <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {new Date(log.createdAt).toLocaleDateString('es-VE')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString('es-VE')}
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-slate-900 text-amber-400 font-black text-[10px] flex items-center justify-center shrink-0">
                            {(log.userName || 'S').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {log.userName || 'Sistema / Cron'}
                            </div>
                            {log.userRole && (
                              <span className="text-[9px] font-bold text-slate-400 uppercase">
                                {log.userRole}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Module */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold">
                          <ModIcon className={`w-3.5 h-3.5 ${mod.color}`} />
                          <span>{mod.label}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${act.bg} ${act.text}`}>
                          <ActIcon className="w-3 h-3" />
                          <span>{act.label}</span>
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-5 text-slate-800 font-medium max-w-xs truncate">
                        {log.description}
                      </td>

                      {/* Detail CTA */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openLogDetail(log)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                          title="Inspeccionar valores anteriores y nuevos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Detalle Completo de Auditoría"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            {/* Meta Header */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha y Hora</span>
                <span className="font-mono font-bold text-slate-800">
                  {new Date(selectedLog.createdAt).toLocaleString('es-VE')}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Operador / Usuario</span>
                <span className="font-bold text-slate-900">
                  {selectedLog.userName || 'Sistema Automático'} {selectedLog.userRole ? `(${selectedLog.userRole})` : ''}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Módulo Afectado</span>
                <span className="font-bold text-slate-800">{selectedLog.module}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Acción</span>
                <span className="font-bold text-slate-800">{selectedLog.action}</span>
              </div>

              {selectedLog.ipAddress && (
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Dirección IP de Origen</span>
                  <span className="font-mono text-slate-600">{selectedLog.ipAddress}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase block mb-1">Descripción del Cambio</span>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                {selectedLog.description}
              </div>
            </div>

            {/* Changes Inspector (Old vs New) */}
            {(selectedLog.oldValues || selectedLog.newValues) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedLog.oldValues && (
                  <div>
                    <span className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1 mb-1">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Valores Anteriores</span>
                    </span>
                    <pre className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-[11px] font-mono text-rose-900 overflow-x-auto max-h-48">
                      {JSON.stringify(parseJsonSafe(selectedLog.oldValues), null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.newValues && (
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1 mb-1">
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Nuevos Valores</span>
                    </span>
                    <pre className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-[11px] font-mono text-emerald-900 overflow-x-auto max-h-48">
                      {JSON.stringify(parseJsonSafe(selectedLog.newValues), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {selectedLog.metadata && (
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase block mb-1">Metadatos / Contexto Adicional</span>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-700 overflow-x-auto max-h-36">
                  {JSON.stringify(parseJsonSafe(selectedLog.metadata), null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
