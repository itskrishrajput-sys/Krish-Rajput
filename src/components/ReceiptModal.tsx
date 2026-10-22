import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, Share2, X, CheckCircle, ArrowDownToLine } from 'lucide-react';
import { Sale, ShopSettings } from '../types/erp';
import { formatCurrency, formatDateTime, generateBillWhatsAppText, generateUpiUrl } from '../utils/formatters';

interface ReceiptModalProps {
  sale: Sale | null;
  settings: ShopSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, settings, onClose }) => {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sale && qrCanvasRef.current && settings.upiId) {
      const upiUrl = generateUpiUrl(settings.upiId, settings.shopName, sale.grandTotal, sale.billNo);
      QRCode.toCanvas(qrCanvasRef.current, upiUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).catch(() => {
        // Fallback gracefully
      });
    }
  }, [sale, settings]);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = generateBillWhatsAppText(sale, settings);
    const targetUrl = sale.customerPhone
      ? `https://wa.me/91${sale.customerPhone.replace(/\D/g, '')}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(targetUrl, '_blank');
  };

  const handleCopySummary = () => {
    const text = decodeURIComponent(generateBillWhatsAppText(sale, settings));
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header (No print) */}
        <div className="no-print px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              {settings.language === 'hi' ? 'बिल रसीद / पक्की पर्ची' : 'Invoice Receipt'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area */}
        <div id="printable-receipt-area" className="p-6 overflow-y-auto flex-1 font-mono text-slate-800 bg-white">
          
          {/* Shop Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            {settings.profilePhoto && (
              <img
                src={settings.profilePhoto}
                alt={settings.shopName}
                className="w-12 h-12 object-contain mx-auto mb-1.5 rounded-full border border-slate-200"
              />
            )}
            <h2 className="text-lg font-bold font-sans tracking-tight text-slate-900 uppercase">
              {settings.shopName}
            </h2>
            {settings.shopkeeperName && (
              <p className="text-xs text-slate-500 font-sans">मालिक: {settings.shopkeeperName}</p>
            )}
            {settings.address && (
              <p className="text-xs text-slate-600 mt-0.5 font-sans">{settings.address}</p>
            )}
            {settings.phone && (
              <p className="text-xs text-slate-600 font-sans">फोन: +91 {settings.phone}</p>
            )}
            {settings.gstin && (
              <p className="text-[11px] text-slate-500 font-sans">GSTIN: {settings.gstin}</p>
            )}
          </div>

          {/* Bill Info Meta */}
          <div className="py-2.5 border-b border-dashed border-slate-300 text-xs flex justify-between font-sans">
            <div>
              <p><span className="text-slate-500">बिल सं.:</span> <strong className="font-mono">#{sale.billNo}</strong></p>
              {sale.customerName && (
                <p><span className="text-slate-500">ग्राहक:</span> {sale.customerName}</p>
              )}
              {sale.customerPhone && (
                <p><span className="text-slate-500">मो.:</span> {sale.customerPhone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-slate-600">{formatDateTime(sale.timestamp)}</p>
              <p className="mt-0.5">
                <span className="text-slate-500">मोड:</span>{' '}
                <strong className={sale.paymentMode === 'Udhar' ? 'text-amber-700 font-bold' : 'text-slate-800'}>
                  {sale.paymentMode}
                </strong>
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-xs my-3 border-collapse">
            <thead>
              <tr className="border-b border-slate-400 font-sans text-slate-600 text-left">
                <th className="py-1">सामान (Item)</th>
                <th className="py-1 text-center">मात्रा</th>
                <th className="py-1 text-right">रेट</th>
                <th className="py-1 text-right">रकम</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
                <tr key={idx} className="py-1">
                  <td className="py-1.5 font-sans pr-2 font-medium">
                    {item.name}
                  </td>
                  <td className="py-1.5 text-center tabular-nums text-slate-600">
                    {item.qty} {item.unit || ''}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-600">
                    ₹{item.rate}
                  </td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">
                    ₹{item.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculation Breakdown */}
          <div className="border-t border-dashed border-slate-300 pt-2 text-xs space-y-1 font-sans">
            <div className="flex justify-between text-slate-600">
              <span>उप-कुल (Subtotal):</span>
              <span className="tabular-nums">₹{sale.subtotal}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>छूट (Discount):</span>
                <span className="tabular-nums">-₹{sale.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-1 border-t border-slate-300 text-slate-900">
              <span>कुल रकम (Grand Total):</span>
              <span className="tabular-nums">{formatCurrency(sale.grandTotal)}</span>
            </div>

            {sale.paymentMode === 'Udhar' && (
              <div className="p-2 mt-2 bg-amber-50 border border-amber-200 rounded text-center text-amber-800 text-xs">
                ⚠️ यह बिल ग्राहक के <strong>उधार खाते</strong> में दर्ज है।
              </div>
            )}
          </div>

          {/* QR Code for UPI payment */}
          {(settings.qrCodeImage || settings.upiId) && (
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300 flex flex-col items-center justify-center">
              {settings.qrCodeImage ? (
                <img
                  src={settings.qrCodeImage}
                  alt="UPI Payment QR"
                  className="w-32 h-32 object-contain rounded border border-slate-200 p-1"
                />
              ) : (
                <canvas ref={qrCanvasRef} className="rounded border border-slate-200 p-1" />
              )}
              {settings.upiId && (
                <p className="text-[10px] text-slate-500 font-sans mt-1 text-center">
                  UPI से भुगतान हेतु स्कैन करें: <span className="font-semibold">{settings.upiId}</span>
                  {settings.upiPayeeName ? ` (${settings.upiPayeeName})` : ''}
                </p>
              )}
            </div>
          )}

          {/* Footer Note */}
          <div className="text-center mt-4 pt-3 border-t border-dashed border-slate-300 text-[11px] text-slate-500 font-sans">
            <p>{settings.receiptFooterNote || 'दुकान साथी से खरीदारी के लिए धन्यवाद! फिर पधारें।'}</p>
            <p className="text-[9px] text-slate-400 mt-1">Powered by दुकान साथी ERP</p>
          </div>

        </div>

        {/* Action Controls (No print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>{settings.language === 'hi' ? 'प्रिंट पर्ची / PDF' : 'Print / PDF'}</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" />
            <span>{settings.language === 'hi' ? 'WhatsApp भेजें' : 'Send WhatsApp'}</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="col-span-2 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>{copied ? '✅ टेक्स्ट कॉपी हो गया!' : 'बिल का टेक्स्ट कॉपी करें (Copy Text)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
