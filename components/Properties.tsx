
import React, { useState, useRef } from 'react';
import { Property, PropertyType } from '../types';

interface PropertiesProps {
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
}

export const Properties: React.FC<PropertiesProps> = ({ properties, setProperties }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Property>>({
    name: '',
    type: 'Flat',
  });

  const handleOpenModal = (prop?: Property) => {
    if (prop) {
      setEditingProp(prop);
      setFormData({ name: prop.name, type: prop.type });
    } else {
      setEditingProp(null);
      setFormData({ name: '', type: 'Flat' });
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
      const newProperties: Property[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const data: any = {};
        headers.forEach((h, idx) => { data[h] = values[idx]; });

        const type = data.type as PropertyType;
        newProperties.push({
          id: `p${Date.now()}-${i}`,
          name: data.name || 'Unknown Unit',
          type: ['Flat', 'Garage', 'Godown'].includes(type) ? type : 'Flat',
        });
      }

      if (newProperties.length > 0) {
        setProperties(prev => [...prev, ...newProperties]);
        alert(`Successfully imported ${newProperties.length} units.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProp) {
      setProperties(prev => prev.map(p => p.id === editingProp.id ? { ...p, ...formData } as Property : p));
    } else {
      const prop: Property = {
        id: `p${Date.now()}`,
        name: formData.name!,
        type: formData.type!,
      };
      setProperties(prev => [...prev, prop]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Properties</h2>
          <p className="text-slate-500 mt-1">Managed list of rental units (Flat, Garage, or Godown).</p>
        </div>
        <div className="flex items-center gap-2">
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
            <span>📥</span> Import Units
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <span>➕</span> Add Unit
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Property Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties.map((prop) => (
              <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{prop.name}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    prop.type === 'Flat' ? 'bg-indigo-100 text-indigo-700' : 
                    prop.type === 'Garage' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {prop.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleOpenModal(prop)} className="text-indigo-600 hover:underline text-sm font-medium">Edit</button>
                  <button onClick={() => setProperties(prev => prev.filter(p => p.id !== prop.id))} className="text-red-600 hover:underline text-sm font-medium ml-2">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {properties.length === 0 && (
          <div className="p-16 text-center text-slate-300">
            <p className="text-5xl mb-4">🏠</p>
            <p className="font-bold text-slate-400">No properties added yet.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-md shadow-2xl animate-in zoom-in-95">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingProp ? 'Edit Unit' : 'Add Property Unit'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Property Name / Label</label>
                <input required value={formData.name} className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Flat 101, Garage B, Godown 1, etc." onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                <select required value={formData.type} className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setFormData({...formData, type: e.target.value as PropertyType})}>
                  <option value="Flat">Flat</option>
                  <option value="Garage">Garage</option>
                  <option value="Godown">Godown</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
