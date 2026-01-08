import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Tenants } from './components/Tenants';
import { Invoices } from './components/Invoices';
import { Properties } from './components/Properties';
import { AIAssistant } from './components/AIAssistant';
import { SystemSettings } from './components/SystemSettings';
import { Reports } from './components/Reports';
import { Expenses } from './components/Expenses';
import { Login } from './components/Login';
import { Tenant, Property, Invoice, CompanyInfo, InvoiceSettings, Expense } from './types';
import { INITIAL_TENANTS, INITIAL_PROPERTIES, INITIAL_INVOICES } from './constants';

const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  primaryColor: '#4f46e5',
  fontFamily: 'helvetica',
  headerLayout: 'standard',
  showBankDetails: true,
  showTenantContact: true
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    try {
      const saved = localStorage.getItem('tenants');
      return saved ? JSON.parse(saved) : INITIAL_TENANTS;
    } catch { return INITIAL_TENANTS; }
  });
  
  const [properties, setProperties] = useState<Property[]>(() => {
    try {
      const saved = localStorage.getItem('properties');
      return saved ? JSON.parse(saved) : INITIAL_PROPERTIES;
    } catch { return INITIAL_PROPERTIES; }
  });
  
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('invoices');
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    } catch { return INITIAL_INVOICES; }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('expenses');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [company, setCompany] = useState<CompanyInfo>(() => {
    try {
      const saved = localStorage.getItem('company');
      const base = saved ? JSON.parse(saved) : { 
        name: 'QUEENS CHAMBERS', 
        address: '5th Floor, Flat A, 89 Maharshi Karve Road, Marine Lines Mumbai - 400020', 
        email: 'ac.queenschambers@gmail.com' 
      };
      return {
        ...base,
        invoiceSettings: base.invoiceSettings || DEFAULT_INVOICE_SETTINGS
      };
    } catch { 
      return { 
        name: 'QUEENS CHAMBERS', 
        address: '5th Floor, Flat A, 89 Maharshi Karve Road, Marine Lines Mumbai - 400020', 
        email: 'ac.queenschambers@gmail.com',
        invoiceSettings: DEFAULT_INVOICE_SETTINGS
      }; 
    }
  });

  useEffect(() => {
    localStorage.setItem('tenants', JSON.stringify(tenants));
    localStorage.setItem('properties', JSON.stringify(properties));
    localStorage.setItem('invoices', JSON.stringify(invoices));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('company', JSON.stringify(company));
    localStorage.setItem('isLoggedIn', isAuthenticated.toString());
  }, [tenants, properties, invoices, expenses, company, isAuthenticated]);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  const clearAllData = () => {
    if (window.confirm("WARNING: This will permanently delete everything. Are you sure?")) {
      setTenants([]);
      setProperties([]);
      setInvoices([]);
      setExpenses([]);
      localStorage.clear();
      setIsAuthenticated(false);
      setActiveTab('dashboard');
    }
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard tenants={tenants} properties={properties} invoices={invoices} />;
      case 'tenants': return <Tenants tenants={tenants} properties={properties} setTenants={setTenants} />;
      case 'invoices': return <Invoices invoices={invoices} tenants={tenants} properties={properties} company={company} setInvoices={setInvoices} />;
      case 'properties': return <Properties properties={properties} setProperties={setProperties} />;
      case 'expenses': return <Expenses expenses={expenses} properties={properties} setExpenses={setExpenses} />;
      case 'assistant': return <AIAssistant tenants={tenants} invoices={invoices} properties={properties} />;
      case 'reports': return <Reports tenants={tenants} properties={properties} invoices={invoices} company={company} />;
      case 'settings': return <SystemSettings onReset={clearAllData} company={company} setCompany={setCompany} />;
      default: return <Dashboard tenants={tenants} properties={properties} invoices={invoices} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;