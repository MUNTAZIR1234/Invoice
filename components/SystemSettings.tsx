import React, { useRef, useState, useEffect } from 'react';
import { CompanyInfo, Tenant, Property, Invoice, Expense, PropertyType, InvoiceStatus } from '../types';

interface SystemSettingsProps {
  company: CompanyInfo;
  setCompany: React.Dispatch<React.SetStateAction<CompanyInfo>>;
  tenants: Tenant[];
  properties: Property[];
  invoices: Invoice[];
  expenses: Expense[];
  onLogout: () => void;
  setActiveTab: (tab: string) => void;
  onRestore: (data: any) => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ 
  company, 
  setCompany, 
  tenants,
  properties,
  invoices,
  expenses,
  onLogout,
  setActiveTab,
  onRestore
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [storageUsage, setStorageUsage] = useState<string>('0 KB');
  const [dirHandle, setDirHandle] = useState<any>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    // Detect if running inside an iframe (which blocks showDirectoryPicker and PWA Install)
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });

    // Calculate localStorage usage
    let _lsTotal = 0, _xLen, _x;
    for (_x in localStorage) {
      if (!localStorage.hasOwnProperty(_x)) continue;
      _xLen = ((localStorage[_x].length + _x.length) * 2);
      _lsTotal += _xLen;
    }
    setStorageUsage((_lsTotal / 1024).toFixed(2) + " KB");
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') setInstallPrompt(null);
      });
    } else {
      alert("🖥️ PC INSTALLATION GUIDE\n\n1. If you don't see an 'Install' icon in the address bar, it's because you are currently viewing this in a 'Preview' or 'Frame' window.\n\n2. To fix this: Click the 'Open in New Tab' button (top right of screen) to see the full address bar.\n\n3. Once in a full tab, the (+) Install icon will appear next to the website address.");
    }
  };

  const exportMasterCSV = () => {
    // Create headers for a comprehensive audit
    const headers = [
      "Tenant Name",
      "Phone",
      "Email",
      "Property Name",
      "Property Type",
      "Unit Status",
      "Total Invoices",
      "Total Amount (₹)",
      "Total Paid (₹)",
      "Outstanding (₹)"
    ];

    const rows = tenants.map(tenant => {
      const prop = properties.find(p => p.id === tenant.propertyId);
      const tenantInvoices = invoices.filter(inv => inv.tenantId === tenant.id);
      
      const totalAmount = tenantInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPaid = tenantInvoices
        .filter(inv => inv.status === 'Paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
      const outstanding = totalAmount - totalPaid;

      return [
        `"${tenant.name.replace(/"/g, '""')}"`,
        `"${(tenant.phone || '').replace(/"/g, '""')}"`,
        `"${(tenant.email || '').replace(/"/g, '""')}"`,
        `"${(prop?.name || 'Unassigned').replace(/"/g, '""')}"`,
        `"${prop?.type || 'N/A'}"`,
        `"${tenant.status}"`,
        tenantInvoices.length,
        totalAmount,
        totalPaid,
        outstanding
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `QUEENS_CHAMBERS_MASTER_AUDIT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const linkToDesktopFolder = async () => {
    if (isIframe) {
      alert("🔒 SECURITY RESTRICTION\n\nDirect hard drive access is restricted while running inside a frame. Use Manual Save.");
      return;
    }

    try {
      // @ts-ignore - Modern browser API
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setDirHandle(handle);
      alert(`✅ FOLDER LINKED: ${handle.name}`);
    } catch (err: any) {
      console.error(err);
      alert("Folder link was blocked. Use the 'Manual Save' method below.");
    }
  };

  const syncToLocalFolder = async () => {
    if (!dirHandle) return;
    setSyncLoading(true);
    try {
      const data = { company, tenants, properties, invoices, expenses, lastSync: new Date().toISOString() };
      const fileHandle = await dirHandle.getFileHandle('portfolio_data.json', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      alert("✅ DATA SYNCED SUCCESSFULLY TO DISK");
    } catch (err) {
      alert("Sync failed. Please re-link your folder.");
      setDirHandle(null);
    } finally {
      setSyncLoading(false);
    }
  };

  const manualSaveToDisk = () => {
    const data = { company, tenants, properties, invoices, expenses, lastSync: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio_data.json';
    link.click();
    URL.revokeObjectURL(url);
    
    alert("📥 DOWNLOADED!\n\nMove 'portfolio_data.json' from your Downloads folder to:\nC:\\Users\\DELL\\Desktop\\QUEENS CHAMBERS\\Software");
  };

  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (confirm("OVERWRITE DATA?\n\nThis replaces all current tenants/properties with the contents of this file.")) {
          onRestore(data);
        }
      } catch (err) {
        alert("Invalid file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8 animate-in">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Storage & Backup</h2>
          <p className="text-slate-500 font-medium italic">Path: C:\Users\DELL\Desktop\QUEENS CHAMBERS\Software</p>
        </div>
        <button 
          onClick={handleInstallClick} 
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          🖥️ Install Desktop App
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-2xl relative overflow-hidden">
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Hard Drive Controller</h3>
            
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Target Directory</p>
                <code className="text-[10px] text-indigo-300 break-all font-mono">QUEENS CHAMBERS\Software</code>
              </div>

              {!dirHandle ? (
                <div className="space-y-3">
                  {!isIframe && (
                    <button 
                      onClick={linkToDesktopFolder}
                      className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-indigo-500"
                    >
                      📂 Link PC Folder (Auto-Sync)
                    </button>
                  )}
                  
                  <button 
                    onClick={manualSaveToDisk}
                    className="w-full bg-white text-slate-900 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-indigo-50"
                  >
                    📥 Manual Save to Software Folder
                  </button>
                </div>
              ) : (
                <button 
                  onClick={syncToLocalFolder}
                  disabled={syncLoading}
                  className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-emerald-400"
                >
                  {syncLoading ? 'Syncing...' : '⚡ Sync Data to Disk Now'}
                </button>
              )}

              <div className="pt-4 border-t border-slate-800">
                <input type="file" ref={fileInputRef} onChange={handleRestoreFromFile} className="hidden" accept=".json" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-300 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:text-white"
                >
                  🔄 Restore System from PC File
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-lg font-black uppercase tracking-widest text-slate-400">Owner Identity</h3>
            <div className="space-y-4">
              <input value={company.name} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold border border-transparent focus:border-indigo-500" onChange={e => setCompany({...company, name: e.target.value})} placeholder="Company Name" />
              <input value={company.email} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold border border-transparent focus:border-indigo-500" onChange={e => setCompany({...company, email: e.target.value})} placeholder="Email" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 space-y-4">
            <h3 className="text-lg font-black uppercase tracking-widest text-emerald-500">Universal Audit</h3>
            <p className="text-xs text-emerald-700 font-medium">Generate a complete spreadsheet of all tenants, property assignments, and their current financial balances.</p>
            <button 
              onClick={exportMasterCSV}
              className="w-full bg-white text-emerald-600 border border-emerald-200 p-4 rounded-2xl font-black shadow-sm hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
            >
              📊 Export Master Excel (CSV)
            </button>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-rose-100 space-y-4">
            <h3 className="text-lg font-black uppercase tracking-widest text-rose-500">System Security</h3>
            <button onClick={onLogout} className="w-full bg-white text-rose-600 border border-rose-200 p-4 rounded-2xl font-black shadow-sm hover:bg-rose-100 transition-all">
              🚪 Terminate Session & Lock
            </button>
            <div className="flex justify-between items-center px-4">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Cache</span>
               <span className="text-xs font-black text-slate-600">{storageUsage}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};