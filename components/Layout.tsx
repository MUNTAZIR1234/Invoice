
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
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'assistant', label: 'AI Assistant', icon: '✨' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLogout();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight text-indigo-400">QUEENS CHAMBERS</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Property Management</p>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* Profile & Logout Section */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shadow-inner">
              QC
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">Administrator</p>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Secure Session</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-95 text-sm font-semibold"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
