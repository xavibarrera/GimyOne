import React from 'react';
import { Dumbbell, Calendar, History, TrendingUp, Settings } from 'lucide-react';

export type NavTab = 'rutina' | 'historial' | 'memoria' | 'progresion' | 'ajustes';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'rutina' as NavTab, label: 'Rutina', icon: Dumbbell },
    { id: 'historial' as NavTab, label: 'Historial', icon: Calendar },
    { id: 'memoria' as NavTab, label: 'Pesos', icon: History },
    { id: 'progresion' as NavTab, label: 'Progresión', icon: TrendingUp },
    { id: 'ajustes' as NavTab, label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-md pb-safe">
      <div className="max-w-xl mx-auto grid grid-cols-5 items-center h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center relative py-1 transition-all active:scale-95 ${
                isActive ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span
                className={`text-[10px] tracking-tight mt-1 whitespace-nowrap shrink-0 ${
                  isActive ? 'font-bold text-white' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
