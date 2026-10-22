import React, { useState, useMemo } from 'react';
import {
  BookUser,
  Search,
  Plus,
  Send,
  HandCoins,
  History,
  ChevronDown,
  ChevronUp,
  UserPlus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Customer, ShopSettings } from '../types/erp';
import { formatCurrency, formatDateTime, generateKhataReminderWhatsAppText } from '../utils/formatters';

interface KhataTabProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  settings: ShopSettings;
  onOpenReceivePayment: (customer: Customer) => void;
}

export const KhataTab: React.FC<KhataTabProps> = ({
  customers,
  setCustomers,
  settings,
  onOpenReceivePayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustInitialUdhar, setNewCustInitialUdhar] = useState<number | ''>('');

  // Total Outstanding Udhar
  const totalOutstanding = useMemo(() => {
    return customers.reduce((sum, c) => sum + Math.max(0, c.totalUdhar), 0);
  }, [customers]);

  const activeUdharCount = useMemo(() => {
    return customers.filter((c) => c.totalUdhar > 0).length;
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery]);

  const handleSendReminder = (customer: Customer) => {
    if (!customer.phone) {
      alert(settings.language === 'hi' ? 'ग्राहक का मोबाइल नंबर दर्ज नहीं है!' : 'Customer phone is not recorded!');
      return;
    }
    const text = generateKhataReminderWhatsAppText(customer, settings);
    const cleanPhone = customer.phone.replace(/\D/g, '');
    const url = `https://wa.me/91${cleanPhone}?text=${text}`;
    window.open(url, '_blank');
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const initialAmt = Number(newCustInitialUdhar) || 0;
    const newCust: Customer = {
      id: `c-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim() || undefined,
      totalUdhar: initialAmt,
      updatedAt: Date.now(),
      history: initialAmt > 0
        ? [
            {
              id: `h-${Date.now()}`,
              timestamp: Date.now(),
              type: 'DEBIT_UDHAR',
              amount: initialAmt,
              note: 'पुराना बकाया उधार दर्ज किया गया',
            },
          ]
        : [],
    };

    setCustomers((prev) => [newCust, ...prev]);
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustInitialUdhar('');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      
      {/* Khata KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
            <span>{settings.language === 'hi' ? 'कुल बकाया उधारी' : 'Total Outstanding Udhar'}</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-600 tabular-nums">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{settings.language === 'hi' ? 'उधार वाले ग्राहक' : 'Customers with Due'}</span>
            <BookUser className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {activeUdharCount}
            </span>
            <span className="text-xs text-slate-400">
              / {customers.length} {settings.language === 'hi' ? 'कुल ग्राहक' : 'total'}
            </span>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>{settings.language === 'hi' ? 'चुकता खाते' : 'Fully Cleared Accounts'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 tabular-nums">
              {customers.length - activeUdharCount}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Add Customer Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              settings.language === 'hi'
                ? 'ग्राहक का नाम या फोन नंबर खोजें...'
                : 'Search customer name or phone...'
            }
            className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setShowAddCustomerModal(true)}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>{settings.language === 'hi' ? 'नया खाता ग्राहक जोड़ें' : 'Add New Customer'}</span>
        </button>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filteredCustomers.map((customer) => {
          const isExpanded = expandedCustomerId === customer.id;
          const hasDue = customer.totalUdhar > 0;

          return (
            <div
              key={customer.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
            >
              {/* Row Header */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">{customer.name}</h4>
                    {hasDue ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        बकायादार
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        हिसाब साफ
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                    {customer.phone && (
                      <span>📞 {customer.phone}</span>
                    )}
                    {customer.address && (
                      <span>📍 {customer.address}</span>
                    )}
                    <span>अंतिम लेनदेन: {formatDateTime(customer.updatedAt)}</span>
                  </div>
                </div>

                {/* Balance & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">बकाया उधार:</span>
                    <span
                      className={`text-lg sm:text-xl font-bold tabular-nums ${
                        hasDue ? 'text-rose-600' : 'text-slate-600'
                      }`}
                    >
                      {formatCurrency(customer.totalUdhar)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Receive Payment Button */}
                    <button
                      onClick={() => onOpenReceivePayment(customer)}
                      title="Receive Payment"
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <HandCoins className="w-3.5 h-3.5" />
                      <span>{settings.language === 'hi' ? 'जमा करें' : 'Pay'}</span>
                    </button>

                    {/* WhatsApp Reminder Button */}
                    {hasDue && (
                      <button
                        onClick={() => handleSendReminder(customer)}
                        title="Send WhatsApp Reminder"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}

                    {/* Expand History Toggle */}
                    <button
                      onClick={() => setExpandedCustomerId(isExpanded ? null : customer.id)}
                      title="View Ledger Statement"
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Ledger Statement */}
              {isExpanded && (
                <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>खाता विवरण (Transaction History)</span>
                    </h5>
                    <span className="text-xs text-slate-500">
                      कुल {customer.history?.length || 0} प्रविष्टियाँ
                    </span>
                  </div>

                  <div className="space-y-2">
                    {customer.history && customer.history.length > 0 ? (
                      customer.history.map((tx) => {
                        const isDebit = tx.type === 'DEBIT_UDHAR';
                        return (
                          <div
                            key={tx.id}
                            className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-semibold text-slate-900">
                                {tx.note || (isDebit ? 'उधार सामान' : 'जमा किया गया')}
                              </div>
                              <div className="text-slate-400 text-[11px] mt-0.5">
                                {formatDateTime(tx.timestamp)}
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`font-bold text-sm tabular-nums ${
                                  isDebit ? 'text-rose-600' : 'text-emerald-600'
                                }`}
                              >
                                {isDebit ? `+ ₹${tx.amount} (उधार)` : `- ₹${tx.amount} (जमा)`}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 py-3 text-center">
                        कोई पुराना लेनदेन दर्ज नहीं है।
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <BookUser className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">कोई ग्राहक नहीं मिला।</p>
            <p className="text-xs text-slate-400 mt-1">
              ऊपर 'नया खाता ग्राहक जोड़ें' बटन दबाकर नया उधार ग्राहक बनाएं।
            </p>
          </div>
        )}
      </div>

      {/* Add New Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>{settings.language === 'hi' ? 'नया खाता ग्राहक जोड़ें' : 'Add New Customer'}</span>
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ग्राहक का नाम *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. राजेश कुमार (दुकानदार)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  मोबाइल नंबर (WhatsApp तगादे हेतु)
                </label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 9811223344"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  पता / पहचान
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. गली नं. 2, मंदिर के सामने"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  शुरुआती पुराना बकाया (₹) यदि कोई हो
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCustInitialUdhar}
                  onChange={(e) => setNewCustInitialUdhar(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="₹ 0"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  ग्राहक जोड़ें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
