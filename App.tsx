
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Tenants } from './components/Tenants';
import { Invoices } from './components/Invoices';
import { Properties } from './components/Properties';
import { Expenses } from './components/Expenses';
import { AIAssistant } from './components/AIAssistant';
import { Reports } from './components/Reports';
import { SystemSettings } from './components/SystemSettings';
import { Login } from './components/Login';
import { Tenant, Property, Invoice, CompanyInfo, Expense } from './types';
import { supabaseService, isCloudEnabled } from './services/supabaseService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [company, setCompany] = useState<CompanyInfo>({ 
    name: 'QUEENS CHAMBERS', 
    address: '5th Floor, Flat A, 89 Maharshi Karve Road, Marine Lines Mumbai - 400020', 
    email: 'ac.queenschambers@gmail.com' 
  });

  // Initial Data Load
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      if (isCloudEnabled) {
        try {
          const data = await supabaseService.fetchAll();
          if (data) {
            setTenants(data.tenants);
            setProperties(data.properties);
            setInvoices(data.invoices);
            setExpenses(data.expenses);
            if (data.company) setCompany(data.company);
          }
        } catch (err) {
          console.error("Cloud fetch failed, using local fallback", err);
          loadLocalFallback();
        }
      } else {
        loadLocalFallback();
      }
      setIsLoading(false);
    };

    const loadLocalFallback = () => {
      const savedTenants = localStorage.getItem('tenants');
      const savedProperties = localStorage.getItem('properties');
      const savedInvoices = localStorage.getItem('invoices');
      const savedExpenses = localStorage.getItem('expenses');
      const savedCompany = localStorage.getItem('company');

      if (savedTenants) setTenants(JSON.parse(savedTenants));
      if (savedProperties) setProperties(JSON.parse(savedProperties));
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedCompany) setCompany(JSON.parse(savedCompany));
    };

    initData();
  }, []);

  // Persistence logic (Sync to Cloud + Local Backup)
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('tenants', JSON.stringify(tenants));
      localStorage.setItem('properties', JSON.stringify(properties));
      localStorage.setItem('invoices', JSON.stringify(invoices));
      localStorage.setItem('expenses', JSON.stringify(expenses));
      localStorage.setItem('company', JSON.stringify(company));
      localStorage.setItem('isLoggedIn', isAuthenticated.toString());

      if (isCloudEnabled) {
        // Debounced or simple sync
        supabaseService.syncData('tenants', tenants);
        supabaseService.syncData('properties', properties);
        supabaseService.syncData('invoices', invoices);
        supabaseService.syncData('expenses', expenses);
        supabaseService.syncData('company', [company]); // wrap in array for upsert
      }
    }
  }, [tenants, properties, invoices, expenses, company, isAuthenticated, isLoading]);

  const handleSystemRestore = useCallback((data: any) => {
    if (data.tenants) setTenants(data.tenants);
    if (data.properties) setProperties(data.properties);
    if (data.invoices) setInvoices(data.invoices);
    if (data.expenses) setExpenses(data.expenses);
    if (data.company) setCompany(data.company);
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, []);

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;
  if (isLoading) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center text-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing Portfolio...</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard tenants={tenants} properties={properties} invoices={invoices} expenses={expenses} />;
      case 'tenants': return <Tenants tenants={tenants} properties={properties} setTenants={setTenants} />;
      case 'invoices': return <Invoices invoices={invoices} tenants={tenants} properties={properties} company={company} setInvoices={setInvoices} />;
      case 'properties': return <Properties properties={properties} setProperties={setProperties} tenants={tenants} />;
      case 'expenses': return <Expenses expenses={expenses} properties={properties} setExpenses={setExpenses} />;
      case 'reports': return <Reports tenants={tenants} properties={properties} invoices={invoices} company={company} />;
      case 'assistant': return <AIAssistant tenants={tenants} invoices={invoices} properties={properties} />;
      case 'settings': return (
        <SystemSettings 
          company={company} 
          setCompany={setCompany} 
          tenants={tenants}
          properties={properties}
          invoices={invoices}
          expenses={expenses}
          onLogout={() => setIsAuthenticated(false)} 
          setActiveTab={setActiveTab}
          onRestore={handleSystemRestore}
        />
      );
      default: return <Dashboard tenants={tenants} properties={properties} invoices={invoices} expenses={expenses} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setIsAuthenticated(false)}>
      {renderContent()}
    </Layout>
  );
};

export default App;
