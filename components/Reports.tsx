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

type ReportType = 'tenants' | 'properties' | 'invoices';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  const dateParts = dateStr.split('-');
  if (dateParts.length !== 3) return dateStr;
  const [year, month, day] = dateParts;
  return `${day}-${month}-${year}`;
};

export const Reports: React.FC<ReportsProps> = ({ tenants, properties, invoices, company }) => {
  const [reportType, setReportType] = useState<ReportType>('tenants');

  const printReport = () => {
    window.print();
  };

  const exportToCSV = () => {
    let csvContent = "";
    let filename = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'tenants') {
      csvContent = "Name,Address,Property,Email,Phone\n";
      tenants.forEach(t => {
        const prop = properties.find(p => p.id === t.propertyId);
        csvContent += `"${t.name}","${t.address || ''}","${prop ? `${prop.type} ${prop.name}` : ''}","${t.email}","${t.phone}"\n`;
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
    const title = `${reportType.toUpperCase()} REPORT`;
    const date = formatDate(new Date().toISOString().split('T')[0]);

    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text(company.name, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(title, 14, 28);
    doc.text(`Generated: ${date}`, 14, 33);

    let head: string[][] = [];
    let body: string[][] = [];

    if (reportType === 'tenants') {
      head = [['Name', 'Address', 'Property', 'Contact']];
      body = tenants.map(t => {
        const prop = properties.find(p => p.id === t.propertyId);
        return [
          t.name, 
          t.address || 'N/A', 
          prop ? `${prop.type} ${prop.name}` : 'N/A', 
          `${t.email}\n${t.phone}`
        ];
      });
    } else if (reportType === 'properties') {
      head = [['Name', 'Type', 'Status']];
      body = properties.map(p => {
        const status = tenants.some(t => t.propertyId === p.id) ? "Occupied" : "Vacant";
        return [p.name, p.type, status];
      });
    } else if (reportType === 'invoices') {
      head = [['ID', 'Date', 'Receipt Date', 'Tenant', 'Amount', 'Status']];
      body = invoices.map(i => [
        i.id,
        formatDate(i.createdAt),
        formatDate(i.dateOfReceipt),
        tenants.find(t => t.id === i.tenantId)?.name || 'Unknown',
        `Rs. ${i.totalAmount.toLocaleString()}`,
        i.status
      ]);
    }

    autoTable(doc, {
      startY: 40,
      head: head,
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 }
    });

    doc.save(`${reportType}_report_${date}.pdf`);
  };

  const renderReportTable = () => {
    switch (reportType) {
      case 'tenants':
        return (
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase">Name</th>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase">Address</th>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase whitespace-nowrap">Property</th>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase">Contact</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => {
                const prop = properties.find(p => p.id === t.propertyId);
                return (
                  <tr key={t.id}>
                    <td className="p-3 border border-slate-200 text-sm font-bold">{t.name}</td>
                    <td className="p-3 border border-slate-200 text-sm">{t.address || 'N/A'}</td>
                    <td className="p-3 border border-slate-200 text-sm whitespace-nowrap">{prop ? `${prop.type} ${prop.name}` : 'N/A'}</td>
                    <td className="p-3 border border-slate-200 text-sm">{t.email}<br/><span className="text-xs text-slate-400">{t.phone}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      case 'properties':
        return (
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase">Name</th>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase">Type</th>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(p => (
                <tr key={p.id}>
                  <td className="p-3 border border-slate-200 text-sm font-bold">{p.name}</td>
                  <td className="p-3 border border-slate-200 text-sm">{p.type}</td>
                  <td className="p-3 border border-slate-200 text-sm text-center">
                    {tenants.some(t => t.propertyId === p.id) ? (
                      <span className="text-emerald-600 font-bold uppercase text-[10px]">Occupied</span>
                    ) : (
                      <span className="text-amber-600 font-bold uppercase text-[10px]">Vacant</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'invoices':
        return (
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase">ID</th>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase">Date</th>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase">Receipt Date</th>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase">Tenant</th>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase text-right">Amount</th>
                <th className="p-3 border border-slate-200 text-xs font-bold uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(i => (
                <tr key={i.id}>
                  <td className="p-3 border border-slate-200 text-xs font-mono">{i.id}</td>
                  <td className="p-3 border border-slate-200 text-sm">{formatDate(i.createdAt)}</td>
                  <td className="p-3 border border-slate-200 text-sm font-bold text-indigo-600">{formatDate(i.dateOfReceipt)}</td>
                  <td className="p-3 border border-slate-200 text-sm">{tenants.find(t => t.id === i.tenantId)?.name || 'Unknown'}</td>
                  <td className="p-3 border border-slate-200 text-sm font-bold text-right">₹{i.totalAmount.toLocaleString()}</td>
                  <td className="p-3 border border-slate-200 text-sm">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      i.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {i.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <header className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Reports</h2>
          <p className="text-slate-500 mt-1">Generate management reports for your portfolio.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={exportToCSV}
            className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            📊 Excel (CSV)
          </button>
          <button 
            onClick={exportToPDF}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            📄 PDF Export
          </button>
          <button 
            onClick={printReport}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            🖨️ Print
          </button>
        </div>
      </header>

      <div className="no-print flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
        {(['tenants', 'properties', 'invoices'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
              reportType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div id="printable-report" className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            <p className="text-sm text-slate-500">5th Floor, Flat A, 89 Maharshi Karve Road,</p>
            <p className="text-sm text-slate-500">Marine Lines, Mumbai - 400020</p>
            <p className="text-sm text-slate-500">{company.email}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-indigo-600 uppercase tracking-widest">{reportType} Report</h2>
            <p className="text-sm text-slate-500">Generated: {formatDate(new Date().toISOString().split('T')[0])}</p>
          </div>
        </div>

        {renderReportTable()}

        <div className="mt-8 text-xs text-slate-400 border-t border-slate-100 pt-4">
          Report generated by QUEENS CHAMBERS Management Portal.
        </div>
      </div>
    </div>
  );
};