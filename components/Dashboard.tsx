
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Tenant, Property, Invoice } from '../types';

interface DashboardProps {
  tenants: Tenant[];
  properties: Property[];
  invoices: Invoice[];
}

export const Dashboard: React.FC<DashboardProps> = ({ tenants, properties, invoices }) => {
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  
  const occupancyRate = properties.length > 0 
    ? (tenants.length / properties.length) * 100 
    : 0;

  // Analysis by property type
  const typeAnalysis = properties.reduce((acc: any, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(typeAnalysis).map(type => ({
    name: type,
    count: typeAnalysis[type]
  }));

  const COLORS = ['#4f46e5', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Portfolio Dashboard</h2>
        <p className="text-slate-500 mt-1">Real-time overview of your property portfolio.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Invoiced" value={`₹${totalInvoiced.toLocaleString()}`} icon="📄" color="bg-indigo-50 text-indigo-600" />
        <StatCard title="Total Tenants" value={tenants.length.toString()} icon="👥" color="bg-emerald-50 text-emerald-600" />
        <StatCard title="Total Properties" value={properties.length.toString()} icon="🏢" color="bg-amber-50 text-amber-600" />
        <StatCard title="Occupancy" value={`${occupancyRate.toFixed(1)}%`} icon="🏠" color="bg-slate-50 text-slate-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Unit Type Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6">Units by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '12px', border: 'none'}}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Health */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-4">Portfolio Summary</h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Assets</p>
              <p className="text-xl font-bold text-slate-900">{properties.length} Units Managed</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Active Tenancy</p>
              <p className="text-xl font-bold text-emerald-700">{tenants.length} Occupied</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl">
              <p className="text-xs font-bold text-amber-600 uppercase mb-1">Vacancies</p>
              <p className="text-xl font-bold text-amber-700">{properties.length - tenants.length} Units Empty</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);
