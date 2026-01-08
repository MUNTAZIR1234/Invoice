
import React, { useState, useMemo, useRef } from 'react';
import { Tenant, Property } from '../types';

interface TenantsProps {
  tenants: Tenant[];
  properties: Property[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
}

export const Tenants: React.FC<TenantsProps> = ({ tenants, properties, setTenants }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Tenant>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    propertyId: '',
    // Fix: Added missing status to initial state
    status: 'Active',
  });

  const handleOpenModal = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData(tenant);
    } else {
      setEditingTenant(null);
      // Fix: Added missing status when resetting form
      setFormData({ name: '', email: '', phone: '', address: '', propertyId: '', status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const newTenants: Tenant[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const data: any = {};
        headers.forEach((h, idx) => { data[h] = values[idx]; });

        // Match property by name if provided, otherwise leave blank or find first
        let propId = data.propertyid || '';
        if (!propId && data.property) {
          const match = properties.find(p => p.name.toLowerCase() === data.property.toLowerCase());
          if (match) propId = match.id;
        }

        // Fix: Added missing status to imported tenants
        newTenants.push({
          id: `t${Date.now()}-${i}`,
          name: data.name || 'Unknown',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          propertyId: propId || (properties.length > 0 ? properties[0].id : ''),
          status: (data.status as any) || 'Active',
        });
      }

      if (newTenants.length > 0) {
        setTenants(prev => [...prev, ...newTenants]);
        alert(`Successfully imported ${newTenants.length} tenants.`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTenant) {
      setTenants(prev => prev.map(t => t.id === editingTenant.id ? { ...t, ...formData } as Tenant : t));
    } else {
      // Fix: Added missing status to new tenant object
      const tenant: Tenant = {
        id: `t${Date.now()}`,
        name: formData.name!,
        email: formData.email!,
        phone: formData.phone!,
        address: formData.address || '',
        propertyId: formData.propertyId!,
        status: formData.status || 'Active',
      };
      setTenants(prev => [...prev, tenant]);
    }
    setIsModalOpen(false);
  };

  const filteredAndSortedTenants = useMemo(() => {
    let result = [...tenants];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.email.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q)
      );
    }

    if (propertyFilter !== 'All') {
      result = result.filter(t => t.propertyId === propertyFilter);
    }

    return result.sort((a, b) => {
      const propA = properties.find(p => p.id === a.propertyId);
      const propB = properties.find(p => p.id === b.propertyId);
      const nameA = propA ? `${propA.type} ${propA.name}` : '';
      const nameB = propB ? `${propB.type} ${propB.name}` : '';
      
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [tenants, properties, propertyFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Tenants</h2>
          <p className="text-slate-500 mt-1">Manage tenant contacts, addresses, and unit assignments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            onClick={handleImportClick}
            className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <span>📥</span> Import CSV
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <span>➕</span> Add Tenant
          </button>
        </div>
      </header>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Search name, email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Filter Property:</label>
          <select 
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="flex-1 md:flex-none px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium text-slate-700"
          >
            <option value="All">All Properties</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.type} {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Tenant & Contact</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Address</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Property</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAndSortedTenants.map((tenant) => {
              const prop = properties.find(p => p.id === tenant.propertyId);
              return (
                <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{tenant.name}</div>
                    <div className="text-xs text-slate-500">{tenant.email} • {tenant.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[200px]">
                    {tenant.address || <span className="text-slate-300 italic">No address</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium px-2.5 py-1 bg-indigo-50 rounded-lg text-indigo-700 whitespace-nowrap">
                      {prop ? `${prop.type} ${prop.name}` : 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(tenant)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">✏️ Edit</button>
                    <button onClick={() => setTenants(prev => prev.filter(t => t.id !== tenant.id))} className="text-slate-400 hover:text-red-600 text-sm ml-2">🗑️ Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredAndSortedTenants.length === 0 && (
          <div className="p-16 text-center text-slate-300">
            <p className="text-5xl mb-4">👥</p>
            <p className="font-bold text-slate-400">
              {searchQuery || propertyFilter !== 'All' ? 'No matching tenants found.' : 'No tenants registered.'}
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingTenant ? 'Edit Tenant' : 'New Tenant'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input value={formData.name} required className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" value={formData.email} required className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                  <input value={formData.phone} required className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tenant Address</label>
                <textarea value={formData.address} rows={2} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Enter permanent or billing address" onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Assigned Property</label>
                <select value={formData.propertyId} required className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" onChange={e => setFormData({...formData, propertyId: e.target.value})}>
                  <option value="">Select a property</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.type} {p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
