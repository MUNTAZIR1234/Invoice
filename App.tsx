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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('tenants');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('properties');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [company, setCompany] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('company');
    return saved ? JSON.parse(saved) : { 
      name: 'QUEENS CHAMBERS', 
      address: '5th Floor, Flat A, 89 Maharshi Karve Road, Marine Lines Mumbai - 400020', 
      email: 'ac.queenschambers@gmail.com' 
    };
  });

  // Centralized restore function to handle data atomically
  const handleSystemRestore = useCallback((data: any) => {
    // 1. Update State
    if (data.tenants) setTenants(data.tenants);
    if (data.properties) setProperties(data.properties);
    if (data.invoices) setInvoices(data.invoices);
    if (data.expenses) setExpenses(data.expenses);
    if (data.company) setCompany(data.company);
    
    // 2. Persist to LocalStorage immediately
    localStorage.setItem('tenants', JSON.stringify(data.tenants || []));
    localStorage.setItem('properties', JSON.stringify(data.properties || []));
    localStorage.setItem('invoices', JSON.stringify(data.invoices || []));
    localStorage.setItem('expenses', JSON.stringify(data.expenses || []));
    localStorage.setItem('company', JSON.stringify(data.company || company));

    // 3. Force a hard reload to ensure React re-initializes with the new data
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, [company]);

  useEffect(() => {
    localStorage.setItem('tenants', JSON.stringify(tenants));
    localStorage.setItem('properties', JSON.stringify(properties));
    localStorage.setItem('invoices', JSON.stringify(invoices));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('company', JSON.stringify(company));
    localStorage.setItem('isLoggedIn', isAuthenticated.toString());
  }, [tenants, properties, invoices, expenses, company, isAuthenticated]);

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

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