import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Share2,
  Copy,
  CheckCircle,
  ExternalLink,
  Lock,
  X,
  Smartphone,
  ShieldCheck,
  Send,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { ShopSettings } from '../types/erp';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  onOpenChangePin?: () => void;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  settings,
  onOpenChangePin,
  onShowToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const isHi = settings.language === 'hi';
  const ownerPin = settings.security?.pin || '1234';

  // Compute live share URL - always ensure the public shared link is copied
  const PUBLIC_APP_URL = 'https://ais-pre-c4thstpjkud4lxqd2fkm26-584270155073.asia-east1.run.app';
  const shareUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')
    ? `${window.location.origin}${window.location.pathname}`
    : PUBLIC_APP_URL;

  useEffect(() => {
    if (!isOpen) return;

    if (qrCanvasRef.current) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        shareUrl,
        {
          width: 140,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error('Error rendering QR in modal:', err);
        }
      );
    }
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      onShowToast('success', isHi ? 'लिंक कॉपी हो गया!' : 'Link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      onShowToast('error', isHi ? 'कॉपी करने में विफल' : 'Failed to copy');
    }
  };

  const handleCopyPin = async () => {
    try {
      await navigator.clipboard.writeText(ownerPin);
      setCopiedPin(true);
      onShowToast('success', isHi ? `पिन (${ownerPin}) कॉपी हो गया!` : `PIN (${ownerPin}) copied!`);
      setTimeout(() => setCopiedPin(false), 2500);
    } catch {
      onShowToast('error', isHi ? 'कॉपी करने में विफल' : 'Failed to copy');
    }
  };

  const handleWhatsAppShare = () => {
    const text = isHi
      ? `🏪 *${settings.shopName || 'Mobile Trade Hub ERP'}*\n\n📱 दुकान का बिलिंग व इन्वेंटरी लिंक:\n${shareUrl}\n\n🔐 *अनलॉक पासवर्ड / PIN:* ${ownerPin}\n(नोट: आपके द्वारा पासवर्ड दर्ज करने के बाद ही ऐप खुलेगा।)`
      : `🏪 *${settings.shopName || 'Mobile Trade Hub ERP'}*\n\n📱 Shop Billing & Inventory Link:\n${shareUrl}\n\n🔐 *Unlock Password / PIN:* ${ownerPin}\n(Note: App will unlock only after entering this PIN.)`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/30 border border-blue-400/40 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {isHi ? 'दुकान का लिंक व पासवर्ड शेयर करें' : 'Share App Link & Password'}
              </h3>
              <p className="text-[11px] text-blue-200">
                {isHi ? 'सुरक्षित 100% प्राइवेट लिंक' : 'Secure Private Shop Access'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Shop Card */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs">
                {settings.profilePhoto ? (
                  <img src={settings.profilePhoto} alt="Shop" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  (settings.shopName || 'M').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{settings.shopName || 'Mobile Trade Hub ERP'}</h4>
                <p className="text-xs text-slate-500">{settings.shopkeeperName || 'Krish Rajput'}</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {isHi ? 'सुरक्षित' : 'Protected'}
            </span>
          </div>

          {/* 1. Owner Direct Access Link */}
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200">
            <label className="block text-xs font-bold text-blue-950 mb-1">
              {isHi ? '👑 आपका पर्सनल एक्सेस लिंक (Owner Direct Link):' : '👑 Your Personal Access Link:'}
            </label>
            <p className="text-[11px] text-blue-800 mb-1.5">
              {isHi ? 'इस लिंक से आप अपने फोन या कंप्यूटर पर सीधे ऐप खोल सकते हैं:' : 'Use this link to access your ERP directly on any device:'}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="https://ais-dev-c4thstpjkud4lxqd2fkm26-584270155073.asia-east1.run.app"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-blue-300 rounded-lg text-slate-800 focus:outline-hidden select-all"
              />
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText('https://ais-dev-c4thstpjkud4lxqd2fkm26-584270155073.asia-east1.run.app');
                  onShowToast('success', isHi ? 'पर्सनल लिंक कॉपी हो गया!' : 'Personal link copied!');
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isHi ? 'कॉपी' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* 2. Public Link for Sharing */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isHi ? '👥 दूसरों को भेजने के लिए लिंक (Public Link):' : '👥 Public Link for Sharing:'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={PUBLIC_APP_URL}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs active:scale-95"
              >
                {copiedLink ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? (isHi ? 'कॉपी हुआ' : 'Copied') : (isHi ? 'कॉपी' : 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Password / PIN Section */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900">
                  {isHi ? 'सुरक्षा पासवर्ड (Unlock PIN)' : 'Security Unlock PIN'}
                </span>
              </div>
              {onOpenChangePin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenChangePin();
                  }}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  {isHi ? 'पिन बदलें →' : 'Change PIN →'}
                </button>
              )}
            </div>

            <p className="text-xs text-amber-800 mb-3 leading-relaxed">
              {isHi
                ? '⚠️ यह लिंक खोलने वाले व्यक्ति को आपका पासवर्ड देना होगा, तभी ऐप का डेटा अनलॉक होगा।'
                : '⚠️ The person opening the link must enter this PIN to unlock your shop data.'}
            </p>

            <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-lg border border-amber-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{isHi ? 'वर्तमान पासवर्ड:' : 'Current PIN:'}</span>
                <span className="font-mono text-base font-extrabold tracking-widest text-slate-900">
                  {ownerPin}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPin}
                className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors flex items-center gap-1"
              >
                {copiedPin ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPin ? (isHi ? 'कॉपी हुआ' : 'Copied') : (isHi ? 'पिन कॉपी' : 'Copy PIN')}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Direct Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{isHi ? 'व्हाट्सएप पर लिंक + पासवर्ड भेजें' : 'Share Link + PIN on WhatsApp'}</span>
          </button>

          {/* QR Code for in-person scanning */}
          <div className="flex flex-col items-center pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-slate-400" />
              {isHi ? 'या दूसरे फोन से QR स्कैन करके खोलें:' : 'Or scan QR from another phone to open:'}
            </span>
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
              <canvas ref={qrCanvasRef} className="w-[120px] h-[120px] block" />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            {isHi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
