import React, { useState } from 'react';
import { Invoice, Tenant, InvoiceItem, Property, CompanyInfo, InvoiceStatus } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoicesProps {
  invoices: Invoice[];
  tenants: Tenant[];
  properties: Property[];
  company: CompanyInfo;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
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

const numberToWordsIndian = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert_less_than_thousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
  };
  if (num === 0) return 'Zero';
  let words = '';
  let n = Math.floor(num);
  if (Math.floor(n / 10000000) > 0) { words += convert_less_than_thousand(Math.floor(n / 10000000)) + 'Crore '; n %= 10000000; }
  if (Math.floor(n / 100000) > 0) { words += convert_less_than_thousand(Math.floor(n / 100000)) + 'Lakh '; n %= 100000; }
  if (Math.floor(n / 1000) > 0) { words += convert_less_than_thousand(Math.floor(n / 1000)) + 'Thousand '; n %= 1000; }
  if (Math.floor(n / 100) > 0) { words += a[Math.floor(n / 100)] + 'Hundred '; n %= 100; }
  if (n > 0) { if (words !== '') words += 'and '; words += convert_less_than_thousand(n); }
  return words.trim() + ' Only';
};

const getAutomatedCycle = () => {
  return "01 April 2026 to 30 September 2026";
};

const DEFAULT_ITEMS: InvoiceItem[] = [
  { description: 'Rent charges', amount: 0 },
  { description: 'Repair and Municipal tax', amount: 0 },
  { description: 'Service charges for common area', amount: 0 }
];

