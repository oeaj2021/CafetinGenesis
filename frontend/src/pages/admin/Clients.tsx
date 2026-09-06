import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Search, CreditCard, Download, MessageCircle } from 'lucide-react';
import { api } from '../../api/client';
import { Client } from '../../types';
import { Modal } from '../../components/common/Modal';
import { exportToCSV } from '../../utils/exportToExcel';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      setClients(res.data.clients || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Nombre', 'Cédula/RIF', 'Teléfono', 'Email', 'Dirección', 'Deuda Pendiente ($)', 'Total Compras'];
    const rows = clients.map((c) => [
      c.name,
      c.idNumber,
      c.phone,
      c.email || 'N/A',
      c.address || 'N/A',
      (c.totalPendingDebtUSD || 0).toFixed(2),
      c._count?.invoices || 0
    ]);
    exportToCSV('Directorio_Clientes_Genesis', headers, rows);
  };

  const openCreateModal = () => {
    setEditingClient(null);
    setName('');
    setIdNumber('V-');
    setPhone('');
    setAddress('');
    setEmail('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setIdNumber(client.idNumber);
    setPhone(client.phone);
    setAddress(client.address || '');
    setEmail(client.email || '');
    setNotes(client.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        idNumber,
        phone,
        address: address || null,
        email: email || null,
        notes: notes || null
      };

      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, payload);
      } else {
        await api.post('/clients', payload);
      }

      setIsModalOpen(false);
      loadClients();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar cliente');
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Directorio de Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de clientes frecuentes, datos de contacto y balances de crédito
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o Cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Cédula / RIF</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Deuda Pendiente</th>
                <th className="py-3 px-4">Historial Facturas</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Cargando clientes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      {c.address && <p className="text-[10px] text-slate-400">{c.address}</p>}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {c.idNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {c.phone}
                    </td>
                    <td className="py-3 px-4">
                      {(c.totalPendingDebtUSD || 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-xs">
                          <CreditCard className="w-3 h-3" />
                          ${c.totalPendingDebtUSD?.toFixed(2)} USD
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-xs font-bold">✓ Solvente</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-semibold">
                      {c._count?.invoices || 0} compras realizadas
                    </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {c.phone && (
                            <a
                              href={`https://wa.me/${c.phone.replace(/\D/g, '').startsWith('0') ? '58' + c.phone.replace(/\D/g, '').slice(1) : c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Hola ${c.name}, un cordial saludo de Cafetín Génesis ☕🥪`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-[11px]"
                              title="Escribir por WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar Datos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveClient} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cédula o RIF *</label>
              <input
                type="text"
                required
                placeholder="V-12345678"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono / WhatsApp *</label>
              <input
                type="text"
                required
                placeholder="584121234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dirección</label>
            <input
              type="text"
              placeholder="Ej. Centro, Calle Sucre"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notas Internas</label>
            <textarea
              rows={2}
              placeholder="Observaciones sobre el cliente o límite de crédito..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-md"
            >
              {editingClient ? 'Actualizar Cliente' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
