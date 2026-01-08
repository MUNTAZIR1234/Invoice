import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tenants', label: 'Tenants', icon: '👥' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'properties', label: 'Properties', icon: '🏠' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'assistant', label: 'AI Assistant', icon: '✨' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-slate-800 bg-slate-900/50 text-center">
          <h1 className="text-xl font-black tracking-tighter text-indigo-400">QUEENS CHAMBERS</h1>
          <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-[0.3em] font-black">Management Portal</p>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02] font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className={`text-xl transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* Footer info & Logout */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-3 px-2 py-2 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
              QC
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-black text-slate-200 truncate uppercase tracking-wider">Admin User</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-widest">Secured</span>
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); onLogout(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-black uppercase tracking-[0.2em]"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-slate-50 custom-scrollbar scroll-smooth">
        <div className="p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};