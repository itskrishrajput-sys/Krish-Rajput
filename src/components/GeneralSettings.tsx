import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Store,
  Camera,
  Trash2,
  QrCode,
  Sparkles,
  Copy,
  CheckCircle,
  ExternalLink,
  Smartphone,
  CreditCard,
  User,
  MapPin,
  Phone,
  FileText,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { ShopSettings } from '../types/erp';
import { generateUpiUrl } from '../utils/formatters';

export interface GeneralSettingsProps {
  settings: ShopSettings;
  setSettings: React.Dispatch<React.SetStateAction<ShopSettings>>;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  settings,
  setSettings,
  onShowToast,
}) => {
  const isHi = settings.language === 'hi';

  const [formData, setFormData] = useState({
    shopName: settings.shopName || '',
    shopkeeperName: settings.shopkeeperName || '',
    phone: settings.phone || '',
    address: settings.address || '',
    gstin: settings.gstin || '',
    receiptFooterNote: settings.receiptFooterNote || '',
    profilePhoto: settings.profilePhoto || '',
    upiId: settings.upiId || '',
    upiPayeeName: settings.upiPayeeName || settings.shopkeeperName || settings.shopName || '',
    qrCodeImage: settings.qrCodeImage || '',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrInputRef = useRef<HTMLInputElement | null>(null);
  const upiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state if settings prop changes externally
  useEffect(() => {
    setFormData({
      shopName: settings.shopName || '',
      shopkeeperName: settings.shopkeeperName || '',
      phone: settings.phone || '',
      address: settings.address || '',
      gstin: settings.gstin || '',
      receiptFooterNote: settings.receiptFooterNote || '',
      profilePhoto: settings.profilePhoto || '',
      upiId: settings.upiId || '',
      upiPayeeName: settings.upiPayeeName || settings.shopkeeperName || settings.shopName || '',
      qrCodeImage: settings.qrCodeImage || '',
    });
  }, [settings]);

  // Generate live QR code on canvas whenever UPI ID or Payee Name changes
  useEffect(() => {
    if (upiCanvasRef.current && formData.upiId) {
      const upiUrl = generateUpiUrl(
        formData.upiId,
        formData.upiPayeeName || formData.shopName || 'Store'
      );
      QRCode.toCanvas(upiCanvasRef.current, upiUrl, {
        width: 170,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).catch((err) => {
        console.warn('QR Code generation notice:', err);
      });
    }
  }, [formData.upiId, formData.upiPayeeName, formData.shopName]);

  const handleFieldChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Image Upload and Automatic 240x240 Canvas Compression for crisp, lightweight persistence
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(isHi ? 'कृपया 5MB से छोटी फ़ोटो चुनें।' : 'Image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 240;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          handleFieldChange('profilePhoto', dataUrl);
          setSettings((prev) => ({ ...prev, profilePhoto: dataUrl }));
          if (onShowToast) {
            onShowToast('success', isHi ? 'प्रोफ़ाइल फ़ोटो अपडेट हो गई!' : 'Profile photo updated!');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Preset Emoji Avatar Generator
  const handleSelectPresetAvatar = (emoji: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(80, 80, 75, 0, 2 * Math.PI);
      ctx.fill();
      ctx.font = '76px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 80, 88);
      const dataUrl = canvas.toDataURL('image/png');
      handleFieldChange('profilePhoto', dataUrl);
      setSettings((prev) => ({ ...prev, profilePhoto: dataUrl }));
      if (onShowToast) {
        onShowToast('success', isHi ? 'लोगो अवतार सेट हो गया!' : 'Avatar logo set!');
      }
    }
  };

  // Optional Standee QR Photo Upload
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          handleFieldChange('qrCodeImage', dataUrl);
          setSettings((prev) => ({ ...prev, qrCodeImage: dataUrl }));
          if (onShowToast) {
            onShowToast('success', isHi ? 'स्टैंडी QR फ़ोटो अपडेट हो गई!' : 'Standee QR photo updated!');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCopyUpiLink = () => {
    if (!formData.upiId) return;
    const upiUrl = generateUpiUrl(
      formData.upiId,
      formData.upiPayeeName || formData.shopName || 'Store'
    );
    navigator.clipboard.writeText(upiUrl);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
    if (onShowToast) {
      onShowToast('info', isHi ? 'UPI लिंक कॉपी हो गया!' : 'UPI Link copied!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shopName.trim()) {
      alert(isHi ? 'कृपया दुकान का नाम दर्ज करें' : 'Please enter a shop name');
      return;
    }

    const updatedSettings: ShopSettings = {
      ...settings,
      shopName: formData.shopName.trim(),
      shopkeeperName: formData.shopkeeperName.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      gstin: formData.gstin.trim(),
      receiptFooterNote: formData.receiptFooterNote.trim(),
      profilePhoto: formData.profilePhoto,
      upiId: formData.upiId.trim().toLowerCase(),
      upiPayeeName: formData.upiPayeeName.trim() || formData.shopkeeperName.trim() || formData.shopName.trim(),
      qrCodeImage: formData.qrCodeImage,
    };

    setSettings(updatedSettings);
    setIsSaved(true);
    if (onShowToast) {
      onShowToast(
        'success',
        isHi
          ? 'सामान्य सेटिंग्स (दुकान का नाम, फ़ोटो व UPI) सुरक्षित हो गईं!'
          : 'General Settings (Shop name, Photo, & UPI) updated successfully!'
      );
    }
    setTimeout(() => setIsSaved(false), 2500);
  };

  const PRESET_AVATARS = ['🏪', '📱', '⚡', '🛒', '📦', '🛍️', '💼', '🏬'];

  return (
    <section aria-label="General Settings" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>{isHi ? 'सामान्य सेटिंग्स (General Settings)' : 'General Settings'}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {isHi ? 'दुकान प्रोफ़ाइल व UPI' : 'Profile & Payment QR'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHi
                ? 'दुकान का नाम बदलें, प्रोफ़ाइल फ़ोटो / लोगो अपलोड करें और QR पेमेंट हेतु अपनी UPI ID सेट करें।'
                : 'Update shop name, profile photo/logo, and configure your UPI ID for QR code generation.'}
            </p>
          </div>
        </div>

        {/* Live Preview Indicator */}
        <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-medium text-slate-700 truncate max-w-[130px]">
            {formData.shopName || (isHi ? 'दुकान का नाम' : 'Shop Name')}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-6">
        
        {/* SECTION A: Profile Picture / Store Logo */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>{isHi ? 'दुकान का लोगो या प्रोफ़ाइल फ़ोटो' : 'Store Logo / Profile Picture'}</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {isHi ? 'हेडर व बिल रसीद पर दिखेगा' : 'Displayed in TopBar & Receipts'}
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
            {/* Visual Avatar */}
            <div className="relative shrink-0">
              {formData.profilePhoto ? (
                <img
                  src={formData.profilePhoto}
                  alt="Store Profile"
                  className="w-18 h-18 rounded-2xl object-cover border-2 border-blue-500 shadow-xs bg-white"
                />
              ) : (
                <div className="w-18 h-18 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-inner">
                  <Store className="w-9 h-9" />
                </div>
              )}
            </div>

            {/* Upload & Actions */}
            <div className="flex-1 space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isHi ? 'फ़ोटो अपलोड करें' : 'Upload Photo'}</span>
                </button>

                {formData.profilePhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('profilePhoto', '');
                      setSettings((prev) => ({ ...prev, profilePhoto: '' }));
                      if (onShowToast) {
                        onShowToast('info', isHi ? 'फ़ोटो हटा दी गई।' : 'Profile photo removed.');
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isHi ? 'हटाएं' : 'Remove'}</span>
                  </button>
                )}
              </div>

              {/* Emoji Avatars Quick Picker */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-500 font-medium">
                  {isHi ? 'या रेडीमेड आइकन चुनें:' : 'Or choose preset icon:'}
                </span>
                {PRESET_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectPresetAvatar(emoji)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-sm flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    title={`Select ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: Shop Name & Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {isHi ? 'दुकान का नाम (Shop Name) *' : 'Shop Name *'}
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.shopName}
                  onChange={(e) => handleFieldChange('shopName', e.target.value)}
                  placeholder="e.g. दुकान साथी ERP"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {isHi ? 'दुकानदार / प्रोपराइटर का नाम' : 'Proprietor / Shopkeeper Name'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={formData.shopkeeperName}
                  onChange={(e) => handleFieldChange('shopkeeperName', e.target.value)}
                  placeholder="e.g. Krish Rajput"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isHi ? 'मोबाइल नंबर (बिल पर प्रिंट हेतु)' : 'Shop Phone Number'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isHi ? 'दुकान का पता (Address)' : 'Shop Address'}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  placeholder="e.g. Shop No. 12, Main Market"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isHi ? 'GSTIN नंबर (यदि हो)' : 'GSTIN (Optional)'}
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => handleFieldChange('gstin', e.target.value.toUpperCase())}
                placeholder="e.g. 07AAAAA0000A1Z5"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isHi ? 'बिल रसीद का निचला संदेश' : 'Receipt Footer Note'}
              </label>
              <input
                type="text"
                value={formData.receiptFooterNote}
                onChange={(e) => handleFieldChange('receiptFooterNote', e.target.value)}
                placeholder="e.g. Thank you! Visit again."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION C: UPI ID & QR Code Generation */}
        <div className="pt-2 border-t border-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>{isHi ? 'UPI ID व पेमेंट QR कोड कॉन्फ़िगरेशन' : 'UPI ID & QR Code Configuration'}</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {isHi
                  ? 'अपनी UPI ID दर्ज करें। ग्राहक इसे स्कैन करके PhonePe, Google Pay, Paytm, BHIM से तुरंत पेमेंट कर सकते हैं।'
                  : 'Configure UPI ID and Payee name for dynamic QR code generation during checkout and receipts.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start bg-slate-50/60 p-4 rounded-xl border border-slate-200">
            {/* Inputs (7 cols) */}
            <div className="md:col-span-7 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {isHi ? 'दुकान की UPI ID * (GPay, PhonePe, Paytm, BHIM)' : 'Store UPI ID *'}
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={formData.upiId}
                    onChange={(e) => handleFieldChange('upiId', e.target.value.trim().toLowerCase())}
                    placeholder="e.g. 9876543210@paytm या shop@okhdfcbank"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isHi
                    ? 'उदाहरण: 9876543210@paytm, merchant@okaxis, yourname@ybl'
                    : 'Examples: 9876543210@paytm, yourname@okaxis, merchant@ybl'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isHi ? 'खाताधारक / व्यापारी का नाम (Payee Name)' : 'UPI Payee / Merchant Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={formData.upiPayeeName}
                    onChange={(e) => handleFieldChange('upiPayeeName', e.target.value)}
                    placeholder="e.g. Krish Rajput"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Upload Physical Standee QR Option */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    {isHi ? 'या दुकान के QR स्टैंडी की फ़ोटो लगाएं' : 'Or Upload Standee QR Photo'}
                  </label>
                  {formData.qrCodeImage && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded">
                      {isHi ? 'कस्टम फ़ोटो सक्रिय' : 'Custom Active'}
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={qrInputRef}
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => qrInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{isHi ? 'QR फ़ोटो चुनें' : 'Upload Standee QR'}</span>
                  </button>

                  {formData.qrCodeImage && (
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange('qrCodeImage', '');
                        setSettings((prev) => ({ ...prev, qrCodeImage: '' }));
                      }}
                      className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      {isHi ? 'हटाएं (ऑटोमैटिक QR उपयोग करें)' : 'Revert to Auto QR'}
                    </button>
                  )}
                </div>
              </div>

              {/* Copy UPI Link button */}
              {formData.upiId && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCopyUpiLink}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>{copiedUpi ? (isHi ? 'कॉपी हो गया!' : 'Copied!') : (isHi ? 'UPI लिंक कॉपी करें' : 'Copy UPI Link')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Live QR Preview (5 cols) */}
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-2xs">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isHi ? 'लाइव QR कोड प्रीव्यू' : 'Live QR Preview'}</span>
              </span>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center min-h-[170px] min-w-[170px]">
                {formData.qrCodeImage ? (
                  <img
                    src={formData.qrCodeImage}
                    alt="Custom Standee QR"
                    className="w-38 h-38 object-contain rounded"
                  />
                ) : formData.upiId ? (
                  <canvas ref={upiCanvasRef} className="rounded" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 py-6">
                    <QrCode className="w-12 h-12 stroke-1 mb-1 text-slate-300" />
                    <span className="text-[11px]">{isHi ? 'UPI ID दर्ज करें' : 'Enter UPI ID'}</span>
                  </div>
                )}
              </div>

              <p className="text-xs font-mono font-semibold text-slate-800 mt-2 truncate max-w-full">
                {formData.upiId || 'your-upi@bank'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-full">
                {formData.upiPayeeName || formData.shopName || 'Store'}
              </p>

              <span className="mt-2 text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-semibold">
                {isHi ? '✓ PhonePe / Google Pay / Paytm तैयार' : '✓ Ready for UPI scan'}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div>
            {isSaved && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 animate-pulse">
                <CheckCircle className="w-4 h-4" />
                <span>
                  {isHi
                    ? 'दुकान की सामान्य सेटिंग्स सफलतापूर्वक सेव हो गईं!'
                    : 'General Settings saved successfully!'}
                </span>
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 text-white" />
            <span>{isHi ? 'सेटिंग्स सेव करें (Save General Settings)' : 'Save General Settings'}</span>
          </button>
        </div>

      </form>
    </section>
  );
};
