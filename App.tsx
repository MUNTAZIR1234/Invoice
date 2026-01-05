
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Tenants } from './components/Tenants';
import { Invoices } from './components/Invoices';
import { Properties } from './components/Properties';
import { AIAssistant } from './components/AIAssistant';
import { SystemSettings } from './components/SystemSettings';
import { Reports } from './components/Reports';
import { Login } from './components/Login';
import { Tenant, Property, Invoice, CompanyInfo, InvoiceSettings } from './types';
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
    const saved = localStorage.getItem('tenants');
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });
  
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('properties');
    return saved ? JSON.parse(saved) : INITIAL_PROPERTIES;
  });
  
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [company, setCompany] = useState<CompanyInfo>(() => {
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
  });

  useEffect(() => {
    localStorage.setItem('tenants', JSON.stringify(tenants));
    localStorage.setItem('properties', JSON.stringify(properties));
    localStorage.setItem('invoices', JSON.stringify(invoices));
    localStorage.setItem('company', JSON.stringify(company));
    localStorage.setItem('isLoggedIn', isAuthenticated.toString());
  }, [tenants, properties, invoices, company, isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Immediate state update is more reliable than window.confirm which can be blocked
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  const clearAllData = () => {
    if (window.confirm("WARNING: This will permanently delete everything. Are you sure?")) {
      setTenants([]);
      setProperties([]);
      setInvoices([]);
      localStorage.clear();
      setIsAuthenticated(false);
      setActiveTab('dashboard');
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tenants={tenants} properties={properties} invoices={invoices} />;
      case 'tenants':
        return <Tenants tenants={tenants} properties={properties} setTenants={setTenants} />;
      case 'invoices':
        return <Invoices invoices={invoices} tenants={tenants} properties={properties} company={company} setInvoices={setInvoices} />;
      case 'properties':
        return <Properties properties={properties} setProperties={setProperties} />;
      case 'assistant':
        return <AIAssistant tenants={tenants} invoices={invoices} properties={properties} />;
      case 'reports':
        return <Reports tenants={tenants} properties={properties} invoices={invoices} company={company} />;
      case 'settings':
        return <SystemSettings onReset={clearAllData} company={company} setCompany={setCompany} />;
      default:
        return <Dashboard tenants={tenants} properties={properties} invoices={invoices} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
};

export default App;
