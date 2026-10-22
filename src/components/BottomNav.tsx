import React from 'react';
import { LayoutDashboard, Boxes, Receipt, FileText, Users, Settings } from 'lucide-react';
import { AppTab } from '../types/erp';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  language: 'hi' | 'en';
  cartCount?: number;
  lowStockCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  language,
  cartCount = 0,
  lowStockCount = 0,
}) => {
  const tabs: {
    id: AppTab;
    labelHi: string;
    labelEn: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: 'dashboard',
      labelHi: 'डैशबोर्ड',
      labelEn: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'inventory',
      labelHi: 'स्टॉक',
      labelEn: 'Stock',
      icon: <Boxes className="w-4 h-4" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'billing',
      labelHi: 'नया बिल',
      labelEn: 'Bill',
      icon: <Receipt className="w-4 h-4" />,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      id: 'sales',
      labelHi: 'बिक्री',
      labelEn: 'Sales',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'parties',
      labelHi: 'खाता',
      labelEn: 'Khata',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'settings',
      labelHi: 'सेटिंग्स',
      labelEn: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-6 items-center h-15 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative py-1 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-amber-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                {language === 'hi' ? tab.labelHi : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
