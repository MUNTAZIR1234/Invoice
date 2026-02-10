import React from 'react';
import { Tenant, Property, Invoice, Expense } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

interface DashboardProps {
  tenants: Tenant[];
  properties: Property[];
  invoices: Invoice[];
  expenses: Expense[];
}

const formatDateDDMMYYYY = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const Dashboard: React.FC<DashboardProps> = ({ tenants, properties, invoices, expenses }) => {
  const totalRevenue = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netIncome = totalRevenue - totalExpenses;
  const occupancy = properties.length > 0 ? (tenants.length / properties.length) * 100 : 0;

  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const data: any[] = [];
    
    const monthlyRevenue = invoices.reduce((acc: any, inv) => {
      const date = new Date(inv.createdAt);
      if (date.getFullYear() === currentYear) {
        const month = months[date.getMonth()];
        acc[month] = (acc[month] || 0) + inv.totalAmount;
      }
      return acc;
    }, {});

    months.forEach(m => {
      data.push({ name: m, revenue: monthlyRevenue[m] || 0 });
    });

    return data;
  };

  const getExpenseCategoryData = () => {
    const categories = expenses.reduce((acc: any, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    return Object.keys(categories).map(cat => ({
      name: cat,
      value: categories[cat]
    }));
  };

  const chartData = getMonthlyData();
  const expensePieData = getExpenseCategoryData();
  const unitPieData = [
    { name: 'Occupied', value: tenants.length },
    { name: 'Vacant', value: Math.max(0, properties.length - tenants.length) }
  ];

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];
  const STATUS_COLORS = ['#6366f1', '#e2e8f0'];

  return (
    <div className="space-y-8 animate-in">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Portfolio Dashboard</h2>
        <p className="text-slate-500 font-medium">Global summary of assets, receivables, and expenditures.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon="💰" color="text-indigo-600" />
        <StatCard title="Total Expenses" value={`₹${totalExpenses.toLocaleString()}`} icon="💸" color="text-rose-600" />
        <StatCard title="Net Income" value={`₹${netIncome.toLocaleString()}`} icon="📈" color="text-emerald-600" />
        <StatCard title="Occupancy" value={`${occupancy.toFixed(0)}%`} icon="🏢" color="text-slate-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black mb-6 uppercase tracking-wider text-slate-400">Revenue Trend ({new Date().getFullYear()})</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-black mb-6 uppercase tracking-wider text-slate-400">Unit Occupancy</h3>
          <div className="flex-1 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={unitPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {unitPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 text-center">
             <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Units Managed</p>
             <p className="text-2xl font-black text-slate-900">{properties.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black mb-6 uppercase tracking-wider text-slate-400">Expense Breakdown</h3>
          <div className="h-[300px]">
            {expensePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                No Expenses Logged
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black mb-6 uppercase tracking-wider text-slate-400">Recent Invoices</h3>
          <div className="space-y-4">
            {invoices.length > 0 ? (
              invoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-default">
                  <div>
                    <p className="font-bold text-slate-900">{inv.id}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{formatDateDDMMYYYY(inv.createdAt)}</p>
                      <span className="text-[10px] text-indigo-300">/</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Rec: {formatDateDDMMYYYY(inv.dateOfReceipt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-indigo-600">₹{inv.totalAmount.toLocaleString()}</p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                      inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-300">
                <p className="text-sm font-bold uppercase tracking-widest">No activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
    <div className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-2xl">{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
      <p className={`text-xl font-black mt-0.5 ${color}`}>{value}</p>
    </div>
  </div>
);