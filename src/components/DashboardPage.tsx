import React, { useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  Receipt,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  PlusCircle,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  Package,
  Settings,
  QrCode,
  X,
} from 'lucide-react';
import { Product, Sale, Customer, ShopSettings, calculateStockStatus, AppTab } from '../types/erp';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface DashboardPageProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  settings: ShopSettings;
  onNavigateTab: (tab: AppTab) => void;
  onOpenReceipt: (sale: Sale) => void;
  onOpenAddProductModal: () => void;
  onOpenEditProductModal: (product: Product) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  products,
  sales,
  customers,
  settings,
  onNavigateTab,
  onOpenReceipt,
  onOpenAddProductModal,
  onOpenEditProductModal,
}) => {
  // Real-time calculations
  const dashboardStats = useMemo(() => {
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const stock = Math.max(0, p.stock || 0);
      const min = Math.max(0, p.minimum_stock ?? 0);
      totalStockUnits += stock;
      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= min) {
        lowStockCount++;
      }
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todaySales = sales.filter((s) => s.timestamp >= startOfToday);
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);

    const totalUdhar = customers.reduce((sum, c) => sum + Math.max(0, c.totalUdhar), 0);
    const pendingCustomersCount = customers.filter((c) => c.totalUdhar > 0).length;

    return {
      totalProducts: products.length,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
      todaySalesCount: todaySales.length,
      todayRevenue,
      totalUdhar,
      pendingCustomersCount,
    };
  }, [products, sales, customers]);

  // Low stock products list (top 4 needing attention)
  const lowStockItems = useMemo(() => {
    return products
      .filter((p) => {
        const stock = Math.max(0, p.stock || 0);
        const min = Math.max(0, p.minimum_stock ?? 0);
        return stock <= min;
      })
      .slice(0, 5);
  }, [products]);

  // Recent 5 sales
  const recentSales = useMemo(() => {
    return [...sales].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [sales]);

  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    return localStorage.getItem('mth_hide_dashboard_banner') === 'true';
  });

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    localStorage.setItem('mth_hide_dashboard_banner', 'true');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mobile Trade Hub ERP</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome to {settings.shopName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real-time stock monitoring, automated status tracking, quick billing, and customer Khata.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('billing')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <Receipt className="w-4 h-4" />
            <span>New Bill</span>
          </button>
          <button
            onClick={onOpenAddProductModal}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Quick Setup / Settings & UPI Banner (Dismissible with [X] button) */}
      {!isBannerDismissed && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs relative">
          <div className="flex items-center gap-3 pr-8 sm:pr-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>{settings.language === 'hi' ? 'दुकान का नाम, प्रोफ़ाइल फ़ोटो व पेमेंट QR कोड' : 'Shop Profile & Payment QR Code'}</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                  {settings.language === 'hi' ? 'सेटिंग्स' : 'Settings'}
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {settings.language === 'hi'
                  ? `दुकान का नाम: ${settings.shopName || 'Mobile Trade Hub'} · UPI ID: ${settings.upiId || 'सेट नहीं'}`
                  : `Shop Name: ${settings.shopName || 'Mobile Trade Hub'} · UPI ID: ${settings.upiId || 'Not configured'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => onNavigateTab('settings')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{settings.language === 'hi' ? 'सेटिंग्स व QR कोड बदलें' : 'Configure Settings & QR'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDismissBanner}
              title={settings.language === 'hi' ? 'यह बैनर हटाएं' : 'Dismiss this banner'}
              className="p-2 hover:bg-blue-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Products & Inventory */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Inventory Items</span>
            <Boxes className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {dashboardStats.totalProducts}
            </span>
            <span className="text-xs text-slate-400 font-medium">SKUs</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{dashboardStats.totalStockUnits} total units in hand</span>
            <ArrowRight className="w-3 h-3 text-blue-600" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className={`rounded-2xl p-4 border shadow-sm cursor-pointer transition-all group ${
            dashboardStats.lowStockCount > 0 || dashboardStats.outOfStockCount > 0
              ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 tabular-nums">
              {dashboardStats.lowStockCount + dashboardStats.outOfStockCount}
            </span>
            <span className="text-xs text-amber-600 font-medium">items</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-amber-700">
            <span>{dashboardStats.outOfStockCount} out of stock</span>
            <ArrowRight className="w-3 h-3 text-amber-700" />
          </div>
        </div>

        {/* Today's Sales */}
        <div
          onClick={() => onNavigateTab('sales')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Today's Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {formatCurrency(dashboardStats.todayRevenue)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{dashboardStats.todaySalesCount} invoices cut today</span>
            <ArrowRight className="w-3 h-3 text-emerald-600" />
          </div>
        </div>

        {/* Pending Udhar / Khata */}
        <div
          onClick={() => onNavigateTab('parties')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Khata Udhar</span>
            <Users className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 tabular-nums">
              {formatCurrency(dashboardStats.totalUdhar)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{dashboardStats.pendingCustomersCount} customers have dues</span>
            <ArrowRight className="w-3 h-3 text-rose-600" />
          </div>
        </div>
      </div>

      {/* Grid: Low Stock Alert Watchlist & Recent Sales Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Low Stock Items List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Stock Attention List
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 divide-y divide-slate-100">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => {
                const isOutOfStock = item.stock <= 0;
                return (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                          {item.name}
                        </h4>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {item.sku}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Category: {item.category} · Bin: {item.bin || 'A-01'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs sm:text-sm tabular-nums">
                        {isOutOfStock ? (
                          <span className="text-rose-600 font-bold">0 units left</span>
                        ) : (
                          <span className="text-amber-600 font-bold">{item.stock} left</span>
                        )}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Min limit: {item.minimum_stock ?? 0}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenEditProductModal(item)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shrink-0"
                    >
                      Update
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-slate-600">All products are healthy!</p>
                <p className="text-[11px] text-slate-400">No products are below minimum stock limits.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Sales Invoices (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Recent Invoices
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('sales')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Sales History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 divide-y divide-slate-100">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        #{sale.billNo}
                      </span>
                      <span className="text-slate-400 text-xs">·</span>
                      <span className="text-xs text-slate-700 truncate font-medium">
                        {sale.customerName || 'Cash Customer'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {formatDateTime(sale.timestamp)} · {sale.paymentMode}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 tabular-nums block">
                      {formatCurrency(sale.grandTotal)}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenReceipt(sale)}
                    title="View Receipt"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-slate-600">No invoices yet.</p>
                <p className="text-[11px] text-slate-400">Create your first sale in the New Bill section.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