export const Invoices: React.FC<InvoicesProps> = ({ invoices, tenants, properties, company, setInvoices }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<Partial<Invoice>>({
    tenantId: '',
    items: [...DEFAULT_ITEMS],
    billingPeriod: getAutomatedCycle(),
    invoiceType: 'Rent Invoice',
    status: 'Draft',
    notes: '',
    dateOfReceipt: new Date().toISOString().split('T')[0]
  });

  const getNextInvoiceId = () => {
    if (!invoices || invoices.length === 0) return 'INV-001';
    const ids = invoices.map(inv => {
      const match = inv.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxId = Math.max(...ids);
    const nextId = maxId + 1;
    return `INV-${String(nextId).padStart(3, '0')}`;
  };

  const handleStatusChange = (id: string, newStatus: InvoiceStatus) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
  };

  const handleEditClick = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({ ...invoice, items: [...invoice.items] });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm(`Are you sure you want to delete invoice ${id}? This action cannot be undone.`)) {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
    setFormData({
      tenantId: '',
      items: [...DEFAULT_ITEMS],
      billingPeriod: getAutomatedCycle(),
      invoiceType: 'Rent Invoice',
      status: 'Draft',
      notes: '',
      dateOfReceipt: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = formData.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
    
    if (editingInvoice) {
      setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? {
        ...formData as Invoice,
        totalAmount: total
      } : inv));
    } else {
      const newInvoice: Invoice = {
        ...formData as Invoice,
        id: getNextInvoiceId(),
        totalAmount: total,
        createdAt: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      setInvoices(prev => [newInvoice, ...prev]);
    }
    closeModal();
  };

  const downloadPDF = (invoice: Invoice) => {
    const tenant = tenants.find(t => t.id === invoice.tenantId);
    const prop = properties.find(p => p.id === tenant?.propertyId);
    const doc = new jsPDF();
    
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(129, 140, 248); 
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name, 15, 20);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text("5th Floor, Flat A, 89 Maharshi Karve Road, Marine Lines, Mumbai - 400020", 15, 30);
    doc.text(`Email: ${company.email}`, 15, 35);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TENANT / BILL TO:', 15, 60);
    
    doc.setFontSize(12);
    doc.text(tenant?.name || 'N/A', 15, 68);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const tenantAddress = tenant?.address || 'Address not provided';
    const splitTenantAddress = doc.splitTextToSize(tenantAddress, 90);
    doc.text(splitTenantAddress, 15, 74);
    
    const nextY = 74 + (splitTenantAddress.length * 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rented Unit: ${prop ? `${prop.type} ${prop.name}` : 'N/A'}`, 15, nextY + 2);

    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice ID: ${invoice.id}`, 140, 60);
    doc.text(`Date: ${formatDateDDMMYYYY(invoice.createdAt)}`, 140, 65);
    doc.text(`Period: ${invoice.billingPeriod}`, 140, 70);
    doc.setFont('helvetica', 'bold');
    doc.text(`Receipt Date: ${formatDateDDMMYYYY(invoice.dateOfReceipt)}`, 140, 75);

    autoTable(doc, {
      startY: nextY + 15,
      head: [['Description', 'Amount']],
      body: invoice.items.map(i => [i.description, `Rs. ${i.amount.toLocaleString()}`]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
      foot: [['GRAND TOTAL', `Rs. ${invoice.totalAmount.toLocaleString()}`]],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
    });

    let currentY = (doc as any).lastAutoTable?.finalY || 150;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Amount in words:`, 15, currentY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rupees ${numberToWordsIndian(invoice.totalAmount)}`, 15, currentY + 15);

    if (invoice.notes) {
      currentY += 25;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 15, currentY);
      doc.setFont('helvetica', 'oblique');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const splitNotes = doc.splitTextToSize(invoice.notes, 180);
      doc.text(splitNotes, 15, currentY + 5);
      currentY += (splitNotes.length * 4);
    } else {
      currentY += 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ISSUED BY LANDLORD', 15, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('Mr. Ayyub Bux', 15, currentY + 10);
    doc.text('Mr. Yousuf Bux', 15, currentY + 15);
    
    currentY += 15;

    doc.setDrawColor(226, 232, 240);
    doc.line(15, currentY + 5, 195, currentY + 5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Transfer Details:', 15, currentY + 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Name of Account: Ayyub Vali Bux', 15, currentY + 18);
    doc.text('Name of Bank: ICICI Bank Ltd', 15, currentY + 23);
    doc.text('Account No.: 055501081974', 15, currentY + 28);
    doc.text('IFSC Code: ICIC0005256', 15, currentY + 33);
    doc.text('Branch: Umraj, Bharuch', 15, currentY + 38);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Please prepare cheques or transfer through NEFT/RTGS', 15, currentY + 46);
    doc.text('to beneficiary account name - Ayyub Vali Bux.', 15, currentY + 51);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Landlord Signature', 140, currentY + 40);
    doc.line(140, currentY + 55, 195, currentY + 55);

    const fileName = `${invoice.id}_${tenant?.name || 'Tenant'}.pdf`;
    doc.save(fileName);
  };

  const getStatusStyle = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Overdue': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Sent': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Invoices</h2>
          <p className="text-slate-500 text-sm mt-1">Manage and track rental receivables.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200">New Invoice</button>
      </header>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">ID</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Tenant / Unit</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Date / Receipt</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Status</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Amount</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoices.map(inv => {
              const tenant = tenants.find(t => t.id === inv.tenantId);
              const prop = properties.find(p => p.id === tenant?.propertyId);
              return (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-900">{inv.id}</td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800">{tenant?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{prop?.name || 'No Unit'}</p>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium">
                    <div className="text-slate-500">{formatDateDDMMYYYY(inv.createdAt)}</div>
                    <div className="text-[10px] text-indigo-500 font-bold uppercase">Received: {formatDateDDMMYYYY(inv.dateOfReceipt)}</div>
                  </td>
                  <td className="px-8 py-5">
                    <select 
                      value={inv.status} 
                      onChange={(e) => handleStatusChange(inv.id, e.target.value as InvoiceStatus)}
                      className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border outline-none transition-all cursor-pointer ${getStatusStyle(inv.status)}`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-indigo-600">₹{inv.totalAmount.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right space-x-2">
                    {inv.status === 'Draft' && (
                      <button onClick={() => handleEditClick(inv)} className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Edit</button>
                    )}
                    <button onClick={() => downloadPDF(inv)} className="bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">PDF</button>
                    <button 
                      onClick={() => handleDeleteClick(inv.id)}
                      className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black">{editingInvoice ? 'Edit Invoice' : 'Generate Invoice'}</h3>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Cycle: Apr - Sept 2026</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-900 transition-colors text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 block mb-2">Select Tenant</label>
                  <select required className="w-full p-4 bg-slate-50 rounded-xl border border-transparent focus:border-indigo-500 outline-none font-bold text-slate-700" value={formData.tenantId} onChange={e => setFormData({...formData, tenantId: e.target.value})}>
                    <option value="">Choose tenant...</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 block mb-2">Billing Period</label>
                  <input className="w-full p-4 bg-slate-50 rounded-xl border border-transparent focus:border-indigo-500 outline-none font-bold text-slate-700" value={formData.billingPeriod} onChange={e => setFormData({...formData, billingPeriod: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 block mb-2">Date of Receipt of Rent</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full p-4 bg-slate-50 rounded-xl border border-transparent focus:border-indigo-500 outline-none font-bold text-slate-700" 
                    value={formData.dateOfReceipt} 
                    onChange={e => setFormData({...formData, dateOfReceipt: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 block mb-2">Status</label>
                  <select 
                    className="w-full p-4 bg-slate-50 rounded-xl border border-transparent focus:border-indigo-500 outline-none font-bold text-slate-700" 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as InvoiceStatus})}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase text-slate-400 block">Particulars</label>
                  <button type="button" onClick={() => setFormData({...formData, items: [...(formData.items || []), {description: '', amount: 0}]})} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">+ Add Row</button>
                </div>
                <div className="space-y-3">
                  {formData.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <input 
                        placeholder="Description" 
                        className="flex-1 p-3 bg-slate-50 rounded-lg border border-transparent focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400" 
                        value={item.description} 
                        disabled={idx < 3}
                        onChange={e => {
                          const newItems = [...formData.items!];
                          newItems[idx].description = e.target.value;
                          setFormData({...formData, items: newItems});
                        }} 
                      />
                      <input 
                        type="number" 
                        step="any" 
                        placeholder="0" 
                        className="w-32 p-3 bg-slate-50 rounded-lg border border-transparent focus:border-indigo-500 outline-none text-right font-black text-indigo-600" 
                        value={item.amount === 0 ? '' : item.amount} 
                        onChange={e => {
                          const newItems = [...formData.items!];
                          newItems[idx].amount = Number(e.target.value);
                          setFormData({...formData, items: newItems});
                        }} 
                      />
                      {idx >= 3 && (
                        <button type="button" onClick={() => {
                          const newItems = formData.items!.filter((_, i) => i !== idx);
                          setFormData({...formData, items: newItems});
                        }} className="text-rose-400 hover:text-rose-600 transition-colors">✕</button>
                      )}
                      {idx < 3 && <div className="w-4"></div>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-400 block mb-2">Additional Notes / Remarks</label>
                <textarea 
                  placeholder="Enter any additional information for the tenant..." 
                  className="w-full p-4 bg-slate-50 rounded-xl border border-transparent focus:border-indigo-500 outline-none text-sm font-medium text-slate-700 min-h-[80px]" 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-black uppercase text-slate-400">Total Payable Amount</span>
                  <span className="text-3xl font-black text-slate-900">₹{(formData.items?.reduce((s, i) => s + i.amount, 0) || 0).toLocaleString()}</span>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:translate-y-[-2px] transition-all active:translate-y-[0px]">
                  {editingInvoice ? 'Save Changes' : 'Generate Final Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};