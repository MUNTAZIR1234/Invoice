import React, { useState, useRef } from 'react';
import { Property, PropertyType, Tenant } from '../types';

interface PropertiesProps {
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  tenants: Tenant[];
}

export const Properties: React.FC<PropertiesProps> = ({ properties, setProperties, tenants }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<Partial<Property>>({ name: '', type: 'Flat' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = (prop: Property) => {
    setEditingProperty(prop);
    setFormData(prop);
    setIsModalOpen(true);
  };

  const handleDelete = (propertyId: any) => {
    // Explicitly stringify IDs for reliable comparison
    const targetId = String(propertyId).trim();
    
    // Safety check for occupancy
    const isOccupied = tenants.some(t => {
      if (!t.propertyId) return false;
      return String(t.propertyId).trim() === targetId;
    });
    
    if (isOccupied) {
      alert("⚠️ CANNOT DELETE UNIT\n\nThis unit is currently assigned to a tenant. Please unassign or remove the tenant before deleting this property.");
      return;
    }

    const propName = properties.find(p => String(p.id) === targetId)?.name || "this unit";
    if (window.confirm(`Are you sure you want to delete "${propName}"? This action cannot be reversed.`)) {
      setProperties(prev => prev.filter(p => String(p.id) !== targetId));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProperty(null);
    setFormData({ name: '', type: 'Flat' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProperty) {
      setProperties(prev => prev.map(p => p.id === editingProperty.id ? { ...formData as Property, id: p.id } : p));
    } else {
      const newProp: Property = {
        ...formData as Property,
        id: `P-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`
      };
      setProperties(prev => [...prev, newProp]);
    }
    closeModal();
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
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
        
        const mappedData: Property[] = rows.map((row, index) => ({
          id: `P-IMP-${Date.now()}-${index}`,
          name: row.name || 'Unnamed Unit',
          type: (row.type || 'Flat') as PropertyType,
          address: row.address || ''
        }));

        if (mappedData.length > 0) {
          setProperties(prev => [...prev, ...mappedData]);
          alert(`Successfully imported ${mappedData.length} properties.`);
        }
      } catch (err) {
        alert("Error parsing file. Please ensure it is a valid CSV/Excel export with headers: Name, Type");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Properties</h2>
          <p className="text-sm text-slate-500">Asset portfolio and unit inventory.</p>
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
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>📊</span> Import CSV
          </button>
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)} 
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all cursor-pointer active:scale-95"
          >
            + Add Unit
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">ID</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Unit Name</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Category</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-center">Occupancy</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {properties.map(p => {
              const targetId = String(p.id).trim();
              const isOccupied = tenants.some(t => t.propertyId && String(t.propertyId).trim() === targetId);
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5 text-xs font-mono text-slate-400">{p.id}</td>
                  <td className="px-8 py-5 font-bold text-slate-900">{p.name}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      p.type === 'Flat' ? 'bg-indigo-50 text-indigo-600' : 
                      p.type === 'Garage' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    {isOccupied ? (
                      <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded uppercase tracking-widest">Occupied</span>
                    ) : (
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Vacant</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button 
                      type="button"
                      onClick={() => handleEditClick(p)}
                      className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95"
                    >
                      Edit
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDelete(p.id)} 
                      className="bg-rose-50 text-rose-500 border border-transparent hover:border-rose-200 hover:bg-rose-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {properties.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-4xl mb-4">🏠</p>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No properties registered</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black">{editingProperty ? 'Edit Unit' : 'Add New Unit'}</h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-900 font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="text-xs font-black uppercase text-slate-400 block mb-2">Unit Identifier</label>
                <input value={formData.name} placeholder="e.g. Flat 101" required className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold border border-transparent focus:border-indigo-500 transition-all" onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-400 block mb-2">Category</label>
                <select value={formData.type} required className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold border border-transparent focus:border-indigo-500 transition-all" onChange={e => setFormData({...formData, type: e.target.value as PropertyType})}>
                  <option value="Flat">Flat</option>
                  <option value="Garage">Garage</option>
                  <option value="Godown">Godown</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all cursor-pointer active:scale-95">
                {editingProperty ? 'Save Changes' : 'Register Unit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};