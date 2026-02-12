
import React, { useState, useRef } from 'react';
import { Tenant, Property } from '../types';

interface TenantsProps {
  tenants: Tenant[];
  properties: Property[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
}

export const Tenants: React.FC<TenantsProps> = ({ tenants, properties, setTenants }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<Partial<Tenant>>({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    propertyId: '', 
    status: 'Active',
    rentAmount: 0,
    maintenanceAmount: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData(tenant);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name}? This will remove them from the registry but keep existing invoices.`)) {
      setTenants(prev => prev.filter(t => t.id !== id));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTenant(null);
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      address: '', 
      propertyId: '', 
      status: 'Active',
      rentAmount: 0,
      maintenanceAmount: 0
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTenant) {
      setTenants(prev => prev.map(t => t.id === editingTenant.id ? { ...formData as Tenant, id: t.id } : t));
    } else {
      const newTenant: Tenant = {
        ...formData as Tenant,
        id: `T-${Date.now().toString().slice(-4)}`
      };
      setTenants(prev => [...prev, newTenant]);
    }
    closeModal();
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    const splitCSVLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      return result;
    };

    const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = splitCSVLine(line);
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header] = values[i];
      });
      return obj;
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const rows = parseCSV(csvText);
        
        const mappedData: Tenant[] = rows.map((row, index) => {
          const addressValue = row.address || row['billing address'] || row['location'] || row['full address'] || '';
          const propertyIdValue = row.propertyid || row['unit id'] || row['unit'] || '';
          
          return {
            id: `T-IMP-${Date.now()}-${index}`,
            name: row.name || row['full name'] || 'Unknown',
            email: row.email || row['email address'] || '',
            phone: row.phone || row['mobile'] || row['contact'] || '',
            address: addressValue,
            propertyId: propertyIdValue,
            status: 'Active',
            rentAmount: Number(row.rent) || 0,
            maintenanceAmount: Number(row.maintenance) || 0
          };
        });

        if (mappedData.length > 0) {
          setTenants(prev => [...prev, ...mappedData]);
          alert(`Successfully imported ${mappedData.length} tenants.`);
        }
      } catch (err) {
        console.error(err);
        alert("Error parsing file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Tenants</h2>
          <p className="text-sm text-slate-500">Registry of all active and former residents.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <span>📊</span> Import CSV
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
            + Add Tenant
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Name</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Unit</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Monthly Rent</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Status</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tenants.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-5">
                   <p className="font-bold text-slate-900">{t.name}</p>
                   <p className="text-[10px] text-slate-400 font-medium">{t.phone || 'No phone'}</p>
                </td>
                <td className="px-8 py-5 text-slate-600 font-medium">
                  {properties.find(p => p.id === t.propertyId) ? (
                    (() => {
                      const p = properties.find(prop => prop.id === t.propertyId);
                      return `${p?.type} - ${p?.name}`;
                    })()
                  ) : (
                    <span className="text-rose-400 italic text-xs">Unassigned</span>
                  )}
                </td>
                <td className="px-8 py-5">
                   <p className="font-black text-indigo-600 text-sm">₹{(t.rentAmount + t.maintenanceAmount).toLocaleString()}</p>
                   <p className="text-[9px] text-slate-400 uppercase tracking-tighter">Base: ₹{t.rentAmount.toLocaleString()} | Maint: ₹{t.maintenanceAmount.toLocaleString()}</p>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    t.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>{t.status}</span>
                </td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button 
                    onClick={() => handleEditClick(t)}
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(t.id, t.name)}
                    className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-4xl mb-4">👥</p>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No tenants registered</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black">{editingTenant ? 'Edit Profile' : 'New Tenant Registry'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-900">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 block mb-1">Full Name</label>
                <input value={formData.name} placeholder="e.g. John Doe" required className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold border border-transparent focus:border-indigo-500 transition-all" onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-indigo-400 ml-2 block mb-1">Base Monthly Rent</label>
                  <input type="number" value={formData.rentAmount} required className="w-full p-4 bg-indigo-50/50 rounded-xl outline-none font-black text-indigo-600 border border-indigo-100" onChange={e => setFormData({...formData, rentAmount: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 block mb-1">Maint. Charge</label>
                  <input type="number" value={formData.maintenanceAmount} required className="w-full p-4 bg-slate-50 rounded-xl outline-none font-black text-slate-600 border border-transparent focus:border-indigo-500" onChange={e => setFormData({...formData, maintenanceAmount: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 block mb-1">Email</label>
                  <input value={formData.email} placeholder="email@example.com" type="email" className="w-full p-4 bg-slate-50 rounded-xl outline-none font-medium border border-transparent focus:border-indigo-500" onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 block mb-1">Phone</label>
                  <input value={formData.phone} placeholder="Phone number" className="w-full p-4 bg-slate-50 rounded-xl outline-none font-medium border border-transparent focus:border-indigo-500" onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 block mb-1">Billing Address</label>
                <textarea value={formData.address} placeholder="Full address..." rows={2} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-medium border border-transparent focus:border-indigo-500" onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 block mb-1">Assigned Unit</label>
                <select value={formData.propertyId} required className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold border border-transparent focus:border-indigo-500" onChange={e => setFormData({...formData, propertyId: e.target.value})}>
                  <option value="">Assign Unit...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.type} - {p.name}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all mt-4">
                {editingTenant ? 'Save Profile' : 'Register & Start Billing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
