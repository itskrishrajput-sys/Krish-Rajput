import React from 'react';
import { Smartphone, Languages, Sparkles, Lock, ShieldCheck, UserCheck, Cloud, CloudCheck, Settings, Share2, KeyRound } from 'lucide-react';
import { AppTab, ShopSettings, UserSession } from '../types/erp';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  settings: ShopSettings;
  setSettings: React.Dispatch<React.SetStateAction<ShopSettings>>;
  todaySalesCount: number;
  session?: UserSession | null;
  onLockApp?: () => void;
  isCloudConnected?: boolean;
  onOpenShareModal?: () => void;
  onOpenChangePin?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  setSettings,
  todaySalesCount,
  session,
  onLockApp,
  isCloudConnected = true,
  onOpenShareModal,
  onOpenChangePin,
}) => {
  const toggleLanguage = () => {
    const nextLang = settings.language === 'hi' ? 'en' : 'hi';
    setSettings((prev) => ({ ...prev, language: nextLang }));
  };

  const navItems: { id: AppTab; labelHi: string; labelEn: string }[] = [
    { id: 'dashboard', labelHi: 'डैशबोर्ड', labelEn: 'Dashboard' },
    { id: 'inventory', labelHi: 'इन्वेंटरी', labelEn: 'Inventory' },
    { id: 'billing', labelHi: 'नया बिल', labelEn: 'New Bill' },
    { id: 'sales', labelHi: 'बिक्री व बिल', labelEn: 'Sales & Bills' },
    { id: 'parties', labelHi: 'खाता / पार्टी', labelEn: 'Parties' },
    { id: 'settings', labelHi: 'सेटिंग्स', labelEn: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-6">
        
        {/* Zone 1: Wordmark & Shop Logo */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group select-none"
        >
          {settings.profilePhoto ? (
            <img
              src={settings.profilePhoto}
              alt={settings.shopName}
              className="w-8 h-8 rounded-lg object-cover border border-slate-700 shadow-sm bg-white"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner group-hover:bg-blue-500 transition-colors">
              <Smartphone className="w-4 h-4" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base tracking-tight leading-none text-slate-100 flex items-center gap-1.5">
              {settings.shopName || 'Mobile Trade Hub ERP'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              {settings.shopkeeperName ? `${settings.shopkeeperName} · ` : ''}
              {settings.language === 'hi' ? 'दुकान साथी ERP' : 'Trade Hub ERP'}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop/Tablet) */}
        <nav className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-medium text-slate-300">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  isActive
                    ? 'border-blue-500 text-white font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                {settings.language === 'hi' ? item.labelHi : item.labelEn}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions - Cloud Status, Language, Lock & Today Counter */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <PWAInstallButton language={settings.language} />

          {/* Cloud Synced Badge */}
          <div
            title={
              isCloudConnected
                ? (settings.language === 'hi' ? 'Google Firebase क्लाउड से कनेक्टेड व सुरक्षित' : 'Google Firebase Cloud Synced')
                : (settings.language === 'hi' ? 'ऑफ़लाइन मोड (स्थानीय सुरक्षित)' : 'Offline Local Mode')
            }
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] text-emerald-400 select-none"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden xs:inline" />
            <span className="hidden sm:inline font-semibold text-[10px]">
              {settings.language === 'hi' ? 'क्लाउड लाइव' : 'Cloud Live'}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {settings.language === 'hi' ? `आज के बिल: ${todaySalesCount}` : `Today: ${todaySalesCount}`}
            </span>
          </div>

          {/* User Role Badge */}
          {session && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
              <UserCheck className="w-3 h-3 text-emerald-400" />
              <span>{session.role === 'owner' ? (settings.language === 'hi' ? 'मालिक' : 'Admin') : (settings.language === 'hi' ? 'स्टाफ' : 'Staff')}</span>
            </div>
          )}

          {/* Share Link Button */}
          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              title={settings.language === 'hi' ? 'दुकान का लिंक व पासवर्ड शेयर करें' : 'Share App Link & Password'}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs border border-emerald-500 transition-all whitespace-nowrap shrink-0 active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-white" />
              <span className="inline">{settings.language === 'hi' ? 'शेयर लिंक' : 'Share Link'}</span>
            </button>
          )}

          {/* Change PIN Button */}
          {onOpenChangePin && (
            <button
              onClick={onOpenChangePin}
              title={settings.language === 'hi' ? 'सिक्योरिटी पासवर्ड / पिन बदलें' : 'Change Security PIN / Password'}
              className="hidden sm:flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg border border-slate-700 transition-all whitespace-nowrap shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">{settings.language === 'hi' ? 'पिन बदलें' : 'Change PIN'}</span>
            </button>
          )}

          {/* Quick Lock Button */}
          {onLockApp && (
            <button
              onClick={onLockApp}
              title={settings.language === 'hi' ? 'ऐप लॉक करें (Lock App)' : 'Lock Application'}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg border border-slate-700 transition-all whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline">{settings.language === 'hi' ? 'लॉक' : 'Lock'}</span>
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            title="Toggle Hindi / English"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Languages className="w-3.5 h-3.5 text-blue-400" />
            <span>{settings.language === 'hi' ? 'EN' : 'हिंदी'}</span>
          </button>

          {/* Dedicated Settings Button */}
          <button
            onClick={() => setActiveTab('settings')}
            title={settings.language === 'hi' ? 'दुकान सेटिंग्स व UPI QR कोड' : 'Settings & Payment QR'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 active:scale-95 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'text-slate-200 bg-slate-800 hover:bg-slate-700 border-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span className="inline">{settings.language === 'hi' ? 'सेटिंग्स' : 'Settings'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
