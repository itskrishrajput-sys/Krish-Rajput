import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Product } from '../types/erp';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  product: Product | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  language?: 'hi' | 'en';
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  product,
  onConfirm,
  onCancel,
  isDeleting = false,
  language = 'hi',
}) => {
  if (!isOpen || !product) return null;
  const isHi = language === 'hi';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="font-bold text-slate-900 text-base">
            {isHi ? 'प्रोडक्ट हटाने की पुष्टि करें' : 'Confirm Product Deletion'}
          </h3>

          <p className="text-xs text-slate-600 mt-2">
            {isHi ? (
              <>
                क्या आप वाकई <strong className="text-slate-900">{product.name}</strong> को इन्वेंटरी से हटाना चाहते हैं?
              </>
            ) : (
              <>
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">{product.name}</strong>?
              </>
            )}
          </p>

          <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>SKU:</span>
              <strong className="text-slate-800 font-mono">{product.sku}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{isHi ? 'मौजूदा स्टॉक:' : 'Current Stock:'}</span>
              <strong className="text-slate-800">{product.stock} {product.unit}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="w-full py-2.5 px-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
          >
            {isHi ? 'रद्द करें' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="w-full py-2.5 px-3 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          >
            {isDeleting ? (
              <span>{isHi ? 'हटाया जा रहा है...' : 'Deleting...'}</span>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isHi ? 'हटाएं (Delete)' : 'Delete'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
