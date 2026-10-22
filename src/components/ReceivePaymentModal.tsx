import React, { useState } from 'react';
import { X, HandCoins, Check } from 'lucide-react';
import { Customer } from '../types/erp';
import { formatCurrency } from '../utils/formatters';

interface ReceivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onRecordPayment: (customerId: string, amount: number, note: string) => void;
  language: 'hi' | 'en';
}

export const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onRecordPayment,
  language,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('नकद भुगतान जमा');

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmt = Number(amount);
    if (!finalAmt || finalAmt <= 0) return;

    onRecordPayment(customer.id, finalAmt, note.trim());
    setAmount('');
    onClose();
  };

  const handlePayFull = () => {
    setAmount(customer.totalUdhar);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {language === 'hi' ? 'उधार जमा करें (Receive Payment)' : 'Record Payment'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Balance Summary */}
        <div className="p-5 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{customer.name}</h4>
            <p className="text-xs text-slate-500">{customer.phone}</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 font-medium block">कुल बकाया उधार:</span>
            <span className="text-lg font-bold text-rose-600 tabular-nums">
              {formatCurrency(customer.totalUdhar)}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {language === 'hi' ? 'जमा की जाने वाली रकम (₹) *' : 'Amount Received (₹) *'}
              </label>
              {customer.totalUdhar > 0 && (
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  {language === 'hi' ? 'पूरा उधार चुकता करें' : 'Pay Full Balance'}
                </button>
              )}
            </div>
            <input
              type="number"
              min="1"
              max={customer.totalUdhar > 0 ? customer.totalUdhar * 2 : 100000}
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder={`₹ ${customer.totalUdhar}`}
              className="w-full px-3 py-2.5 text-base font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'hi' ? 'नोट / माध्यम' : 'Payment Note / Method'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. नकद प्राप्त, Google Pay, PhonePe"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'hi' ? 'खाते में जमा करें' : 'Submit Payment'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
