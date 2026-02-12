
import React, { useState } from 'react';
import { Tenant, Property, Invoice, CompanyInfo } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  tenants: Tenant[];
  properties: Property[];
  invoices: Invoice[];
  company: CompanyInfo;
}

type ReportType = 'tenants' | 'properties' | 'invoices' | 'ledger';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  const dateParts = dateStr.split('-');
  if (dateParts.length !== 3) return dateStr;
  const [year, month, day] = dateParts;
  return `${day}-${month}-${year}`;
};

export const Reports: React.FC<ReportsProps> = ({ tenants, properties, invoices, company }) => {
  const [reportType, setReportType] = useState<ReportType>('tenants');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  const printReport = () => {
    window.print();
  };

  const exportToCSV = () => {
    let csvContent = "";
    let filename = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'tenants') {
      csvContent = "Name,Address,Property,Email,Phone,Rent,Maintenance\n";
      tenants.forEach(t => {
        const prop = properties.find(p => p.id === t.propertyId);
        csvContent += `"${t.name}","${t.address || ''}","${prop ? `${prop.type} ${prop.name}` : ''}","${t.email}","${t.phone}","${t.rentAmount}","${t.maintenanceAmount}"\n`;
      });
    } else if (reportType === 'properties') {
      csvContent = "Name,Type,Status\n";
      properties.forEach(p => {
        const status = tenants.some(t => t.propertyId === p.id) ? "Occupied" : "Vacant";
        csvContent += `"${p.name}","${p.type}","${status}"\n`;
      });
    } else if (reportType === 'invoices') {
      csvContent = "ID,Date,Receipt Date,Tenant,Amount,Period,Status\n";
      invoices.forEach(i => {
        const tName = tenants.find(t => t.id === i.tenantId)?.name || 'Unknown';
        csvContent += `"${i.id}","${formatDate(i.createdAt)}","${formatDate(i.dateOfReceipt)}","${tName}","${i.totalAmount}","${i.billingPeriod}","${i.status}"\n`;
      });
    } else if (reportType === 'ledger' && selectedTenantId) {
      const tenant = tenants.find(t => t.id === selectedTenantId);
      const tenantInvoices = invoices.filter(inv => inv.tenantId === selectedTenantId);
      csvContent = `Statement for ${tenant?.name}\nID,Date,Amount,Status\n`;
      tenantInvoices.forEach(i => {
        csvContent += `"${i.id}","${formatDate(i.createdAt)}","${i.totalAmount}","${i.status}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const date = formatDate(new Date().toISOString().split('T')[0]);
    
    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`STATEMENT OF ACCOUNT - ${reportType.toUpperCase()}`, 14, 30);
    doc.text(`Generated: ${date}`, 160, 30);

    let head: string[][] = [];
    let body: string[][] = [];
    let startY = 50;

    if (reportType === 'ledger' && selectedTenantId) {
      const tenant = tenants.find(t => t.id === selectedTenantId);
      const prop = properties.find(p => p.id === tenant?.propertyId);
      const tenantInvoices = invoices.filter(inv => inv.tenantId === selectedTenantId);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text(`Tenant: ${tenant?.name}`, 14, 50);
      doc.setFontSize(10);
      doc.text(`Unit: ${prop ? `${prop.type} ${prop.name}` : 'N/A'}`, 14, 56);
      
      const totalBilled = tenantInvoices.reduce((s, i) => s + i.totalAmount, 0);
      const totalPaid = tenantInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0);
      const balance = totalBilled - totalPaid;

      doc.text(`Total Billed: Rs. ${totalBilled.toLocaleString()}`, 140, 50);
      doc.text(`Total Paid: Rs. ${totalPaid.toLocaleString()}`, 140, 56);
      doc.setFont('helvetica', 'bold');
      doc.text(`Outstanding: Rs. ${balance.toLocaleString()}`, 140, 62);
      
      head = [['Invoice ID', 'Date', 'Billing Period', 'Amount', 'Status']];
      body = tenantInvoices.map(i => [
        i.id,
        formatDate(i.createdAt),
        i.billingPeriod,
        `Rs. ${i.totalAmount.toLocaleString()}`,
        i.status
      ]);
      startY = 70;
    } else if (reportType === 'tenants') {
      head = [['Name', 'Address', 'Property', 'Contact']];
      body = tenants.map(t => {
        const prop = properties.find(p => p.id === t.propertyId);
        return [t.name, t.address || 'N/A', prop ? `${prop.type} ${prop.name}` : 'N/A', `${t.email}\n${t.phone}`];
      });
    } else if (reportType === 'properties') {
      head = [['Name', 'Type', 'Status']];
      body = properties.map(p => {
        const status = tenants.some(t => t.propertyId === p.id) ? "Occupied" : "Vacant";
        return [p.name, p.type, status];
      });
    } else if (reportType === 'invoices') {
      head = [['ID', 'Date', 'Tenant', 'Amount', 'Status']];
      body = invoices.map(i => [
        i.id,
        formatDate(i.createdAt),
        tenants.find(t => t.id === i.tenantId)?.name || 'Unknown',
        `Rs. ${i.totalAmount.toLocaleString()}`,
        i.status
      ]);
    }

    autoTable(doc, {
      startY: startY,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 }
    });

    doc.save(`${reportType}_report_${date}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in">
      <header className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Account Reports</h2>
          <p className="text-slate-500 font-medium">Financial transparency for your rental portfolio.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={exportToCSV} className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all">📊 CSV</button>
          <button onClick={exportToPDF} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all">📄 PDF Export</button>
          <button onClick={printReport} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all">🖨️ Print</button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          {(['tenants', 'properties', 'invoices', 'ledger'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                reportType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {reportType === 'ledger' && (
          <select 
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
          >
            <option value="">Select Tenant for Statement...</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      <div id="printable-report" className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
        <div className="mb-10 flex justify-between items-start border-b border-slate-50 pb-8">
          <div>
            <h1 className="text-3xl font-black text-indigo-600 tracking-tighter uppercase">{company.name}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Management Division</p>
            <div className="mt-4 text-xs text-slate-500 font-medium leading-relaxed">
              <p>5th Floor, Flat A, 89 Maharshi Karve Road,</p>
              <p>Marine Lines, Mumbai - 400020</p>
              <p className="text-indigo-500">{company.email}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">{reportType} REPORT</h2>
            <p className="text-xs font-black text-slate-400 mt-1">GEN: {formatDate(new Date().toISOString().split('T')[0])}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'ledger' && !selectedTenantId ? (
            <div className="py-20 text-center">
              <p className="text-4xl mb-4">🔦</p>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Please select a tenant to view their ledger</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  {reportType === 'tenants' && (
                    <>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Name</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Unit</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Monthly</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Contact</th>
                    </>
                  )}
                  {reportType === 'properties' && (
                    <>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Unit</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Type</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-center">Status</th>
                    </>
                  )}
                  {reportType === 'invoices' && (
                    <>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">ID</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Date</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Tenant</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-right">Amount</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                    </>
                  )}
                  {reportType === 'ledger' && (
                    <>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Invoice ID</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Date</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Period</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-right">Amount</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reportType === 'ledger' && invoices.filter(inv => inv.tenantId === selectedTenantId).map(i => (
                  <tr key={i.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-bold text-slate-900">{i.id}</td>
                    <td className="p-4 text-xs font-medium text-slate-500">{formatDate(i.createdAt)}</td>
                    <td className="p-4 text-xs font-medium text-slate-500">{i.billingPeriod}</td>
                    <td className="p-4 text-xs font-black text-indigo-600 text-right">₹{i.totalAmount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                        i.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {reportType === 'tenants' && tenants.map(t => {
                   const prop = properties.find(p => p.id === t.propertyId);
                   return (
                     <tr key={t.id} className="hover:bg-slate-50/50">
                       <td className="p-4 text-xs font-bold text-slate-900">{t.name}</td>
                       <td className="p-4 text-xs font-medium text-slate-500">{prop ? `${prop.type} ${prop.name}` : 'N/A'}</td>
                       <td className="p-4 text-xs font-black text-indigo-600">₹{(t.rentAmount + t.maintenanceAmount).toLocaleString()}</td>
                       <td className="p-4 text-[10px] font-medium text-slate-400">{t.phone}</td>
                     </tr>
                   )
                })}
                {/* ... other standard table rows ... */}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-12 text-[10px] text-slate-400 font-black uppercase tracking-widest border-t border-slate-50 pt-6 flex justify-between items-center">
          <span>QUEENS CHAMBERS Management Portal</span>
          <span className="text-slate-200">System Signature Code: QC-AUTH-{Date.now().toString().slice(-4)}</span>
        </div>
      </div>
    </div>
  );
};
