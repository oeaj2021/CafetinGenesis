import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Edit2, Trash2, Search, Layers, Download, ScanBarcode, Upload, Image as ImageIcon, Camera } from 'lucide-react';
import { api } from '../../api/client';
import { Product, Category, ExchangeRate } from '../../types';
import { Modal } from '../../components/common/Modal';
import { exportToCSV } from '../../utils/exportToExcel';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeRate, setActiveRate] = useState<ExchangeRate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [costUSD, setCostUSD] = useState(0);
  const [priceUSD, setPriceUSD] = useState(0);
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes, rateRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/rates/active')
      ]);
      setProducts(prodsRes.data.products || []);
      setCategories(catsRes.data.categories || []);
      setActiveRate(rateRes.data.rate || null);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentRate = activeRate?.rate || 1;

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setBarcode('');
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setCostUSD(0);
    setPriceUSD(1.0);
    setStock(10);
    setMinStock(5);
    setImage('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setBarcode(p.barcode || '');
    setDescription(p.description || '');
    setCategoryId(p.categoryId);
    setCostUSD(p.costUSD || 0);
    setPriceUSD(p.priceUSD);
    setStock(p.stock);
    setMinStock(p.minStock);
    setImage(p.image || '');
    setIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen no debe superar los 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        barcode: barcode.trim() || null,
        description,
        categoryId,
        costUSD: Number(costUSD),
        priceUSD: Number(priceUSD),
        stock: Number(stock),
        minStock: Number(minStock),
        image: image || null,
        isActive
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar producto');
    }
  };

  const handleExport = () => {
    const headers = [
      'ID',
      'Código de Barras',
      'Nombre',
      'Categoría',
      'Costo USD',
      'Precio USD',
      'Precio VES',
      'Stock Actual',
      'Stock Mínimo',
      'Estado'
    ];
    const rows = products.map((p) => [
      p.id.slice(0, 8),
      p.barcode || 'N/A',
      p.name,
      p.category?.name || 'General',
      p.costUSD.toFixed(2),
      p.priceUSD.toFixed(2),
      (p.priceUSD * currentRate).toFixed(2),
      p.stock,
      p.minStock,
      p.isActive ? 'ACTIVO' : 'INACTIVO'
    ]);
    exportToCSV('Inventario_Productos', headers, rows);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categories', { name: newCatName, description: newCatDesc });
      setNewCatName('');
      setNewCatDesc('');
      setIsCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear categoría');
    }
  };

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventario & Productos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra precios en $ y Bs, existencias y alertas de stock
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Layers className="w-4 h-4" />
            <span>Categorías</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar en inventario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
              selectedCategory === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                selectedCategory === c.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Costo USD</th>
                <th className="py-3 px-4">Precio USD</th>
                <th className="py-3 px-4">Precio Bs</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Cargando productos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const priceVES = (p.priceUSD * currentRate).toFixed(2);
                  const isLow = p.stock <= p.minStock;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{p.name}</p>
                            {p.description && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{p.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {p.category?.name || 'General'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        ${p.costUSD.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 font-mono">
                        ${p.priceUSD.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700 font-mono">
                        {priceVES} Bs
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            p.stock <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock} unid.
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            p.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={p.isActive ? 'Activo en tienda' : 'Inactivo'}
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Product Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre *</label>
              <input
                type="text"
                required
                placeholder="Ej. Café Mokaccino Grande"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                <span className="flex items-center gap-1">
                  <ScanBarcode className="w-3.5 h-3.5 text-amber-500" />
                  Código de Barras
                </span>
              </label>
              <input
                type="text"
                placeholder="Ej. 759123456789"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Categoría e Imagen con Uploader Directo */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Product Image Uploader */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>Foto / Imagen del Producto</span>
                </label>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="text-rose-600 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Quitar foto</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Visual Preview */}
                <div className="w-24 h-24 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative group">
                  {image ? (
                    <img
                      src={image}
                      alt="Preview producto"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-slate-400 p-1">
                      <Camera className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                      <span className="text-[9px] block leading-tight font-medium">Sin foto</span>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 w-full space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{image ? 'Cambiar Imagen' : 'Subir Foto desde Dispositivo'}</span>
                  </button>

                  <input
                    type="url"
                    placeholder="O pegar URL web de imagen (https://...)"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-1.5 text-[11px] bg-white border border-slate-200 rounded-xl placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Costo USD</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costUSD}
                onChange={(e) => setCostUSD(parseFloat(e.target.value) || 0)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Precio Venta USD *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={priceUSD}
                onChange={(e) => setPriceUSD(parseFloat(e.target.value) || 0)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Actual</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Mínimo</label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descripción</label>
            <textarea
              rows={2}
              placeholder="Detalles o ingredientes del producto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-amber-500"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-bold text-slate-700">
              Visible en el catálogo público / tienda virtual
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
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
              {editingProduct ? 'Actualizar Producto' : 'Registrar Producto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Crear Nueva Categoría"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de la Categoría *</label>
            <input
              type="text"
              required
              placeholder="Ej. Postres & Tortas"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descripción</label>
            <input
              type="text"
              placeholder="Descripción breve..."
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-md"
            >
              Crear Categoría
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
