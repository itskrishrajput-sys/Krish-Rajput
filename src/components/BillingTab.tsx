import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  QrCode,
  UserCheck,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  Barcode,
  MapPin,
  AlertCircle,
  Pencil,
  Check,
  Tags,
  Undo2,
} from 'lucide-react';
import { Product, SaleItem, Sale, PaymentMode, Customer, ShopSettings, calculateStockStatus } from '../types/erp';
import { formatCurrency, generateUpiUrl } from '../utils/formatters';
import { announcePayment } from '../utils/audio';
import { saveSaleToCloud, saveCustomerToCloud } from '../firebase/firestoreService';
import QRCode from 'qrcode';

interface BillingTabProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  settings: ShopSettings;
  onOpenReceipt: (sale: Sale) => void;
  getNextBillNo: () => string;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const BillingTab: React.FC<BillingTabProps> = ({
  products,
  setProducts,
  customers,
  setCustomers,
  sales,
  setSales,
  settings,
  onOpenReceipt,
  getNextBillNo,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');
  const [editingRateItemId, setEditingRateItemId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle direct Barcode / SKU scan submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.toLowerCase().trim();
    if (!q) return;

    // Check exact SKU or barcode match first
    const found = products.find(
      (p) =>
        (p.sku && p.sku.toLowerCase() === q) ||
        (p.barcode && p.barcode.toLowerCase() === q) ||
        p.name.toLowerCase() === q
    );

    if (found) {
      addToCart(found);
      setSearchQuery('');
    } else if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0]);
      setSearchQuery('');
    } else {
      onShowToast('info', `No unique match for "${searchQuery}". Please select from list.`);
    }
  };

  const addToCart = (product: Product) => {
    // 1. Check stock existence
    const liveProduct = products.find((p) => p.id === product.id);
    if (!liveProduct || liveProduct.stock <= 0) {
      onShowToast('error', `"${product.name}" is currently Out of Stock.`);
      return;
    }

    const existingInCart = cartItems.find((item) => item.productId === product.id);
    const currentCartQty = existingInCart ? existingInCart.qty : 0;

    // 2. Prevent adding if requested exceeds stock
    if (currentCartQty + 1 > liveProduct.stock) {
      onShowToast('error', `Cannot add more. Available stock for "${product.name}" is only ${liveProduct.stock} ${liveProduct.unit || 'units'}.`);
      return;
    }

    setCartItems((prev) => {
      if (existingInCart) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, qty: item.qty + 1, amount: (item.qty + 1) * item.rate }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            qty: 1,
            rate: product.rate,
            originalRate: product.rate,
            costPrice: product.costPrice || Math.round(product.rate * 0.6),
            unit: product.unit || 'Pcs',
            amount: product.rate,
          },
        ];
      }
    });

    onShowToast('success', `Added "${product.name}" to bill.`);
  };

  // Override rate for custom bargaining / discount
  const updateItemRate = (productId: string, newRate: number) => {
    const validRate = Math.max(0, isNaN(newRate) ? 0 : Math.round(newRate * 100) / 100);
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            rate: validRate,
            amount: Math.round(item.qty * validRate * 100) / 100,
          };
        }
        return item;
      })
    );
  };

  // Quick delta adjustments (+₹5, -₹5, +₹10, -₹10)
  const adjustItemRateDelta = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const updatedRate = Math.max(0, Math.round((item.rate + delta) * 100) / 100);
          return {
            ...item,
            rate: updatedRate,
            amount: Math.round(item.qty * updatedRate * 100) / 100,
          };
        }
        return item;
      })
    );
  };

  // Reset rate back to base catalog price
  const resetItemRate = (productId: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const original = item.originalRate ?? item.rate;
          return {
            ...item,
            rate: original,
            amount: Math.round(item.qty * original * 100) / 100,
          };
        }
        return item;
      })
    );
  };

  const updateItemQty = (productId: string, delta: number) => {
    const liveProduct = products.find((p) => p.id === productId);
    const existing = cartItems.find((i) => i.productId === productId);

    if (!existing) return;

    if (delta > 0) {
      if (liveProduct && existing.qty + delta > liveProduct.stock) {
        onShowToast('warning', `Stock limit reached: only ${liveProduct.stock} ${liveProduct.unit || 'units'} available for "${existing.name}".`);
        return;
      }
    }

    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty, amount: newQty * item.rate } : null;
          }
          return item;
        })
        .filter(Boolean) as SaleItem[];
    });
  };

  const removeItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    if (cartItems.length > 0) {
      setCartItems([]);
      setDiscountAmount('');
      setCustomerName('');
      setCustomerPhone('');
      onShowToast('info', 'Active bill cleared.');
    }
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.amount, 0);
  }, [cartItems]);

  const discountVal = Math.max(0, Number(discountAmount) || 0);
  const grandTotal = Math.max(0, subtotal - discountVal);

  // Generate UPI QR code for preview
  const handleOpenUpiPreview = async () => {
    if (grandTotal <= 0) return;
    if (settings.qrCodeImage) {
      setUpiQrDataUrl(settings.qrCodeImage);
      setShowUpiModal(true);
      return;
    }
    try {
      const upiUrl = generateUpiUrl(settings.upiId || 'shop@upi', settings.shopName, grandTotal, 'QUICK');
      const dataUrl = await QRCode.toDataURL(upiUrl, {
        width: 240,
        margin: 1,
      });
      setUpiQrDataUrl(dataUrl);
      setShowUpiModal(true);
    } catch {
      setShowUpiModal(true);
    }
  };

  // Select customer from Khata
  const handleSelectExistingCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    onShowToast('info', `Selected party: ${c.name}`);
  };

  // Complete Sale with strict stock safety
  const handleCompleteSale = () => {
    if (cartItems.length === 0) {
      onShowToast('warning', 'Please add at least 1 product to the bill.');
      return;
    }

    if (paymentMode === 'Udhar' && !customerName.trim()) {
      onShowToast('error', 'Customer name is required for Udhar (Credit) sales.');
      return;
    }

    // STRICT STOCK VERIFICATION: Check available stock for every line item
    for (const item of cartItems) {
      const productInDb = products.find((p) => p.id === item.productId);
      if (!productInDb) {
        onShowToast('error', `Product "${item.name}" no longer exists in inventory.`);
        return;
      }
      if (item.qty > productInDb.stock) {
        onShowToast(
          'error',
          `Insufficient stock for "${item.name}". Requested: ${item.qty}, Available: ${productInDb.stock}. Sale rejected.`
        );
        return;
      }
    }

    const billNo = getNextBillNo();
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      billNo,
      timestamp: Date.now(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: [...cartItems],
      subtotal,
      discountAmount: discountVal,
      taxAmount: 0,
      grandTotal,
      paymentMode,
      paidAmount: paymentMode === 'Udhar' ? 0 : grandTotal,
      dueAmount: paymentMode === 'Udhar' ? grandTotal : 0,
    };

    // 1. Authoritative Stock Deduction (Never below 0) & Recalculate status
    const nextProducts = products.map((prod) => {
      const cartItem = cartItems.find((ci) => ci.productId === prod.id);
      if (cartItem) {
        const newStock = Math.max(0, prod.stock - cartItem.qty);
        const newStatus = calculateStockStatus(newStock, prod.minimum_stock ?? 0);
        return {
          ...prod,
          stock: newStock,
          status: newStatus,
          updated_at: Date.now(),
        };
      }
      return prod;
    });

    setProducts(nextProducts);

    // Save to Firestore Cloud immediately
    saveSaleToCloud(newSale, nextProducts).catch(() => {});

    // 2. If Udhar, record in customer Khata ledger
    if (paymentMode === 'Udhar') {
      setCustomers((prev) => {
        const existingCust = prev.find(
          (c) =>
            (customerPhone && c.phone === customerPhone.trim()) ||
            c.name.toLowerCase() === customerName.toLowerCase().trim()
        );

        if (existingCust) {
          return prev.map((c) =>
            c.id === existingCust.id
              ? {
                  ...c,
                  totalUdhar: c.totalUdhar + grandTotal,
                  updatedAt: Date.now(),
                  history: [
                    {
                      id: `h-${Date.now()}`,
                      timestamp: Date.now(),
                      type: 'DEBIT_UDHAR',
                      amount: grandTotal,
                      billId: newSale.id,
                      note: `Bill #${billNo} on credit`,
                    },
                    ...c.history,
                  ],
                }
              : c
          );
        } else {
          const newCust: Customer = {
            id: `c-${Date.now()}`,
            name: customerName.trim(),
            phone: customerPhone.trim(),
            totalUdhar: grandTotal,
            updatedAt: Date.now(),
            history: [
              {
                id: `h-${Date.now()}`,
                timestamp: Date.now(),
                type: 'DEBIT_UDHAR',
                amount: grandTotal,
                billId: newSale.id,
                note: `Bill #${billNo} on credit`,
              },
            ],
          };
          return [newCust, ...prev];
        }
      });
    }

    // 3. Save to Sales history
    setSales((prev) => [newSale, ...prev]);

    // 4. Soundbox announcement if enabled
    if (settings.enableSoundbox && paymentMode !== 'Udhar') {
      announcePayment(grandTotal, settings.soundboxVoice || 'en');
    }

    // 5. Confetti celebration feedback
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
    });

    onShowToast('success', `Invoice #${billNo} created successfully! Stock updated.`);

    // 6. Reset bill cart
    setCartItems([]);
    setDiscountAmount('');
    setCustomerName('');
    setCustomerPhone('');

    // 7. Open Receipt modal
    onOpenReceipt(newSale);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Product Catalog & Fast Search (7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Search & Fast SKU / Barcode Scanner */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <form onSubmit={handleBarcodeSubmit} className="relative flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU or scan barcode..."
                className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-sans"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-xs"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>Enter</span>
              </button>
            </form>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-3 pt-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat === 'all' ? 'All Products' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock <= (product.minimum_stock ?? 0) && !isOutOfStock;
              const inCart = cartItems.find((item) => item.productId === product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`bg-white rounded-xl p-3 border transition-all text-left flex flex-col justify-between select-none relative group ${
                    isOutOfStock
                      ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                      : 'hover:border-blue-400 hover:shadow-md cursor-pointer border-slate-200 active:scale-[0.98]'
                  }`}
                >
                  {/* Cart quantity badge */}
                  {inCart && (
                    <span className="absolute top-2 right-2 bg-blue-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                      {inCart.qty}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span className="truncate">{product.category}</span>
                      <span className="font-mono text-slate-400 font-semibold">{product.sku}</span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug line-clamp-2 mt-1">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums">
                        ₹{product.rate}
                      </span>
                    </div>

                    <div className="text-right">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-600 block">Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold text-amber-600 block">
                          Stock: {product.stock}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 block">
                          Stock: {product.stock}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  No products matched your search.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try searching by SKU or name, or add new items from the Inventory page.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Bill Cart & Checkout (5 Cols on desktop) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col min-h-[500px]">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <span>Active Bill</span>
                {cartItems.length > 0 && (
                  <span className="text-xs text-slate-500 font-normal">
                    ({cartItems.length} items)
                  </span>
                )}
              </h3>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Customer / Party details */}
          <div className="py-3 border-b border-slate-200 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Party / Customer Name"
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone (10 digits)"
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Quick Party picks */}
            {customers.length > 0 && !customerName && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">Recent:</span>
                {customers.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectExistingCustomer(c)}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded whitespace-nowrap transition-colors flex items-center gap-1"
                  >
                    <UserCheck className="w-3 h-3 text-blue-500" />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto max-h-[280px] py-2 space-y-2 divide-y divide-slate-100">
            {cartItems.map((item) => {
              const hasCustomRate = item.originalRate !== undefined && item.rate !== item.originalRate;
              const isRateEditing = editingRateItemId === item.productId;

              return (
                <div key={item.productId} className="pt-2 first:pt-0 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-semibold text-slate-900 truncate">
                        {item.name}
                      </h5>
                      <div className="flex items-center flex-wrap gap-1 mt-0.5 text-[11px] text-slate-500">
                        <span className="font-mono text-slate-400 font-medium">{item.sku}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-800">₹{item.rate}</span>
                        {hasCustomRate && (
                          <span className="line-through text-slate-400 text-[10px]">
                            ₹{item.originalRate}
                          </span>
                        )}
                        {hasCustomRate && item.rate < (item.originalRate ?? item.rate) && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1 rounded font-medium">
                            -₹{((item.originalRate ?? item.rate) - item.rate).toFixed(0)} छूट
                          </span>
                        )}
                        {hasCustomRate && item.rate > (item.originalRate ?? item.rate) && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-1 rounded font-medium">
                            +₹{(item.rate - (item.originalRate ?? item.rate)).toFixed(0)}
                          </span>
                        )}
                        <span>x {item.qty} {item.unit}</span>

                        {/* Interactive Edit Price Button */}
                        <button
                          type="button"
                          onClick={() => setEditingRateItemId(isRateEditing ? null : item.productId)}
                          className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 transition-colors ${
                            isRateEditing
                              ? 'bg-blue-600 text-white shadow-xs'
                              : hasCustomRate
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700'
                          }`}
                          title="दाम कम या ज्यादा करें (Adjust Selling Price)"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                          <span>{isRateEditing ? 'बंद करें' : 'रेट बदलें'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                        <button
                          onClick={() => updateItemQty(item.productId, -1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:bg-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold tabular-nums text-slate-800">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateItemQty(item.productId, 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:bg-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="w-16 text-right text-xs font-bold text-slate-900 tabular-nums">
                        ₹{item.amount}
                      </span>

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Price Adjustment Drawer */}
                  {isRateEditing && (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 mt-0.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-blue-900 flex items-center gap-1">
                          <Tags className="w-3 h-3 text-blue-600" />
                          <span>बिक्री दर बदलें (Edit Sale Price)</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          मूल दर: <strong className="font-mono text-slate-700">₹{item.originalRate ?? item.rate}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.rate}
                            onChange={(e) => updateItemRate(item.productId, parseFloat(e.target.value) || 0)}
                            className="w-full pl-6 pr-2 py-1 text-xs font-bold font-mono bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {hasCustomRate && (
                          <button
                            type="button"
                            onClick={() => resetItemRate(item.productId)}
                            className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors"
                            title="मूल रेट वापस लाएं"
                          >
                            <Undo2 className="w-2.5 h-2.5" />
                            <span>रीसेट</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingRateItemId(null)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-2.5 h-2.5" />
                          <span>हो गया</span>
                        </button>
                      </div>

                      {/* Quick adjustment buttons */}
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                        <span className="text-[10px] text-slate-500 shrink-0">त्वरित:</span>
                        <button
                          type="button"
                          onClick={() => adjustItemRateDelta(item.productId, -10)}
                          className="px-1.5 py-0.5 bg-white border border-blue-200 text-rose-700 rounded text-[10px] font-semibold hover:bg-rose-50"
                        >
                          -₹10
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustItemRateDelta(item.productId, -5)}
                          className="px-1.5 py-0.5 bg-white border border-blue-200 text-rose-700 rounded text-[10px] font-semibold hover:bg-rose-50"
                        >
                          -₹5
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustItemRateDelta(item.productId, 5)}
                          className="px-1.5 py-0.5 bg-white border border-blue-200 text-emerald-700 rounded text-[10px] font-semibold hover:bg-emerald-50"
                        >
                          +₹5
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustItemRateDelta(item.productId, 10)}
                          className="px-1.5 py-0.5 bg-white border border-blue-200 text-emerald-700 rounded text-[10px] font-semibold hover:bg-emerald-50"
                        >
                          +₹10
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustItemRateDelta(item.productId, 50)}
                          className="px-1.5 py-0.5 bg-white border border-blue-200 text-blue-700 rounded text-[10px] font-semibold hover:bg-blue-50"
                        >
                          +₹50
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {cartItems.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs">
                  Bill tape is empty. Select products on the left or scan SKU.
                </p>
              </div>
            )}
          </div>

          {/* Pricing & Checkout Summary */}
          <div className="pt-3 border-t border-slate-200 space-y-2 mt-auto">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold tabular-nums">₹{subtotal}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Discount (₹)</span>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="₹ 0"
                className="w-20 px-2 py-0.5 text-right border border-slate-200 rounded text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-900">Grand Total</span>
              <span className="text-xl sm:text-2xl font-extrabold text-blue-600 tabular-nums">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            {/* Payment Mode Selector */}
            <div className="pt-1">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMode('Cash')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    paymentMode === 'Cash'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  💵 Cash
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    paymentMode === 'UPI'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  📱 UPI / QR
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('Udhar')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    paymentMode === 'Udhar'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  📒 Udhar (Credit)
                </button>
              </div>
            </div>

            {/* UPI QR trigger */}
            {paymentMode === 'UPI' && grandTotal > 0 && (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleOpenUpiPreview}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  <QrCode className="w-4 h-4" />
                  <span>
                    {settings.language === 'hi'
                      ? `₹${grandTotal} का पेमेंट QR कोड दिखाएं`
                      : `Show ₹${grandTotal} Dynamic QR Code`}
                  </span>
                </button>
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span className="font-mono truncate max-w-[170px]">
                    UPI: {settings.upiId || (settings.language === 'hi' ? 'सेट नहीं' : 'Not set')}
                  </span>
                  <span className="text-blue-600 font-medium">
                    {settings.language === 'hi' ? 'सेटिंग्स में बदलें' : 'Edit in Settings'}
                  </span>
                </div>
              </div>
            )}

            {/* Final Checkout Button */}
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={handleCompleteSale}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${
                cartItems.length === 0
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                Save Invoice & Print ({formatCurrency(grandTotal)})
              </span>
            </button>
          </div>

        </div>

      </div>

      {/* Dynamic UPI QR Popover */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-6 text-center shadow-2xl border border-slate-200">
            <h4 className="font-bold text-base text-slate-900">
              {settings.shopName}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan with GPay / PhonePe / Paytm
            </p>

            <div className="my-4 flex justify-center">
              {upiQrDataUrl && (
                <img
                  src={upiQrDataUrl}
                  alt="UPI QR Code"
                  className="w-48 h-48 border border-slate-200 rounded-xl p-2 shadow-inner"
                />
              )}
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-4">
              <span className="text-xs text-slate-500 block">Total Amount</span>
              <span className="text-xl font-bold text-blue-600 tabular-nums">
                {formatCurrency(grandTotal)}
              </span>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                {settings.upiId}
              </p>
            </div>

            <button
              onClick={() => setShowUpiModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
