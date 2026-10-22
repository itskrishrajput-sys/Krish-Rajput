import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Calendar,
  Eye,
  Trash2,
  Clock,
  Coins,
  CreditCard,
  BookOpen,
} from 'lucide-react';
import { Sale, ShopSettings } from '../types/erp';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface ReportsTabProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  settings: ShopSettings;
  onOpenReceipt: (sale: Sale) => void;
}

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

export const ReportsTab: React.FC<ReportsTabProps> = ({
  sales,
  setSales,
  settings,
  onOpenReceipt,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOfWeek = startOfToday - 6 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter((sale) => {
      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = sale.timestamp >= startOfToday;
      } else if (dateFilter === 'yesterday') {
        matchesDate = sale.timestamp >= startOfYesterday && sale.timestamp < startOfToday;
      } else if (dateFilter === 'week') {
        matchesDate = sale.timestamp >= startOfWeek;
      } else if (dateFilter === 'month') {
        matchesDate = sale.timestamp >= startOfMonth;
      }

      const matchesMode =
        selectedPaymentMode === 'all' || sale.paymentMode === selectedPaymentMode;

      return matchesDate && matchesMode;
    });
  }, [sales, dateFilter, selectedPaymentMode]);

  // Aggregate stats
  const analytics = useMemo(() => {
    let totalRevenue = 0;
    let totalEstimatedProfit = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let udharTotal = 0;

    filteredSales.forEach((s) => {
      totalRevenue += s.grandTotal;

      // Calculate profit: selling price - cost price
      const saleCost = s.items.reduce((acc, it) => acc + (it.costPrice || it.rate * 0.7) * it.qty, 0);
      const grossProfit = Math.max(0, s.grandTotal - saleCost);
      totalEstimatedProfit += grossProfit;

      if (s.paymentMode === 'Cash') cashTotal += s.grandTotal;
      else if (s.paymentMode === 'UPI') upiTotal += s.grandTotal;
      else if (s.paymentMode === 'Udhar') udharTotal += s.grandTotal;
    });

    return {
      billCount: filteredSales.length,
      totalRevenue,
      totalEstimatedProfit,
      cashTotal,
      upiTotal,
      udharTotal,
    };
  }, [filteredSales]);

  // Delete/void sale
  const handleDeleteSale = (saleId: string, billNo: string) => {
    if (
      confirm(
        settings.language === 'hi'
          ? `क्या आप बिल #${billNo} को रिकॉर्ड से हटाना चाहते हैं?`
          : `Delete invoice #${billNo}?`
      )
    ) {
      setSales((prev) => prev.filter((s) => s.id !== saleId));
    }
  };

  // Export Sales Report to CSV
  const handleExportCSV = () => {
    const headers = [
      'Bill No',
      'Date & Time',
      'Customer Name',
      'Customer Phone',
      'Items Count',
      'Items Detail',
      'Subtotal',
      'Discount',
      'Grand Total',
      'Payment Mode',
    ];

    const rows = filteredSales.map((s) => [
      `#${s.billNo}`,
      `"${formatDateTime(s.timestamp)}"`,
      `"${(s.customerName || '').replace(/"/g, '""')}"`,
      s.customerPhone || '',
      s.items.length,
      `"${s.items.map((i) => `${i.name} (x${i.qty})`).join('; ')}"`,
      s.subtotal,
      s.discountAmount,
      s.grandTotal,
      s.paymentMode,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dukaan_Sales_Report_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      
      {/* Time Horizon Segmented Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'today', labelHi: 'आज (Today)', labelEn: 'Today' },
              { id: 'yesterday', labelHi: 'कल (Yesterday)', labelEn: 'Yesterday' },
              { id: 'week', labelHi: 'इस हफ्ते (This Week)', labelEn: 'This Week' },
              { id: 'month', labelHi: 'इस महीने (This Month)', labelEn: 'This Month' },
              { id: 'all', labelHi: 'कुल (All Time)', labelEn: 'All Time' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                dateFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {settings.language === 'hi' ? tab.labelHi : tab.labelEn}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Payment filter */}
          <select
            value={selectedPaymentMode}
            onChange={(e) => setSelectedPaymentMode(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">{settings.language === 'hi' ? 'सभी भुगतान मोड' : 'All Modes'}</option>
            <option value="Cash">Cash (नकद)</option>
            <option value="UPI">UPI (ऑनलाइन)</option>
            <option value="Udhar">Udhar (उधार)</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{settings.language === 'hi' ? 'रिपोर्ट डाउनलोड' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Financial Analytics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{settings.language === 'hi' ? 'कुल बिक्री (Sales)' : 'Total Revenue'}</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(analytics.totalRevenue)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {analytics.billCount} {settings.language === 'hi' ? 'बिल कटे' : 'invoices generated'}
          </div>
        </div>

        <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>{settings.language === 'hi' ? 'अनुमानित मुनाफा' : 'Gross Profit'}</span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
              मार्जिन
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-700 tabular-nums">
              {formatCurrency(analytics.totalEstimatedProfit)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600">
            {analytics.totalRevenue > 0
              ? `${Math.round((analytics.totalEstimatedProfit / analytics.totalRevenue) * 100)}% मार्जिन`
              : '0%'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{settings.language === 'hi' ? 'नकद व UPI आमदनी' : 'Cash & UPI Total'}</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 space-y-0.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">💵 नकद (Cash):</span>
              <strong className="text-slate-900 tabular-nums">₹{analytics.cashTotal}</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">📱 UPI:</span>
              <strong className="text-slate-900 tabular-nums">₹{analytics.upiTotal}</strong>
            </div>
          </div>
        </div>

        <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>{settings.language === 'hi' ? 'उधार में बिका माल' : 'Credit / Udhar Sales'}</span>
            <BookOpen className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-700 tabular-nums">
              {formatCurrency(analytics.udharTotal)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-amber-600">
            उधार खाते में दर्ज
          </div>
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>
              {settings.language === 'hi' ? 'कटे हुए बिलों का रिकॉर्ड' : 'Invoice History'}
            </span>
          </h4>
          <span className="text-xs text-slate-500 font-medium">
            कुल: {filteredSales.length} {settings.language === 'hi' ? 'बिल' : 'bills'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">बिल सं. (Bill #)</th>
                <th className="py-3 px-3">समय व दिनांक</th>
                <th className="py-3 px-3">ग्राहक का नाम</th>
                <th className="py-3 px-3">सामान (Items)</th>
                <th className="py-3 px-3">भुगतान मोड</th>
                <th className="py-3 px-3 text-right">कुल रकम</th>
                <th className="py-3 px-4 text-right">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      #{sale.billNo}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {formatDateTime(sale.timestamp)}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">
                      {sale.customerName || 'सामान्य ग्राहक (Cash Customer)'}
                    </div>
                    {sale.customerPhone && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        {sale.customerPhone}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                    {sale.items.map((i) => `${i.name} (${i.qty})`).join(', ')}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        sale.paymentMode === 'Cash'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sale.paymentMode === 'UPI'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sale.paymentMode}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums text-sm">
                    {formatCurrency(sale.grandTotal)}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenReceipt(sale)}
                        title="View / Print Receipt"
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSale(sale.id, sale.billNo)}
                        title="Delete Bill"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">
                      {settings.language === 'hi' ? 'इस अवधि में कोई बिल नहीं मिला।' : 'No sales records found for this period.'}
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
