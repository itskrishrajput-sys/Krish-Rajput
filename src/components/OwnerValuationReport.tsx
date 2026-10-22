import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Lock,
  Unlock,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { Product, Sale, ShopSettings } from '../types/erp';
import { formatCurrency } from '../utils/formatters';

interface OwnerValuationReportProps {
  products: Product[];
  sales: Sale[];
  settings: ShopSettings;
}

export const OwnerValuationReport: React.FC<OwnerValuationReportProps> = ({
  products,
  sales,
  settings,
}) => {
  const isHi = settings.language === 'hi';
  const ownerPin = settings.security?.pin || '1234';

  const [enteredPin, setEnteredPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Verify PIN
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === ownerPin) {
      setIsUnlocked(true);
      setPinError('');
      setEnteredPin('');
    } else {
      setPinError(isHi ? 'गलत मालिक पिन! कृपया सही 4-अंकों का पिन दर्ज करें।' : 'Incorrect PIN. Please enter your 4-digit Owner PIN.');
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Overall Business Metrics
  const metrics = useMemo(() => {
    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let profitableProductsCount = 0;
    let lossProductsCount = 0;

    products.forEach((p) => {
      const stock = Math.max(0, p.stock || 0);
      const cost = Math.max(0, p.costPrice || 0);
      const rate = Math.max(0, p.rate || 0);

      totalStockUnits += stock;
      totalCostValuation += cost * stock;
      totalRetailValuation += rate * stock;

      const marginPerUnit = rate - cost;
      if (marginPerUnit > 0) profitableProductsCount++;
      else if (marginPerUnit < 0) lossProductsCount++;
    });

    const expectedGrossProfit = totalRetailValuation - totalCostValuation;
    const profitMarginPercent = totalCostValuation > 0 ? (expectedGrossProfit / totalCostValuation) * 100 : 0;

    // Realized Profit from completed sales
    let realizedRevenue = 0;
    let realizedCost = 0;
    sales.forEach((s) => {
      realizedRevenue += s.grandTotal || 0;
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach((it) => {
          realizedCost += (it.costPrice || 0) * (it.qty || 1);
        });
      }
    });
    const realizedProfit = realizedRevenue - realizedCost;

    return {
      totalProductsCount: products.length,
      totalStockUnits,
      totalCostValuation,
      totalRetailValuation,
      expectedGrossProfit,
      profitMarginPercent,
      profitableProductsCount,
      lossProductsCount,
      realizedRevenue,
      realizedCost,
      realizedProfit,
    };
  }, [products, sales]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <section aria-label="Owner Business Report" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>{isHi ? 'इन्वेंटरी मूल्यांकन व मुनाफ़ा/घाटा रिपोर्ट (Profit & Valuation)' : 'Inventory Valuation & Profit/Loss Report'}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {isHi ? '🔒 केवल मालिक हेतु' : '🔒 Owner Only'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHi
                ? 'दुकान में रखे सामान की कुल खरीद लागत, बिक्री मूल्य और कुल संभावित मुनाफ़ा देखें।'
                : 'Inspect item purchase costs, retail values, profit margins, and total inventory investment.'}
            </p>
          </div>
        </div>

        {isUnlocked && (
          <button
            type="button"
            onClick={() => setIsUnlocked(false)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>{isHi ? 'रिपोर्ट लॉक करें' : 'Lock Report'}</span>
          </button>
        )}
      </div>

      {/* Content: PIN Lock Gate OR Unlocked Reports */}
      {!isUnlocked ? (
        <div className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              {isHi ? 'मालिक सुरक्षा पिन आवश्यक है' : 'Owner PIN Required'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isHi
                ? 'व्यापार का वास्तविक मुनाफ़ा, खरीद मूल्य और इन्वेंटरी की कुल पूंजी देखने के लिए अपना 4-अंकों का पिन (डिफ़ॉल्ट: 1234) दर्ज करें।'
                : 'Enter your 4-digit Owner PIN (default: 1234) to reveal private purchase costs and profit margins.'}
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3 pt-2">
            <div>
              <input
                type="password"
                maxLength={4}
                required
                autoFocus
                value={enteredPin}
                onChange={(e) => {
                  setPinError('');
                  setEnteredPin(e.target.value.replace(/\D/g, ''));
                }}
                placeholder="• • • •"
                className="w-40 text-center tracking-[0.4em] text-xl font-bold font-mono py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              {pinError && (
                <p className="text-xs text-rose-600 font-medium mt-1.5">{pinError}</p>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {isHi ? 'रिपोर्ट खोलें (Unlock Report)' : 'Unlock Valuation Report'}
            </button>
          </form>
        </div>
      ) : (
        <div className="p-5 space-y-6">
          
          {/* Top 4 Business Valuation Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Total Cost Valuation (पूंजी / लागत) */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                {isHi ? 'कुल पूंजी / खरीद लागत' : 'Inventory Cost Value'}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">
                {formatCurrency(metrics.totalCostValuation)}
              </div>
              <p className="text-[11px] text-slate-500">
                {metrics.totalStockUnits} {isHi ? 'पीस स्टॉक में' : 'units in stock'}
              </p>
            </div>

            {/* Total Potential Retail Value */}
            <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-200 space-y-1">
              <span className="text-[11px] font-semibold text-blue-700 block">
                {isHi ? 'अनुमानित कुल बिक्री मूल्य' : 'Inventory Retail Value'}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-blue-900 tabular-nums">
                {formatCurrency(metrics.totalRetailValuation)}
              </div>
              <p className="text-[11px] text-blue-600">
                {isHi ? 'सभी सामान बिकने पर' : 'If all stock sells at rate'}
              </p>
            </div>

            {/* Expected Unrealized Profit (संभावित कुल मुनाफ़ा) */}
            <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-800 block">
                {isHi ? 'स्टॉक से संभावित कुल मुनाफ़ा' : 'Expected Stock Profit'}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 tabular-nums flex items-baseline gap-1">
                <span>{formatCurrency(metrics.expectedGrossProfit)}</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold">
                +{metrics.profitMarginPercent.toFixed(1)}% {isHi ? 'औसत मार्जिन' : 'gross margin'}
              </p>
            </div>

            {/* Realized Sales Profit */}
            <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 space-y-1">
              <span className="text-[11px] font-semibold text-amber-800 block">
                {isHi ? 'अब तक की बिक्री से असली मुनाफ़ा' : 'Realized Sales Profit'}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-900 tabular-nums">
                {formatCurrency(metrics.realizedProfit)}
              </div>
              <p className="text-[11px] text-amber-700">
                {formatCurrency(metrics.realizedRevenue)} {isHi ? 'कुल बिक्री से' : 'total sales done'}
              </p>
            </div>

          </div>

          {/* Filters & Product Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {isHi ? 'प्रत्येक सामान का खरीद मूल्य व मुनाफ़ा विवरण' : 'Item-by-Item Price & Profit Breakdown'}
                </h4>
                <p className="text-xs text-slate-500">
                  {filteredProducts.length} {isHi ? 'प्रोडक्ट्स उपलब्ध' : 'products found'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isHi ? 'प्रोडक्ट या SKU खोजें...' : 'Search items...'}
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-56 bg-white"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'all' ? (isHi ? 'सभी श्रेणियां' : 'All Categories') : c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold select-none">
                  <tr>
                    <th className="py-2.5 px-3">{isHi ? 'सामान का नाम' : 'Product'}</th>
                    <th className="py-2.5 px-3 text-right">{isHi ? 'खरीद मूल्य (Cost)' : 'Cost Price'}</th>
                    <th className="py-2.5 px-3 text-right">{isHi ? 'बिक्री रेट (Rate)' : 'Sale Rate'}</th>
                    <th className="py-2.5 px-3 text-right">{isHi ? 'मार्जिन (प्रति पीस)' : 'Unit Profit'}</th>
                    <th className="py-2.5 px-3 text-center">{isHi ? 'स्टॉक' : 'Stock'}</th>
                    <th className="py-2.5 px-3 text-right">{isHi ? 'कुल पूंजी (Cost)' : 'Total Cost'}</th>
                    <th className="py-2.5 px-3 text-right">{isHi ? 'कुल बिक्री (Sale)' : 'Total Sale'}</th>
                    <th className="py-2.5 px-3 text-right">{isHi ? 'कुल मुनाफ़ा' : 'Total Profit'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredProducts.map((p) => {
                    const cost = Math.max(0, p.costPrice || 0);
                    const rate = Math.max(0, p.rate || 0);
                    const stock = Math.max(0, p.stock || 0);
                    const unitProfit = rate - cost;
                    const totalCost = cost * stock;
                    const totalSale = rate * stock;
                    const totalProfit = unitProfit * stock;
                    const marginPercent = cost > 0 ? (unitProfit / cost) * 100 : 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block truncate max-w-[200px] sm:max-w-xs">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.sku || 'NO-SKU'} · {p.category || 'General'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700">
                          ₹{cost}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          ₹{rate}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          <span className={unitProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {unitProfit >= 0 ? `+₹${unitProfit}` : `-₹${Math.abs(unitProfit)}`}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            ({marginPercent.toFixed(0)}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-semibold text-slate-800 font-mono">
                            {stock} {p.unit || 'Pcs'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(totalCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-medium">
                          {formatCurrency(totalSale)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span className={totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                            {totalProfit >= 0 ? `+${formatCurrency(totalProfit)}` : formatCurrency(totalProfit)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        {isHi ? 'कोई सामान नहीं मिला।' : 'No products found matching filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </section>
  );
};
