import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  Wrench,
  Activity,
  TrainTrack,
} from 'lucide-react';

export type ScreenTab = 'dashboard' | 'planner' | 'assets' | 'corridors';

interface SidebarProps {
  currentTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    {
      id: 'dashboard' as ScreenTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'planner' as ScreenTab,
      label: 'AI Planner',
      icon: BrainCircuit,
      badge: 'CP-SAT',
    },
    {
      id: 'assets' as ScreenTab,
      label: 'Maintenance Assets',
      icon: Wrench,
    },
    {
      id: 'corridors' as ScreenTab,
      label: 'Corridor Monitor',
      icon: Activity,
    },
  ];

  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
          <TrainTrack className="w-5 h-5" />
        </div>
        <div>
          <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            RailAID
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Slot Optimizer
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-blue-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px]">Backend API: Connected</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">Indian Railways Network v1.0</div>
      </div>
    </aside>
  );
};
