import React, { useState } from 'react';
import {
  Settings,
  Store,
  Volume2,
  VolumeX,
  Languages,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Lock,
  Unlock,
  ShieldCheck,
  KeyRound,
  FileText,
  Percent,
  Sliders,
  Trash2,
  Smartphone,
  Eye,
  EyeOff,
  BarChart3,
  LayoutDashboard,
  Share2,
} from 'lucide-react';
import { ShopSettings, Product, Customer, Sale, SecurityConfig } from '../types/erp';
import { announcePayment } from '../utils/audio';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_CUSTOMERS,
  DEFAULT_SECURITY,
  exportFullBackup,
  restoreFullBackup,
  normalizeProduct,
  saveStoredProducts,
} from '../utils/storage';
import { GeneralSettings } from './GeneralSettings';
import { OwnerValuationReport } from './OwnerValuationReport';

export { GeneralSettings, OwnerValuationReport };

interface SettingsTabProps {
  products: Product[];
  sales: Sale[];
  settings: ShopSettings;
  setSettings: React.Dispatch<React.SetStateAction<ShopSettings>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  onLockApp?: () => void;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
  onOpenShareModal?: () => void;
  onOpenChangePin?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  products,
  sales,
  settings,
  setSettings,
  setProducts,
  setCustomers,
  setSales,
  onLockApp,
  onShowToast,
  onOpenShareModal,
  onOpenChangePin,
}) => {
  const isHi = settings.language === 'hi';
  const [formData, setFormData] = useState<ShopSettings>({
    ...settings,
    security: {
      ...DEFAULT_SECURITY,
      ...(settings.security || {}),
    },
    upiPayeeName: settings.upiPayeeName || settings.shopkeeperName || 'Krish Rajput',
    profilePhoto: settings.profilePhoto || '',
    qrCodeImage: settings.qrCodeImage || '',
    defaultLowStockThreshold: settings.defaultLowStockThreshold ?? 5,
    billPrefix: settings.billPrefix || 'BILL-',
    defaultGstPercent: settings.defaultGstPercent ?? 0,
    allowDiscounts: settings.allowDiscounts ?? true,
    receiptPaperSize: settings.receiptPaperSize || '58mm',
  });

  const [testAmount, setTestAmount] = useState<number>(500);
  const [newPin, setNewPin] = useState(formData.security?.pin || '1234');
  const [newStaffPin, setNewStaffPin] = useState(formData.security?.staffPin || '0000');
  const [showOwnerPin, setShowOwnerPin] = useState(false);
  const [showStaffPin, setShowStaffPin] = useState(false);
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  const [isDashboardBannerHidden, setIsDashboardBannerHidden] = useState<boolean>(() => {
    return localStorage.getItem('mth_hide_dashboard_banner') === 'true';
  });

  const toggleDashboardBanner = () => {
    if (isDashboardBannerHidden) {
      localStorage.removeItem('mth_hide_dashboard_banner');
      setIsDashboardBannerHidden(false);
      if (onShowToast) {
        onShowToast('success', isHi ? 'डैशबोर्ड बैनर पुनः सक्रिय कर दिया गया है!' : 'Dashboard banner restored!');
      }
    } else {
      localStorage.setItem('mth_hide_dashboard_banner', 'true');
      setIsDashboardBannerHidden(true);
      if (onShowToast) {
        onShowToast('info', isHi ? 'डैशबोर्ड बैनर छिपा दिया गया है।' : 'Dashboard banner hidden.');
      }
    }
  };

  const handleFormChange = (key: keyof ShopSettings, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSecurityChange = (key: keyof SecurityConfig, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value,
      },
    }));
  };

  const handleSaveSecurityPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      alert(isHi ? 'कृपया 4 अंकों का पिन दर्ज करें (जैसे 1234)' : 'Please enter a 4-digit numeric PIN (e.g. 1234)');
      return;
    }
    const updatedSecurity: SecurityConfig = {
      ...formData.security,
      pin: newPin,
      staffPin: newStaffPin || '0000',
    };
    setFormData((prev) => ({ ...prev, security: updatedSecurity }));
    setSettings((prev) => ({ ...prev, security: updatedSecurity }));
    setPinChangeSuccess(true);
    if (onShowToast) {
      onShowToast('success', isHi ? `पिन बदल दिया गया: ${newPin}` : `PIN updated to ${newPin}`);
    }
    setTimeout(() => setPinChangeSuccess(false), 2500);
  };


  const handleTestSoundbox = () => {
    announcePayment(testAmount, formData.soundboxVoice || 'hi');
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mobile_Trade_Hub_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = restoreFullBackup(content);
      if (success) {
        alert(isHi ? 'डेटा सफलतापूर्वक रीस्टोर हो गया! पेज रिफ्रेश हो रहा है...' : 'Backup restored successfully! Refreshing...');
        window.location.reload();
      } else {
        alert(isHi ? 'गलत बैकअप फाइल फॉर्मेट!' : 'Invalid backup JSON file!');
      }
    };
    reader.readAsText(file);
  };

  const handleLoadKiranaPreset = () => {
    if (confirm(isHi ? 'क्या आप किराना स्टोर का रेडीमेड सामान लोड करना चाहते हैं?' : 'Load Kirana / Grocery Store preset?')) {
      const kiranaItems: Product[] = [
        normalizeProduct({ id: 'k-1', name: 'Tata Salt Vacuum Evaporated 1kg', sku: 'GRC-SLT-01', category: 'Grocery', rate: 28, costPrice: 22, stock: 50, minimum_stock: 10, unit: 'Kg', bin: 'G-01' }),
        normalizeProduct({ id: 'k-2', name: 'Fortune Sunlite Refined Oil 1L', sku: 'GRC-OIL-02', category: 'Grocery', rate: 145, costPrice: 125, stock: 24, minimum_stock: 6, unit: 'Litre', bin: 'G-02' }),
        normalizeProduct({ id: 'k-3', name: 'Aashirvaad Shudh Chakki Atta 5kg', sku: 'GRC-ATA-03', category: 'Grocery', rate: 235, costPrice: 210, stock: 15, minimum_stock: 4, unit: 'Packet', bin: 'G-03' }),
        normalizeProduct({ id: 'k-4', name: 'India Gate Basmati Rice 1kg', sku: 'GRC-RCE-04', category: 'Grocery', rate: 110, costPrice: 90, stock: 30, minimum_stock: 5, unit: 'Kg', bin: 'G-04' }),
        normalizeProduct({ id: 'k-5', name: 'Tata Tea Gold 250g', sku: 'GRC-TEA-05', category: 'Grocery', rate: 150, costPrice: 130, stock: 18, minimum_stock: 4, unit: 'Packet', bin: 'G-05' }),
        normalizeProduct({ id: 'k-6', name: 'Maggi 2-Minute Noodles 70g', sku: 'GRC-MGI-06', category: 'Grocery', rate: 14, costPrice: 11.5, stock: 48, minimum_stock: 12, unit: 'Packet', bin: 'G-06' }),
        normalizeProduct({ id: 'k-7', name: 'Parle-G Gold Biscuit 100g', sku: 'GRC-PLG-07', category: 'Grocery', rate: 10, costPrice: 8.5, stock: 60, minimum_stock: 15, unit: 'Packet', bin: 'G-07' }),
        normalizeProduct({ id: 'k-8', name: 'Amul Butter 100g', sku: 'GRC-BTR-08', category: 'Dairy', rate: 58, costPrice: 52, stock: 20, minimum_stock: 5, unit: 'Packet', bin: 'G-08' }),
        normalizeProduct({ id: 'k-9', name: 'Sugar / चीनी 1kg', sku: 'GRC-SGR-09', category: 'Grocery', rate: 44, costPrice: 38, stock: 40, minimum_stock: 10, unit: 'Kg', bin: 'G-09' }),
        normalizeProduct({ id: 'k-10', name: 'Surf Excel Quick Wash 1kg', sku: 'GRC-SRF-10', category: 'General', rate: 140, costPrice: 122, stock: 12, minimum_stock: 3, unit: 'Packet', bin: 'G-10' }),
      ];
      setProducts(kiranaItems);
      saveStoredProducts(kiranaItems);
      alert(isHi ? 'किराना स्टोर का सामान लोड कर दिया गया है!' : 'Kirana store items loaded!');
    }
  };

  const handleLoadMobilePreset = () => {
    if (confirm(isHi ? 'क्या आप मोबाइल व इलेक्ट्रॉनिक्स स्टोर का रेडीमेड सामान लोड करना चाहते हैं?' : 'Load Mobile Accessories store preset?')) {
      const mobileItems: Product[] = [
        normalizeProduct({ id: 'm-1', name: 'Type-C 65W Fast Cable (1 Meter)', sku: 'CAB-TYPC-01', category: 'Cables', rate: 199, costPrice: 85, stock: 25, minimum_stock: 5, unit: 'Pcs', bin: 'A-01' }),
        normalizeProduct({ id: 'm-2', name: 'Fast Charger 25W Adapter', sku: 'CHG-25W-03', category: 'Chargers', rate: 499, costPrice: 260, stock: 12, minimum_stock: 4, unit: 'Pcs', bin: 'A-03' }),
        normalizeProduct({ id: 'm-3', name: 'Tempered Glass 9D (All Models)', sku: 'GL-9D-04', category: 'Tempered Glass', rate: 99, costPrice: 25, stock: 80, minimum_stock: 15, unit: 'Pcs', bin: 'C-01' }),
        normalizeProduct({ id: 'm-4', name: 'Bluetooth Wireless Neckband', sku: 'NCK-BT-02', category: 'Audio', rate: 699, costPrice: 380, stock: 8, minimum_stock: 3, unit: 'Pcs', bin: 'B-02' }),
        normalizeProduct({ id: 'm-5', name: 'TWS Wireless Earbuds (Touch Control)', sku: 'AUD-TWS-05', category: 'Audio', rate: 899, costPrice: 520, stock: 6, minimum_stock: 2, unit: 'Pcs', bin: 'B-01' }),
        normalizeProduct({ id: 'm-6', name: 'OTG Adapter USB to Type-C', sku: 'ACC-OTG-06', category: 'Accessories', rate: 49, costPrice: 14, stock: 30, minimum_stock: 6, unit: 'Pcs', bin: 'A-02' }),
        normalizeProduct({ id: 'm-7', name: 'Mobile Back Cover (Silicone Matte)', sku: 'ACC-CVR-07', category: 'Accessories', rate: 149, costPrice: 45, stock: 40, minimum_stock: 10, unit: 'Pcs', bin: 'D-01' }),
        normalizeProduct({ id: 'm-8', name: 'Memory Card 32GB High Speed', sku: 'MEM-32GB-08', category: 'Accessories', rate: 349, costPrice: 220, stock: 10, minimum_stock: 3, unit: 'Pcs', bin: 'D-03' }),
      ];
      setProducts(mobileItems);
      saveStoredProducts(mobileItems);
      alert(isHi ? 'मोबाइल स्टोर का सामान लोड कर दिया गया है!' : 'Mobile accessories items loaded!');
    }
  };

  const handleClearAllProducts = () => {
    if (
      confirm(
        isHi
          ? 'चेतावनी: क्या आप इन्वेंटरी के सभी प्रोडक्ट्स को पूरी तरह हटाना चाहते हैं? (यह खाली इन्वेंटरी कर देगा)'
          : 'Warning: Remove all inventory products and start fresh with empty inventory?'
      )
    ) {
      setProducts([]);
      saveStoredProducts([]);
      alert(isHi ? 'सभी प्रोडक्ट्स हटा दिए गए हैं।' : 'All products have been cleared.');
    }
  };

  const PRESET_AVATARS = ['🏪', '📱', '⚡', '🛒', '📦', '🛍️', '💼', '🏬'];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      
      {/* Quick Section Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <a
          href="#general-settings"
          className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 whitespace-nowrap active:scale-95"
        >
          <Store className="w-3.5 h-3.5" />
          <span>{isHi ? '🏪 दुकान व UPI QR' : '🏪 Shop & UPI QR'}</span>
        </a>
        <a
          href="#owner-valuation"
          className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 whitespace-nowrap active:scale-95"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{isHi ? '📊 इन्वेंटरी व मुनाफ़ा रिपोर्ट' : '📊 Profit & Valuation'}</span>
        </a>
        <a
          href="#security-pin"
          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>{isHi ? '🔒 सुरक्षा पिन' : '🔒 Security PIN'}</span>
        </a>
        <a
          href="#billing-config"
          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-teal-600" />
          <span>{isHi ? '⚙️ बिलिंग सेटिंग्स' : '⚙️ Billing & Sound'}</span>
        </a>
        <a
          href="#data-backup"
          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-purple-600" />
          <span>{isHi ? '💾 डेटा बैकअप' : '💾 Backup'}</span>
        </a>
      </div>

      {/* 1. General Settings Section: Shop Name, Profile Picture & UPI QR Code */}
      <div id="general-settings">
        <GeneralSettings
          settings={settings}
          setSettings={setSettings}
          onShowToast={onShowToast}
        />
      </div>

      {/* 2. Owner Valuation & Profit/Loss Report (PIN Protected) */}
      <div id="owner-valuation">
        <OwnerValuationReport
          products={products}
          sales={sales}
          settings={settings}
        />
      </div>

      {/* 3. Login & Link Protection Security Card */}
      <div id="security-pin" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isHi ? 'लिंक शेयरिंग व पासवर्ड/पिन सुरक्षा (Link & App Security)' : 'Link & App Security PIN'}
              </h3>
              <p className="text-xs text-slate-500">
                {isHi
                  ? 'जब भी आप यह लिंक किसी को भेजेंगे, तो केवल पिन डालने पर ही कोई ऐप खोल सकेगा।'
                  : 'Protect access when sharing link. Only users with the correct PIN can open the ERP.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenShareModal && (
              <button
                type="button"
                onClick={onOpenShareModal}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isHi ? 'शेयर लिंक व पासवर्ड' : 'Share Link & PIN'}</span>
              </button>
            )}

            {onLockApp && (
              <button
                type="button"
                onClick={onLockApp}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{isHi ? 'अभी लॉक करें' : 'Lock Now'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="pt-4 space-y-4">
          
          {/* Security Banner Alert */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold block">
                {isHi ? 'सुरक्षा नियम:' : 'Security Rule:'}
              </span>
              <p className="text-indigo-800 mt-0.5 leading-relaxed">
                {isHi
                  ? 'यदि आप अपनी दुकान का लिंक किसी स्टाफ़, पार्टनर या ग्राहक को भेजते हैं, तो वह बिना पिन के आपके स्टॉक या बिल को नहीं देख सकता। आप मालिक और स्टाफ़ के लिए अलग-अलग पिन रख सकते हैं।'
                  : 'Anyone opening this application via link will be prompted for this 4-digit PIN before accessing any data.'}
              </p>
            </div>
          </div>

          {/* Toggle PIN Lock */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isHi ? 'लिंक खोलते समय पिन लॉक अनिवार्य रखें' : 'Require PIN Lock on Link / App Open'}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isHi
                  ? 'चालू रखने पर किसी भी नए फ़ोन या लिंक खोलने पर पहले पिन स्क्रीन खुलेगी।'
                  : 'When ON, app immediately shows the PIN login screen upon visiting the link.'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextVal = !formData.security?.isLockEnabled;
                handleSecurityChange('isLockEnabled', nextVal);
                setSettings((p) => ({
                  ...p,
                  security: { ...p.security, isLockEnabled: nextVal },
                }));
                if (onShowToast) {
                  onShowToast(
                    'info',
                    nextVal
                      ? (isHi ? 'पिन लॉक सुरक्षा चालू कर दी गई है।' : 'PIN lock enabled.')
                      : (isHi ? 'पिन लॉक सुरक्षा बंद कर दी गई है।' : 'PIN lock disabled.')
                  );
                }
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.security?.isLockEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.security?.isLockEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Change PIN Form */}
          <form onSubmit={handleSaveSecurityPin} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              
              {/* Owner / Admin PIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{isHi ? 'दुकानदार / मालिक (Admin) का पिन *' : 'Owner / Admin PIN *'}</span>
                  <span className="text-[10px] text-indigo-600 font-mono">(डिफ़ॉल्ट: 1234)</span>
                </label>
                <div className="relative">
                  <input
                    type={showOwnerPin ? 'text' : 'password'}
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234"
                    className="w-full pl-3 pr-16 py-2 text-sm font-mono font-bold tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => setShowOwnerPin(!showOwnerPin)}
                      className="p-1 hover:text-slate-600"
                    >
                      {showOwnerPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-xs font-mono">{newPin.length}/4</span>
                  </div>
                </div>
              </div>

              {/* Staff PIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{isHi ? 'स्टाफ़ / कैशियर का पिन (वैकल्पिक)' : 'Staff Cashier PIN'}</span>
                  <span className="text-[10px] text-slate-500 font-mono">(डिफ़ॉल्ट: 0000)</span>
                </label>
                <div className="relative">
                  <input
                    type={showStaffPin ? 'text' : 'password'}
                    maxLength={4}
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="0000"
                    className="w-full pl-3 pr-16 py-2 text-sm font-mono font-bold tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => setShowStaffPin(!showStaffPin)}
                      className="p-1 hover:text-slate-600"
                    >
                      {showStaffPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-xs font-mono">{newStaffPin.length}/4</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                {pinChangeSuccess && (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {isHi ? 'नया पिन सुरक्षित हो गया!' : 'PIN successfully updated!'}
                  </span>
                )}
              </span>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                {isHi ? 'पिन सुरक्षित करें (Save PIN)' : 'Save PIN'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Billing, Soundbox & Operations Configuration */}
      <div id="billing-config" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
          <Sliders className="w-5 h-5 text-teal-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {isHi ? 'बिलिंग व साउंडबॉक्स सेटिंग्स' : 'Billing & Operations Configuration'}
            </h3>
            <p className="text-xs text-slate-500">
              {isHi
                ? 'बिल नंबर प्रीफ़िक्स, लो स्टॉक अलर्ट और आवाज़ अलर्ट सेट करें।'
                : 'Invoice series, soundbox announcements, and low stock threshold.'}
            </p>
          </div>
        </div>

        <div className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isHi ? 'बिल नंबर प्रीफ़िक्स' : 'Invoice Bill Prefix'}
              </label>
              <input
                type="text"
                value={formData.billPrefix}
                onChange={(e) => handleFormChange('billPrefix', e.target.value.toUpperCase())}
                placeholder="BILL-"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isHi ? 'कम स्टॉक अलर्ट सीमा' : 'Low Stock Alert Limit'}
              </label>
              <input
                type="number"
                min="1"
                value={formData.defaultLowStockThreshold}
                onChange={(e) => handleFormChange('defaultLowStockThreshold', parseInt(e.target.value, 10) || 5)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isHi ? 'प्रिंटर पेपर साइज़' : 'Receipt Paper Size'}
              </label>
              <select
                value={formData.receiptPaperSize}
                onChange={(e) => handleFormChange('receiptPaperSize', e.target.value as '58mm' | '80mm' | 'A4')}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="58mm">58mm (Thermal Mini)</option>
                <option value="80mm">80mm (Thermal POS)</option>
                <option value="A4">A4 (Standard Laser)</option>
              </select>
            </div>
          </div>

          {/* Soundbox Voice Alerts */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {formData.enableSoundbox ? (
                  <Volume2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {isHi ? 'पेमेंट साउंडबॉक्स आवाज़ अलर्ट' : 'Payment Soundbox Voice Alert'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isHi ? 'बिल कटने पर बोलेगा: "₹xxx प्राप्त हुए"' : 'Announces "Received ₹xxx" on completed bill'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleFormChange('enableSoundbox', !formData.enableSoundbox)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  formData.enableSoundbox ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.enableSoundbox ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {formData.enableSoundbox && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleFormChange('soundboxVoice', 'hi')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    formData.soundboxVoice === 'hi'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  हिंदी आवाज़
                </button>
                <button
                  type="button"
                  onClick={() => handleFormChange('soundboxVoice', 'en')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    formData.soundboxVoice === 'en'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  English Voice
                </button>
                <button
                  type="button"
                  onClick={handleTestSoundbox}
                  className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 ml-auto"
                >
                  🔊 टेस्ट आवाज़
                </button>
              </div>
            )}
          </div>

          {/* Dashboard Banner Visibility Toggle */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {isHi ? 'डैशबोर्ड पर सेटिंग्स व क्विक सेटअप बैनर' : 'Dashboard Quick Setup Banner'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isDashboardBannerHidden
                    ? (isHi ? 'वर्तमान स्थिति: बैनर छिपा हुआ है' : 'Current status: Hidden from Dashboard')
                    : (isHi ? 'वर्तमान स्थिति: बैनर दिख रहा है' : 'Current status: Visible on Dashboard')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleDashboardBanner}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                isDashboardBannerHidden
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {isDashboardBannerHidden
                ? (isHi ? 'डैशबोर्ड पर पुनः दिखाएं' : 'Show on Dashboard')
                : (isHi ? 'डैशबोर्ड से हटाएं' : 'Hide from Dashboard')}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Data Backup, Catalogs & Factory Reset */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
          <Database className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {isHi ? 'डेटा बैकअप व कैटलॉग लोड' : 'Data Backup & Presets'}
            </h3>
            <p className="text-xs text-slate-500">
              {isHi ? 'अपना पूरा डेटा डाउनलोड करें या नई दुकान का सामान लोड करें।' : 'Export data, restore backup, or load industry demo items.'}
            </p>
          </div>
        </div>

        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              {isHi ? 'सुरक्षित बैकअप डाउनलोड करें' : 'Download Complete Backup'}
            </span>
            <p className="text-[11px] text-slate-500">
              {isHi ? 'अपने सभी स्टॉक, बिल और ग्राहकों का JSON बैकअप अपने फ़ोन में रखें।' : 'Download all products, sales, and khata records as a JSON file.'}
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isHi ? 'बैकअप डाउनलोड करें (JSON)' : 'Download Backup'}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              {isHi ? 'बैकअप फ़ाइल रीस्टोर करें' : 'Restore Backup'}
            </span>
            <p className="text-[11px] text-slate-500">
              {isHi ? 'पुराने बैकअप से अपना डेटा तुरंत वापस लाएं।' : 'Upload and restore your previous JSON backup file.'}
            </p>
            <label className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{isHi ? 'फ़ाइल चुनें व रीस्टोर करें' : 'Select Backup File'}</span>
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          </div>

          <div className="sm:col-span-2 pt-2 border-t border-slate-200 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleLoadKiranaPreset}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
            >
              🌾 किराना स्टोर सामान लोड करें
            </button>
            <button
              type="button"
              onClick={handleLoadMobilePreset}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
            >
              📱 मोबाइल स्टोर सामान लोड करें
            </button>
            <button
              type="button"
              onClick={handleClearAllProducts}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold ml-auto transition-colors"
            >
              🗑️ खाली इन्वेंटरी करें
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
