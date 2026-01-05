
import React from 'react';
import { CompanyInfo, InvoiceSettings } from '../types';

interface SystemSettingsProps {
  onReset: () => void;
  company: CompanyInfo;
  setCompany: React.Dispatch<React.SetStateAction<CompanyInfo>>;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ onReset, company, setCompany }) => {
  const settings = company.invoiceSettings || {
    primaryColor: '#4f46e5',
    fontFamily: 'helvetica',
    headerLayout: 'standard',
    showBankDetails: true,
    showTenantContact: true
  };

  const updateSettings = (updates: Partial<InvoiceSettings>) => {
    setCompany(prev => ({
      ...prev,
      invoiceSettings: { ...settings, ...updates }
    }));
  };

  const colorOptions = [
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Amber', value: '#d97706' },
    { name: 'Slate', value: '#475569' },
    { name: 'Deep Blue', value: '#1e3a8a' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Configure your company profile and system preferences.</p>
      </header>

      <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Company Profile */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="text-indigo-500">🏢</span> Company Profile
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Business Name</label>
                  <input 
                    value={company.name}
                    onChange={e => setCompany({...company, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Billing Email</label>
                  <input 
                    value={company.email}
                    onChange={e => setCompany({...company, email: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Office Address</label>
                  <textarea 
                    value={company.address}
                    rows={3}
                    onChange={e => setCompany({...company, address: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-rose-600 mb-2">Danger Zone</h3>
                <p className="text-sm text-rose-700 mb-6 leading-relaxed">
                  Actions here are permanent. Factory Reset will wipe all tenant, property, and invoice history.
                </p>
                
                <button 
                  onClick={onReset}
                  className="w-full bg-rose-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
                >
                  Factory Reset System
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Customization */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-fit">
            <div className="p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="text-indigo-500">🎨</span> Invoice Template
              </h3>
              
              <div className="space-y-6">
                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Branding Color</label>
                  <div className="grid grid-cols-6 gap-3">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        onClick={() => updateSettings({ primaryColor: color.value })}
                        title={color.name}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${
                          settings.primaryColor === color.value ? 'border-slate-300 scale-110 shadow-md' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </div>
                </div>

                {/* Font Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Typography</label>
                  <select 
                    value={settings.fontFamily}
                    onChange={e => updateSettings({ fontFamily: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="helvetica">Helvetica (Modern Sans)</option>
                    <option value="times">Times (Classic Serif)</option>
                    <option value="courier">Courier (Typewriter)</option>
                  </select>
                </div>

                {/* Layout Style */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Header Layout</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateSettings({ headerLayout: 'standard' })}
                      className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        settings.headerLayout === 'standard' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => updateSettings({ headerLayout: 'modern' })}
                      className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        settings.headerLayout === 'modern' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'
                      }`}
                    >
                      Modern Top
                    </button>
                  </div>
                </div>

                {/* Visibility Toggles */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Display Bank Details</span>
                    <button 
                      onClick={() => updateSettings({ showBankDetails: !settings.showBankDetails })}
                      className={`w-12 h-6 rounded-full transition-all relative ${settings.showBankDetails ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.showBankDetails ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Display Tenant Contact</span>
                    <button 
                      onClick={() => updateSettings({ showTenantContact: !settings.showTenantContact })}
                      className={`w-12 h-6 rounded-full transition-all relative ${settings.showTenantContact ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.showTenantContact ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
