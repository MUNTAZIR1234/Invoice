
import React, { useState, useEffect } from 'react';
import { isCloudEnabled } from '../services/supabaseService';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tenants', label: 'Tenants', icon: '👥' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'properties', label: 'Properties', icon: '🏠' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'assistant', label: 'AI Insights', icon: '✨' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-slate-800">
          <h1 className="text-xl font-black tracking-tighter text-indigo-400">QUEENS CHAMBERS</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
              {isOnline ? 'Network Connected' : 'Network Offline'}
            </p>
          </div>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="px-6 py-4 mx-4 mb-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
           <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">
             {isCloudEnabled ? 'Cloud Database' : 'Local PC Storage'}
           </p>
           <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold flex items-center gap-1 ${isCloudEnabled ? 'text-indigo-400' : 'text-emerald-400'}`}>
                 <span className={isCloudEnabled ? 'animate-pulse' : ''}>●</span> 
                 {isCloudEnabled ? 'Supabase Sync On' : 'Local Sync Only'}
              </span>
              <span className="text-[10px] text-slate-500">{isCloudEnabled ? 'LIVE' : 'DISK'}</span>
           </div>
        </div>

        <div className="p-6 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
