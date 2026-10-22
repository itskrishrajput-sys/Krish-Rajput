import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  Boxes,
  MapPin,
  CheckCircle,
  XCircle,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  Tag,
  ArrowUpRight,
} from 'lucide-react';
import { Product, ProductStatus, ShopSettings, calculateStockStatus } from '../types/erp';
import { formatCurrency } from '../utils/formatters';
import { saveStoredProducts } from '../utils/storage';
import { saveProductToCloud } from '../firebase/firestoreService';

interface InventoryPageProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: ShopSettings;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onOpenDeleteModal: (product: Product) => void;
  isLoading?: boolean;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  products,
  setProducts,
  settings,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteModal,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Dynamic categories from real product data
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return ['all', ...Array.from(set).sort()];
  }, [products]);

  // Inventory Summary Metrics (Authoritative calculation)
  const summary = useMemo(() => {
    const totalProducts = products.length;
    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const stock = typeof p.stock === 'number' ? Math.max(0, p.stock) : 0;
      const minStock = typeof p.minimum_stock === 'number' ? Math.max(0, p.minimum_stock) : 0;
      totalStock += stock;

      if (stock <= 0) {
        outOfStock++;
      } else if (stock <= minStock) {
        lowStock++;
      }
    });

    return {
      totalProducts,
      totalStock,
      lowStock,
      outOfStock,
    };
  }, [products]);

  // Filter products by Search (name & SKU) + Category + Stock Status
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'all' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();

      const computedStatus: ProductStatus = calculateStockStatus(p.stock, p.minimum_stock ?? 0);

      let matchesStatus = true;
      if (selectedStatus !== 'all') {
        matchesStatus = computedStatus.toLowerCase() === selectedStatus.toLowerCase();
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Quick Inline Stock Adjustment (+1, +5)
  const handleQuickAdjustStock = (productId: string, delta: number) => {
    let updatedProduct: Product | null = null;
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock + delta);
          const newStatus = calculateStockStatus(newStock, p.minimum_stock ?? 0);
          updatedProduct = {
            ...p,
            stock: newStock,
            status: newStatus,
            updated_at: Date.now(),
          };
          return updatedProduct;
        }
        return p;
      });
      saveStoredProducts(next);
      return next;
    });

    if (updatedProduct) {
      saveProductToCloud(updatedProduct).catch(() => {});
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Stock',
      'Minimum Stock',
      'Bin / Location',
      'Rate (INR)',
      'Cost Price (INR)',
      'Status',
    ];

    const rows = filteredProducts.map((p) => {
      const st = calculateStockStatus(p.stock, p.minimum_stock ?? 0);
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.sku || ''}"`,
        `"${p.category || ''}"`,
        p.stock,
        p.minimum_stock ?? 0,
        `"${p.bin || ''}"`,
        p.rate,
        p.costPrice || 0,
        `"${st}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: ProductStatus) => {
    if (status === 'Out of Stock') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          <span>Out of Stock</span>
        </span>
      );
    }
    if (status === 'Low Stock') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Low Stock</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Healthy</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* Page Title & Main Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time stock quantities, minimum stock alerts, and automated status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            title="Download Inventory CSV"
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Products</span>
            <Boxes className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {summary.totalProducts}
            </span>
            <span className="text-xs text-slate-400 font-medium">SKUs</span>
          </div>
        </div>

        {/* Total Stock */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Stock</span>
            <Package className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {summary.totalStock}
            </span>
            <span className="text-xs text-slate-400 font-medium">units</span>
          </div>
        </div>

        {/* Low Stock */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'Low Stock' ? 'all' : 'Low Stock')}
          className={`rounded-2xl p-3.5 sm:p-4 border shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
            selectedStatus === 'Low Stock'
              ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-400/30'
              : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 tabular-nums">
              {summary.lowStock}
            </span>
            <span className="text-[11px] text-amber-700/80 font-medium">at/below min</span>
          </div>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'Out of Stock' ? 'all' : 'Out of Stock')}
          className={`rounded-2xl p-3.5 sm:p-4 border shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
            selectedStatus === 'Out of Stock'
              ? 'bg-rose-100 border-rose-300 ring-2 ring-rose-400/30'
              : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/60'
          }`}
        >
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
            <span>Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 tabular-nums">
              {summary.outOfStock}
            </span>
            <span className="text-[11px] text-rose-700/80 font-medium">0 left</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar - Optimized for Mobile (360px - 430px) */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm space-y-3">
        {/* Full-width Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full pl-10 pr-4 py-2.5 min-h-[44px] text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Selectors Bar */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          {/* Category Filter */}
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 sm:hidden">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              {dynamicCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 sm:hidden">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="all">All Status</option>
              <option value="Healthy">Healthy</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <div className="col-span-2 sm:col-auto flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                className="w-full sm:w-auto min-h-[40px] px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Active Filter Summary Feedback */}
        {(selectedCategory !== 'all' || selectedStatus !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>Filtered:</span>
            {searchQuery && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono text-[11px]">
                "{searchQuery}"
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                {selectedCategory}
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-medium text-[11px]">
                {selectedStatus}
              </span>
            )}
            <span className="ml-auto text-[11px] text-slate-400">
              {filteredProducts.length} of {products.length} products
            </span>
          </div>
        )}
      </div>

      {/* Loading State Indicator */}
      {isLoading && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-500">Updating inventory data...</p>
        </div>
      )}

      {/* ============================================================== */}
      {/* MOBILE RESPONSIVE CARD VIEW (Optimized for 360px – 430px screens) */}
      {/* ============================================================== */}
      <div className="md:hidden space-y-3.5">
        {filteredProducts.map((p) => {
          const minLimit = p.minimum_stock ?? 0;
          const currentStock = Math.max(0, p.stock || 0);
          const computedStatus = calculateStockStatus(currentStock, minLimit);

          // Stock health progress percentage (capped at 100%)
          const healthPercent = minLimit > 0
            ? Math.min(100, Math.round((currentStock / (minLimit * 1.5)) * 100))
            : (currentStock > 0 ? 100 : 0);

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl p-4 border shadow-xs transition-all relative ${
                computedStatus === 'Out of Stock'
                  ? 'border-rose-200/80 bg-gradient-to-b from-rose-50/20 to-white'
                  : computedStatus === 'Low Stock'
                  ? 'border-amber-200/80 bg-gradient-to-b from-amber-50/20 to-white'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Row 1: Product Name & Authoritative Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {p.name}
                  </h3>
                </div>
                {getStatusBadge(computedStatus)}
              </div>

              {/* Row 2: SKU Chip, Category, and Bin Location Tag */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md shrink-0">
                  {p.sku}
                </span>

                <span className="text-[11px] font-medium text-slate-600 truncate max-w-[120px]">
                  {p.category}
                </span>

                <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 ml-auto shrink-0 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>Bin: <strong className="text-slate-700">{p.bin || 'A-01'}</strong></span>
                </div>
              </div>

              {/* Row 3: Key Metrics Strip (Stock, Minimum Alert, Selling Rate) */}
              <div className="grid grid-cols-3 gap-2 mt-3 p-3 bg-slate-50/90 rounded-xl border border-slate-100 text-center">
                {/* Stock Column */}
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                    Stock
                  </span>
                  <div className="mt-0.5">
                    <span
                      className={`text-base font-extrabold tabular-nums ${
                        computedStatus === 'Out of Stock'
                          ? 'text-rose-600'
                          : computedStatus === 'Low Stock'
                          ? 'text-amber-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {currentStock}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium ml-0.5">
                      {p.unit || 'Pcs'}
                    </span>
                  </div>
                </div>

                {/* Minimum Stock Limit Column */}
                <div className="flex flex-col justify-center border-x border-slate-200/70 px-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                    Min Alert
                  </span>
                  <div className="mt-0.5">
                    <span className="text-sm font-bold text-slate-700 tabular-nums">
                      {minLimit}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium ml-0.5">
                      units
                    </span>
                  </div>
                </div>

                {/* Selling Rate Column */}
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                    Rate
                  </span>
                  <div className="mt-0.5">
                    <span className="text-base font-extrabold text-blue-600 tabular-nums">
                      ₹{p.rate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 4: Stock Health Micro Progress Bar */}
              <div className="mt-2.5">
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                  <span>Stock Health</span>
                  <span className="font-mono font-medium">
                    {currentStock} / {minLimit} min
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      computedStatus === 'Out of Stock'
                        ? 'w-0 bg-rose-500'
                        : computedStatus === 'Low Stock'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${healthPercent}%` }}
                  />
                </div>
              </div>

              {/* Row 5: Quick Restock Buttons & Main Action Controls */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {/* Quick Inline Restock (+1, +5) */}
                <div className="inline-flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-slate-400 font-medium">Add:</span>
                  <button
                    onClick={() => handleQuickAdjustStock(p.id, 1)}
                    className="h-8 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200/60 transition-colors active:scale-95 flex items-center gap-0.5"
                    title="Quick add 1 unit"
                  >
                    <span>+1</span>
                  </button>
                  <button
                    onClick={() => handleQuickAdjustStock(p.id, 5)}
                    className="h-8 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200/60 transition-colors active:scale-95 flex items-center gap-0.5"
                    title="Quick add 5 units"
                  >
                    <span>+5</span>
                  </button>
                </div>

                {/* Edit & Delete Actions (Minimum 44px touch targets) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenEditModal(p)}
                    className="min-h-[44px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onOpenDeleteModal(p)}
                    className="min-h-[44px] min-w-[44px] px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors active:scale-[0.98]"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* DESKTOP TABLE VIEW (Visible on tablet & desktop screens) */}
      {/* ============================================================== */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-3">SKU</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3 text-center">Stock</th>
                <th className="py-3.5 px-3 text-center">Minimum Stock</th>
                <th className="py-3.5 px-3">Bin / Location</th>
                <th className="py-3.5 px-3 text-right">Rate</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const computedStatus = calculateStockStatus(p.stock, p.minimum_stock ?? 0);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Product Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-sm">
                        {p.name}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold">
                        {p.sku}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {p.category}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="font-bold text-sm text-slate-900 tabular-nums">
                          {p.stock}
                        </span>
                        <span className="text-[10px] text-slate-400">{p.unit || 'Pcs'}</span>
                      </div>
                    </td>

                    {/* Minimum Stock */}
                    <td className="py-3 px-3 text-center tabular-nums text-slate-600 font-medium">
                      {p.minimum_stock ?? 0}
                    </td>

                    {/* Bin / Location */}
                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{p.bin || 'A-01'}</span>
                      </div>
                    </td>

                    {/* Rate */}
                    <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums text-sm">
                      {formatCurrency(p.rate)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(computedStatus)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickAdjustStock(p.id, 1)}
                          title="Quick add 1 unit"
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold transition-colors"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => onOpenEditModal(p)}
                          title="Edit Product"
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenDeleteModal(p)}
                          title="Delete Product"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State when no products match */}
      {filteredProducts.length === 0 && !isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">
            No products found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'No products matched your active filters. Try clearing your search or filters.'
              : 'Your inventory is currently empty. Click below to add your first product.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={onOpenAddModal}
                className="min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
