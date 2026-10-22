import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
  ArrowUpDown,
  Download,
  Boxes,
  PlusCircle,
} from 'lucide-react';
import { Product, ShopSettings } from '../types/erp';
import { formatCurrency } from '../utils/formatters';

interface StockTabProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: ShopSettings;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
}

export const StockTab: React.FC<StockTabProps> = ({
  products,
  setProducts,
  settings,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quickAddAmount, setQuickAddAmount] = useState<number>(5);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Inventory Metrics
  const stats = useMemo(() => {
    let totalItems = products.length;
    let totalStockUnits = 0;
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      totalStockUnits += p.stock;
      totalStockValue += p.stock * (p.costPrice || p.rate * 0.7);
      const minLimit = p.minimum_stock ?? p.minStock ?? 0;
      if (p.stock <= 0) {
        outOfStockCount++;
      } else if (p.stock <= minLimit) {
        lowStockCount++;
      }
    });

    return { totalItems, totalStockUnits, totalStockValue, lowStockCount, outOfStockCount };
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q));

      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

      const minLimit = p.minimum_stock ?? p.minStock ?? 0;
      let matchesFilter = true;
      if (filterType === 'low') {
        matchesFilter = p.stock > 0 && p.stock <= minLimit;
      } else if (filterType === 'out') {
        matchesFilter = p.stock <= 0;
      }

      return matchesSearch && matchesCat && matchesFilter;
    });
  }, [products, searchQuery, selectedCategory, filterType]);

  // Quick Restock
  const handleQuickAddStock = (productId: string, amount: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + amount) } : p))
    );
  };

  // Delete product
  const handleDeleteProduct = (productId: string, name: string) => {
    if (confirm(settings.language === 'hi' ? `क्या आप "${name}" को हटाना चाहते हैं?` : `Delete "${name}"?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Selling Rate (INR)', 'Cost Price (INR)', 'Current Stock', 'Min Stock Alert', 'Unit', 'Barcode'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.rate,
      p.costPrice,
      p.stock,
      p.minStock,
      p.unit,
      p.barcode || '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dukaan_Stock_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      
      {/* 4 KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{settings.language === 'hi' ? 'कुल वैरायटी' : 'Total Items'}</span>
            <Boxes className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {stats.totalItems}
            </span>
            <span className="text-xs text-slate-500">
              ({stats.totalStockUnits} {settings.language === 'hi' ? 'पीस' : 'units'})
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{settings.language === 'hi' ? 'स्टॉक पूंजी मूल्य' : 'Total Inventory Value'}</span>
            <span className="text-[11px] text-emerald-600 font-bold">लागत पर</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(stats.totalStockValue)}
            </span>
          </div>
        </div>

        <div 
          onClick={() => setFilterType(filterType === 'low' ? 'all' : 'low')}
          className={`rounded-2xl p-4 border shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
            filterType === 'low' ? 'bg-amber-100 border-amber-300' : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>{settings.language === 'hi' ? 'कम स्टॉक अलर्ट' : 'Low Stock Alert'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700 tabular-nums">
              {stats.lowStockCount}
            </span>
            <span className="text-xs text-amber-600">
              {settings.language === 'hi' ? 'सामान खत्म होने वाला है' : 'items near empty'}
            </span>
          </div>
        </div>

        <div 
          onClick={() => setFilterType(filterType === 'out' ? 'all' : 'out')}
          className={`rounded-2xl p-4 border shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
            filterType === 'out' ? 'bg-rose-100 border-rose-300' : 'bg-rose-50/60 border-rose-200 hover:bg-rose-50'
          }`}
        >
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
            <span>{settings.language === 'hi' ? 'आउट ऑफ स्टॉक' : 'Out of Stock'}</span>
            <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded font-bold">शून्य</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 tabular-nums">
              {stats.outOfStockCount}
            </span>
            <span className="text-xs text-rose-500">
              {settings.language === 'hi' ? 'तुरंत मंगाएं' : 'reorder now'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Toolbar & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={settings.language === 'hi' ? 'स्टॉक में खोजें...' : 'Search in inventory...'}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? (settings.language === 'hi' ? 'सभी कैटेगरी' : 'All Categories') : c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            title="Download CSV"
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{settings.language === 'hi' ? 'नया सामान जोड़ें' : 'Add Product'}</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{settings.language === 'hi' ? 'सामान का नाम' : 'Product'}</th>
                <th className="py-3 px-3">{settings.language === 'hi' ? 'कैटेगरी' : 'Category'}</th>
                <th className="py-3 px-3 text-right">{settings.language === 'hi' ? 'खरीद / बिक्री रेट' : 'Cost / Selling'}</th>
                <th className="py-3 px-3 text-right">{settings.language === 'hi' ? 'अनुमानित लाभ' : 'Profit / pc'}</th>
                <th className="py-3 px-4 text-center">{settings.language === 'hi' ? 'स्टॉक स्थिति' : 'Stock Status'}</th>
                <th className="py-3 px-4 text-right">{settings.language === 'hi' ? 'कार्रवाई (Actions)' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const profitPerPc = p.rate - (p.costPrice || 0);
                const isOutOfStock = p.stock <= 0;
                const minLimit = p.minimum_stock ?? p.minStock ?? 0;
                const isLowStock = p.stock <= minLimit && !isOutOfStock;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                      {p.barcode && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          SKU: {p.barcode}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-slate-600">{p.category}</span>
                    </td>

                    <td className="py-3 px-3 text-right tabular-nums">
                      <div className="font-semibold text-slate-900">₹{p.rate}</div>
                      <div className="text-[11px] text-slate-400">लागत: ₹{p.costPrice || '-'}</div>
                    </td>

                    <td className="py-3 px-3 text-right tabular-nums">
                      <span className="font-medium text-emerald-600">
                        +₹{profitPerPc}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-bold text-sm tabular-nums text-slate-800">
                          {p.stock}
                        </span>
                        <span className="text-[11px] text-slate-500">{p.unit}</span>
                      </div>
                      <div className="mt-0.5">
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            खत्म (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            कम (अलर्ट &le; {p.minStock})
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            उपलब्ध
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Quick +1 / +5 restock */}
                        <button
                          onClick={() => handleQuickAddStock(p.id, 1)}
                          title="+1 Stock"
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition-colors"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleQuickAddStock(p.id, 5)}
                          title="+5 Stock"
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition-colors"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => onOpenEditModal(p)}
                          title="Edit"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">
                      {settings.language === 'hi' ? 'कोई सामान नहीं मिला।' : 'No products found.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
