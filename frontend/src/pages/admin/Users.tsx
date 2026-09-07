import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Shield,
  ShieldCheck,
  Key,
  Mail,
  User,
  Trash2,
  Edit2,
  CheckCircle2,
  Eye,
  EyeOff,
  Search,
  ChefHat,
  ShoppingCart,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { api } from '../../api/client';
import { User as UserType } from '../../types';
import { Modal } from '../../components/common/Modal';
import { useAuthStore } from '../../store/useAuthStore';

interface RoleDefinition {
  id: 'ADMIN' | 'OPERATOR' | 'CASHIER' | 'KITCHEN';
  name: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  icon: any;
  permissions: string[];
}

const ROLES: RoleDefinition[] = [
  {
    id: 'ADMIN',
    name: 'Administrador Global',
    description: 'Acceso total sin restricciones a configuración, reportes, usuarios y finanzas.',
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeText: 'text-rose-700',
    icon: ShieldCheck,
    permissions: [
      'Gestión de Usuarios y Roles',
      'Configuración Global de la Empresa',
      'Edición de Tasas de Cambio',
      'Punto de Venta / Arqueo de Caja',
      'Inventario, Compras y Proveedores',
      'Reportes y Métricas Financieras'
    ]
  },
  {
    id: 'CASHIER',
    name: 'Cajero / Operador POS',
    description: 'Enfocado en ventas de mostrador, cobros multimoneda, facturas y apertura/cierre de caja.',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-800',
    icon: ShoppingCart,
    permissions: [
      'Punto de Venta (POS)',
      'Emisión y Reimpresión de Facturas',
      'Apertura, Movimientos y Cierre de Caja',
      'Cuentas por Cobrar (Cobro de Fiados)',
      'Consulta de Catálogo e Inventario'
    ]
  },
  {
    id: 'KITCHEN',
    name: 'Cocina & Baristas (KDS)',
    description: 'Pantalla de preparación en tiempo real de alimentos, cafés y menús diarios.',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-800',
    icon: ChefHat,
    permissions: [
      'Monitor de Cocina y Comandas (KDS)',
      'Marcar Platos Listos / Entregados',
      'Consulta de Menú Diario'
    ]
  },
  {
    id: 'OPERATOR',
    name: 'Operador de Almacén',
    description: 'Control de stock físico, recepción de compras de mercancía y conteos.',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-800',
    icon: SlidersHorizontal,
    permissions: [
      'Entradas y Salidas de Inventario',
      'Registro de Compras a Proveedores',
      'Consulta de Productos y Categorías'
    ]
  }
];

export const UsersManagement: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'OPERATOR' | 'CASHIER' | 'KITCHEN'>('OPERATOR');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Info Modal on Roles
  const [isRolesGuideOpen, setIsRolesGuideOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err: any) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setRole('OPERATOR');
    setShowPassword(false);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserType) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setUsername(u.username);
    setPassword('');
    setRole(u.role);
    setShowPassword(false);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !username.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos');
      return;
    }

    if (!editingUser && (!password || password.length < 6)) {
      setErrorMsg('La contraseña es requerida y debe tener mínimo 6 caracteres');
      return;
    }

    try {
      setSubmitting(true);
      if (editingUser) {
        const payload: any = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
          role
        };
        if (password.trim()) {
          payload.password = password.trim();
        }
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        await api.post('/users', {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
          role
        });
      }

      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: UserType) => {
    if (u.id === currentUser?.id) {
      alert('No puedes eliminar tu propio usuario en sesión activa');
      return;
    }

    const confirm = window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${u.name}" (@${u.username})? Esta acción no se puede deshacer.`);
    if (!confirm) return;

    try {
      await api.delete(`/users/${u.id}`);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleDef = (roleId: string) => {
    return ROLES.find((r) => r.id === roleId) || ROLES[1];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Control de Accesos & Personal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Usuarios & Roles del Sistema
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Crea cuentas de acceso seguras para administradores, cajeros, operadores de almacén y cocina
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsRolesGuideOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all"
          >
            <Info className="w-4 h-4 text-slate-500" />
            <span>Ver Permisos de Roles</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Role Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLES.map((r) => {
          const count = users.filter((u) => u.role === r.id).length;
          const IconC = r.icon;
          return (
            <div
              key={r.id}
              onClick={() => setSelectedRoleFilter(selectedRoleFilter === r.id ? 'ALL' : r.id)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                selectedRoleFilter === r.id
                  ? 'bg-amber-500/10 border-amber-400 shadow-md scale-[1.02]'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${r.badgeBg} ${r.badgeText}`}>
                  <IconC className="w-5 h-5" />
                </div>
                <span className="text-xl font-black text-slate-900">{count}</span>
              </div>
              <h3 className="font-extrabold text-xs text-slate-900">{r.name}</h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{r.description}</p>
            </div>
          );
        })}
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedRoleFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Todos ({users.length})
          </button>
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoleFilter(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedRoleFilter === r.id ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Operador / Nombre</th>
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-4">Correo Electrónico</th>
                <th className="py-3.5 px-4">Rol Asignado</th>
                <th className="py-3.5 px-4">Fecha Creación</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Cargando usuarios del sistema...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron usuarios registrados con los criterios indicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleDef = getRoleDef(u.role);
                  const isSelf = u.id === currentUser?.id;
                  const IconComp = roleDef.icon;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs shadow-xs">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                                  Tú
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {u.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-slate-700">
                        @{u.username}
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        {u.email}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${roleDef.badgeBg} ${roleDef.badgeText}`}>
                          <IconComp className="w-3 h-3" />
                          <span>{roleDef.name}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-400 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-VE') : 'N/A'}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                            title="Editar Usuario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => handleDelete(u)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Eliminar Usuario'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Editar Usuario: ${editingUser.name}` : 'Registrar Nuevo Usuario'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nombre Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Ej. Carlos Mendoza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Usuario (@username) *
              </label>
              <input
                type="text"
                required
                placeholder="carlosm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="carlos@genesis.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {editingUser ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña de Acceso *'}
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={editingUser ? '••••••••' : 'Mínimo 6 caracteres'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Rol de Seguridad & Permisos *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLES.map((r) => {
                const isSelected = role === r.id;
                const IconComp = r.icon;
                return (
                  <div
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${r.badgeBg} ${r.badgeText} shrink-0`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">{r.name}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Roles Guide & Permissions Modal */}
      <Modal
        isOpen={isRolesGuideOpen}
        onClose={() => setIsRolesGuideOpen(false)}
        title="Guía de Roles y Matriz de Permisos"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Cada rol otorga permisos específicos en el sistema para garantizar la seguridad y auditoría en caja e inventario:
          </p>

          <div className="space-y-3">
            {ROLES.map((r) => {
              const IconComp = r.icon;
              return (
                <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${r.badgeBg} ${r.badgeText}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">{r.name}</h4>
                      <p className="text-[11px] text-slate-500">{r.description}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                    {r.permissions.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsRolesGuideOpen(false)}
              className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
