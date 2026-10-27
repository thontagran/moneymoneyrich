import React from 'react';
import { Wallet, Calculator, TrendingUp, Sparkles } from 'lucide-react';

export type NavTabId = 'cashflow' | 'tax' | 'invest' | 'advisor';

interface BottomNavBarProps {
  activeTab: NavTabId;
  onChangeTab: (tab: NavTabId) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onChangeTab }) => {
  const items: { id: NavTabId; label: string; icon: React.ReactNode }[] = [
    { id: 'cashflow', label: 'กระแสเงินสด', icon: <Wallet className="w-5 h-5" /> },
    { id: 'tax', label: 'ภาษี & ลดหย่อน', icon: <Calculator className="w-5 h-5" /> },
    { id: 'invest', label: 'วางแผนลงทุน', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'advisor', label: 'AI ที่ปรึกษา', icon: <Sparkles className="w-5 h-5" /> },
  ];

  return (
    <nav
      aria-label="เมนูหลักด้านล่าง"
      className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 safe-area-bottom z-30 transition-colors"
    >
      <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors duration-150 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/80'
                    : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[11px] leading-tight mt-0.5 tracking-tight truncate max-w-full whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
