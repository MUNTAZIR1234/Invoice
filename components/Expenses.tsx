
import React, { useState } from 'react';
import { Expense, Property } from '../types';

interface ExpensesProps {
  expenses: Expense[];
  properties: Property[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, properties, setExpenses }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    propertyId: '',
    amount: 0,
    category: 'Maintenance',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const categories = ['Maintenance', 'Tax', 'Insurance', 'Utilities', 'Legal', 'Management Fee', 'Other'];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const expense: Expense = {
      id: `EXP-${Date.now()}`,
      propertyId: newExpense.propertyId!,
      amount: Number(newExpense.amount!),
      category: newExpense.category!,
      date: newExpense.date!,
      description: newExpense.description!,
    };
    setExpenses(prev => [...prev, expense]);
    setIsModalOpen(false);
    setNewExpense({ propertyId: '', amount: 0, category: 'Maintenance', date: new Date().toISOString().split('T')[0], description: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Expenses</h2>
          <p className="text-slate-500 mt-1">Track outgoings and maintenance costs.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-rose-700 transition-all flex items-center gap-2 shadow-lg shadow-rose-200"
        >
          <span>📉</span> Log Expense
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Property</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Description</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {expenses.map((exp) => {
              const property = properties.find(p => p.id === exp.propertyId);
              return (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Fix: Property interface uses 'name' instead of 'address' */}
                  <td className="px-6 py-4 font-semibold text-slate-800">{property?.name || 'General'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-tight">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{exp.description}</td>
                  <td className="px-6 py-4 text-right font-bold text-rose-600">-${exp.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm text-slate-400">{exp.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <div className="p-16 text-center text-slate-300">
            <p className="text-5xl mb-4">💸</p>
            <p className="font-bold text-slate-400">No expenses recorded yet.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Log New Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAdd} className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Property</label>
                <select required className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none" onChange={e => setNewExpense({...newExpense, propertyId: e.target.value})}>
                  <option value="">Select property...</option>
                  {/* Fix: Property interface uses 'name' instead of 'address' */}
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                <select required className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none" onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount ($)</label>
                <input required type="number" className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none" placeholder="0.00" onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea required className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none" rows={3} placeholder="Repair for leaking pipe in kitchen..." onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-semibold">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};