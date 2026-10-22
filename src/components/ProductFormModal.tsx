import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Check, AlertCircle } from 'lucide-react';
import { Product, calculateStockStatus } from '../types/erp';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<void> | void;
  editingProduct?: Product | null;
  existingProducts: Product[];
  categories: string[];
  language?: 'hi' | 'en';
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  existingProducts,
  categories,
  language = 'en',
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Accessories');
  const [customCategory, setCustomCategory] = useState('');
  const [stock, setStock] = useState<number | ''>(10);
  const [minimumStock, setMinimumStock] = useState<number | ''>(3);
  const [bin, setBin] = useState('A-01');
  const [rate, setRate] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [unit, setUnit] = useState('Pcs');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultCategories = [
    'Accessories',
    'Chargers',
    'Cables',
    'Audio',
    'Tempered Glass',
    'Mobile',
    'Batteries',
    'Other',
  ];

  const mergedCategories = Array.from(new Set([...defaultCategories, ...categories.filter((c) => c !== 'all')]));

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setSku(editingProduct.sku || '');
      setCategory(editingProduct.category || 'Accessories');
      setCustomCategory('');
      setStock(editingProduct.stock);
      setMinimumStock(editingProduct.minimum_stock ?? editingProduct.minStock ?? 0);
      setBin(editingProduct.bin || 'A-01');
      setRate(editingProduct.rate);
      setCostPrice(editingProduct.costPrice ?? Math.round(editingProduct.rate * 0.6));
      setUnit(editingProduct.unit || 'Pcs');
      setErrors({});
    } else {
      setName('');
      // Suggest automatic SKU prefix if none provided
      setSku('');
      setCategory('Accessories');
      setCustomCategory('');
      setStock(10);
      setMinimumStock(3);
      setBin('A-01');
      setRate('');
      setCostPrice('');
      setUnit('Pcs');
      setErrors({});
    }
    setIsSubmitting(false);
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const cleanName = name.trim();
    if (!cleanName) {
      errs.name = 'Product Name is required.';
    }

    const cleanSku = sku.trim().toUpperCase();
    if (!cleanSku) {
      errs.sku = 'SKU is required.';
    } else {
      // Check SKU uniqueness (exclude the current item when editing)
      const duplicate = existingProducts.find(
        (p) =>
          p.sku.toUpperCase() === cleanSku &&
          (!editingProduct || p.id !== editingProduct.id)
      );
      if (duplicate) {
        errs.sku = `SKU "${cleanSku}" is already used by "${duplicate.name}". Please use a unique SKU.`;
      }
    }

    const finalCat = category === '__custom__' ? customCategory.trim() : category.trim();
    if (!finalCat) {
      errs.category = 'Category is required.';
    }

    if (stock === '' || Number(stock) < 0) {
      errs.stock = 'Stock must be 0 or a positive number.';
    }

    if (minimumStock === '' || Number(minimumStock) < 0) {
      errs.minimumStock = 'Minimum stock must be 0 or a positive number.';
    }

    if (rate === '' || Number(rate) < 0) {
      errs.rate = 'Selling rate must be 0 or a positive number.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanName = name.trim();
      const cleanSku = sku.trim().toUpperCase();
      const finalCategory = category === '__custom__' ? (customCategory.trim() || 'Other') : category;
      const numStock = Math.max(0, Number(stock) || 0);
      const numMinStock = Math.max(0, Number(minimumStock) || 0);
      const numRate = Math.max(0, Number(rate) || 0);
      const numCost = costPrice !== '' ? Math.max(0, Number(costPrice)) : Math.round(numRate * 0.6);
      const calculatedStatus = calculateStockStatus(numStock, numMinStock);

      const productData: Product = {
        id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
        name: cleanName,
        sku: cleanSku,
        category: finalCategory,
        stock: numStock,
        minimum_stock: numMinStock,
        minStock: numMinStock,
        bin: bin.trim() || 'A-01',
        rate: numRate,
        costPrice: numCost,
        unit: unit.trim() || 'Pcs',
        status: calculatedStatus,
        barcode: cleanSku,
        created_at: editingProduct?.created_at || Date.now(),
        updated_at: Date.now(),
      };

      await onSave(productData);
      onClose();
    } catch {
      setErrors((prev) => ({ ...prev, form: 'Failed to save product. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {editingProduct ? 'Update product details and stock thresholds' : 'Add new item to inventory with SKU & location'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - scrollable on mobile */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: '' }));
              }}
              placeholder="e.g. Fast Charger 25W, Type-C Cable"
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all ${
                errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* SKU & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value.toUpperCase());
                  if (errors.sku) setErrors((p) => ({ ...p, sku: '' }));
                }}
                placeholder="e.g. CHG-25W-01"
                className={`w-full px-3 py-2 text-sm font-mono border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white uppercase ${
                  errors.sku ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.sku && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.sku}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors((p) => ({ ...p, category: '' }));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {mergedCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">+ Add New Category</option>
              </select>
            </div>
          </div>

          {category === '__custom__' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Smart Watches, Audio Adapters"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          )}

          {/* Opening Stock & Minimum Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                  if (errors.stock) setErrors((p) => ({ ...p, stock: '' }));
                }}
                placeholder="10"
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white tabular-nums ${
                  errors.stock ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.stock && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.stock}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={minimumStock}
                onChange={(e) => {
                  setMinimumStock(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                  if (errors.minimumStock) setErrors((p) => ({ ...p, minimumStock: '' }));
                }}
                placeholder="3"
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white tabular-nums ${
                  errors.minimumStock ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.minimumStock && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.minimumStock}</p>
              )}
            </div>
          </div>

          {/* Bin / Location & Selling Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bin / Location
              </label>
              <input
                type="text"
                value={bin}
                onChange={(e) => setBin(e.target.value)}
                placeholder="e.g. A-01, Rack-2"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Rate (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={rate}
                onChange={(e) => {
                  setRate(e.target.value === '' ? '' : parseFloat(e.target.value));
                  if (errors.rate) setErrors((p) => ({ ...p, rate: '' }));
                }}
                placeholder="₹ 500"
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white tabular-nums ${
                  errors.rate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.rate && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.rate}</p>
              )}
            </div>
          </div>

          {/* Optional Cost Price & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cost / Purchase Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="e.g. ₹ 320"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Pcs">Pcs (Pieces)</option>
                <option value="Box">Box</option>
                <option value="Packet">Packet</option>
                <option value="Set">Set</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span>Saving Product...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Product</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
