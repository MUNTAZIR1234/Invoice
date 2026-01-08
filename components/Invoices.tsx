
import React, { useState, useEffect } from 'react';
import { Invoice, Tenant, InvoiceItem, Property, CompanyInfo } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface InvoicesProps {
  invoices: Invoice[];
  tenants: Tenant[];
  properties: Property[];
  company: CompanyInfo;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};

const getAutomatedPeriod = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();
  
  if (month >= 3 && month <= 8) { // April to Sept
    return `01 April ${year} to 30 September ${year}`;
  } else if (month >= 9) { // Oct to Dec
    return `01 October ${year} to 31 March ${year + 1}`;
  } else { // Jan to March
    return `01 October ${year - 1} to 31 March ${year}`;
  }
};

const numberToWordsIndian = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert_less_than_thousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return a[n];
    const res = b[Math.floor(n / 10)] + ' ' + a[n % 10];
    return res.trim() + ' ';
  };

  if (num === 0) return 'Zero';

  let words = '';
  let n = Math.floor(num);

  if (Math.floor(n / 10000000) > 0) {
    words += convert_less_than_thousand(Math.floor(n / 10000000)) + 'Crore ';
    n %= 10000000;
  }
  if (Math.floor(n / 100000) > 0) {
    words += convert_less_than_thousand(Math.floor(n / 100000)) + 'Lakh ';
    n %= 100000;
  }
  if (Math.floor(n / 1000) > 0) {
    words += convert_less_than_thousand(Math.floor(n / 1000)) + 'Thousand ';
    n %= 1000;
  }
  if (Math.floor(n / 100) > 0) {
    words += a[Math.floor(n / 100)] + 'Hundred ';
    n %= 100;
  }
  if (n > 0) {
    if (words !== '') words += 'and ';
    words += convert_less_than_thousand(n);
  }

  return words.trim() + ' Only';
};

export const Invoices: React.FC<InvoicesProps> = ({ invoices, tenants, properties, company, setInvoices }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const defaultNotes = "Issued by Landlord\nMr. Ayyub Bux\nMr. Yousuf Bux";
  const defaultBankDetails = "Name of Account: Ayyub Vali Bux\nBank Name: ICICI Bank Ltd\nAccount No.: 055501081974\nIFSC Code: ICIC0005256\nBranch Name: Umraj, Bharuch\n\nPlease prepare cheques or transfer through NEFT/RTGS to beneficiary account name - Ayyub Vali Bux";

  const defaultItems: InvoiceItem[] = [
    { description: 'Rent Charges', amount: 0 },
    { description: 'Repair & Municipal Tax', amount: 0 },
    { description: 'Service charges for common area', amount: 0 }
  ];

  const [formData, setFormData] = useState<Partial<Invoice>>({
    tenantId: '',
    dueDate: '',
    items: [...defaultItems],
    notes: defaultNotes,
    bankDetails: defaultBankDetails,
    billingPeriod: getAutomatedPeriod(),
    invoiceType: 'Rent Invoice'
  });

  const generateNextInvoiceId = () => {
    if (invoices.length === 0) return 'INV-001';
    const ids = invoices.map(inv => parseInt(inv.id.replace('INV-', ''), 10)).filter(n => !isNaN(n));
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `INV-${(maxId + 1).toString().padStart(3, '0')}`;
  };

  const handleOpenModal = (inv?: Invoice) => {
    if (inv) {
      setEditingInvoice(inv);
      setFormData(inv);
    } else {
      setEditingInvoice(null);
      setFormData({
        tenantId: '',
        dueDate: new Date().toISOString().split('T')[0],
        items: [...defaultItems],
        notes: defaultNotes,
        bankDetails: defaultBankDetails,
        billingPeriod: getAutomatedPeriod(),
        invoiceType: 'Rent Invoice'
      });
    }
    setIsModalOpen(true);
  };

  const addItem = () => setFormData(prev => ({ ...prev, items: [...(prev.items || []), { description: '', amount: 0 }] }));
  const removeItem = (index: number) => setFormData(prev => ({ ...prev, items: prev.items?.filter((_, i) => i !== index) }));
  
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], [field]: field === 'amount' ? Number(value) : value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = formData.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
    
    if (editingInvoice) {
      setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? { ...inv, ...formData, totalAmount: total } as Invoice : inv));
    } else {
      const newInvoice: Invoice = {
        ...(formData as Invoice),
        id: generateNextInvoiceId(),
        totalAmount: total,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setInvoices(prev => [...prev, newInvoice]);
    }
    setIsModalOpen(false);
  };

  const downloadPDF = (invoice: Invoice) => {
    const tenant = tenants.find(t => t.id === invoice.tenantId);
    const prop = properties.find(p => p.id === tenant?.propertyId);
    const settings = company.invoiceSettings || { primaryColor: '#4f46e5', fontFamily: 'helvetica' };
    
    const doc = new jsPDF();
    doc.setFont(settings.fontFamily);
    
    doc.setFillColor(settings.primaryColor);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont(settings.fontFamily, 'bold');
    doc.text(company.name, 15, 22);
    doc.setFontSize(9);
    doc.setFont(settings.fontFamily, 'normal');
    doc.text(company.address, 15, 31);
    doc.text(`Email: ${company.email}`, 15, 37);

    doc.setFontSize(14);
    doc.text(invoice.invoiceType.toUpperCase(), 195, 22, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoice.id}`, 195, 31, { align: 'right' });
    doc.text(`Date: ${formatDate(invoice.createdAt)}`, 195, 37, { align: 'right' });

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.text('BILL TO:', 15, 60);
    doc.setFontSize(13);
    doc.setFont(settings.fontFamily, 'bold');
    doc.text(tenant?.name || 'N/A', 15, 68);
    doc.setFont(settings.fontFamily, 'normal');
    doc.setFontSize(9);
    const tenantAddr = doc.splitTextToSize(tenant?.address || '', 80);
    doc.text(tenantAddr, 15, 74);
    doc.text(`Property: ${prop ? `${prop.type} - ${prop.name}` : 'N/A'}`, 15, 74 + (tenantAddr.length * 5) + 2);

    doc.setFontSize(11);
    doc.setTextColor(settings.primaryColor);
    doc.setFont(settings.fontFamily, 'bold');
    doc.text(`Billing Period:`, 195, 68, { align: 'right' });
    doc.setFontSize(10);
    doc.text(invoice.billingPeriod, 195, 74, { align: 'right' });
    doc.setTextColor(40, 40, 40);
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 195, 80, { align: 'right' });

    (doc as any).autoTable({
      startY: 95,
      head: [['Particulars of Charges', 'Amount (INR)']],
      body: invoice.items.map(item => [item.description, `Rs. ${item.amount.toLocaleString()}`]),
      theme: 'grid',
      headStyles: { fillColor: settings.primaryColor, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 6 },
      foot: [['TOTAL PAYABLE', `Rs. ${invoice.totalAmount.toLocaleString()}`]],
      footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 160;
    doc.setFontSize(11);
    doc.setFont(settings.fontFamily, 'bold');
    doc.text('Amount in words:', 15, finalY + 15);
    doc.setFont(settings.fontFamily, 'normal');
    doc.setTextColor(settings.primaryColor);
    doc.text(`Rupees ${numberToWordsIndian(invoice.totalAmount)}`, 15, finalY + 22);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text('Instructions & Notes:', 15, finalY + 35);
    doc.setFontSize(8);
    const notes = doc.splitTextToSize(invoice.notes || '', 180);
    doc.text(notes, 15, finalY + 41);

    if (invoice.bankDetails) {
      doc.setFontSize(9);
      doc.setFont(settings.fontFamily, 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Electronic Fund Transfer Details:', 15, finalY + 65);
      doc.setFont(settings.fontFamily, 'normal');
      doc.setFontSize(8);
      const bank = doc.splitTextToSize(invoice.bankDetails, 180);
      doc.text(bank, 15, finalY + 71);
    }

    doc.setFontSize(10);
    doc.line(140, 270, 195, 270);
    doc.text('Authorized Signature', 145, 275);

    doc.save(`${invoice.id}_${tenant?.name?.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Invoicing</h2>
          <p className="text-slate-500 font-medium">Issue professional 6-month rental statements.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-600/20 transition-all active:scale-95"
        >
          Generate New Invoice
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</th>
              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tenant / Unit</th>
              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total Payable</th>
              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoices.map(inv => {
              const tenant = tenants.find(t => t.id === inv.tenantId);
              const prop = properties.find(p => p.id === tenant?.propertyId);
              return (
                <tr key={inv.id} className="hover:bg-indigo-50/40 transition-colors group">
                  <td className="px-10 py-6">
                    <div className="font-black text-slate-900">{inv.id}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{formatDate(inv.createdAt)}</div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="font-bold text-slate-700">{tenant?.name || 'Unknown'}</div>
                    <div className="text-[11px] text-indigo-500 font-black uppercase tracking-wider">{prop?.type} {prop?.name}</div>
                  </td>
                  <td className="px-10 py-6 text-sm font-bold text-slate-500">{inv.billingPeriod}</td>
                  <td className="px-10 py-6 text-right font-black text-slate-900 text-lg">₹{inv.totalAmount.toLocaleString()}</td>
                  <td className="px-10 py-6 text-right space-x-3">
                    <button onClick={() => downloadPDF(inv)} className="bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 p-2.5 rounded-xl transition-all shadow-sm">
                      📥
                    </button>
                    <button onClick={() => handleOpenModal(inv)} className="bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 p-2.5 rounded-xl transition-all shadow-sm">
                      ✏️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <div className="p-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">📄</div>
            <p className="font-black text-xs uppercase tracking-[0.2em] text-slate-300">No invoices generated yet</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.2)] flex flex-col">
            <div className="px-12 py-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                  {editingInvoice ? 'Modify Invoice' : 'New Billing Statement'}
                </h3>
                <p className="text-slate-400 text-sm font-medium mt-1">Drafting a official invoice for tenant records.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-2xl">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Tenant</label>
                  <select 
                    required 
                    className="w-full px-8 py-5 bg-slate-50 rounded-[1.5rem] border-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all text-slate-700"
                    value={formData.tenantId}
                    onChange={e => setFormData({...formData, tenantId: e.target.value})}
                  >
                    <option value="">Choose tenant...</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Billing Cycle (6-Month)</label>
                  <input 
                    required 
                    className="w-full px-8 py-5 bg-slate-50 rounded-[1.5rem] border-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all text-slate-700"
                    value={formData.billingPeriod}
                    onChange={e => setFormData({...formData, billingPeriod: e.target.value})}
                    placeholder="e.g. 01 April 2026 to 30 Sept 2026"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statement Particulars</label>
                  <button type="button" onClick={addItem} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 px-4 py-2 rounded-full transition-all">+ Add Item</button>
                </div>
                <div className="space-y-4">
                  {formData.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="flex-1">
                        <input 
                          required 
                          className="w-full px-8 py-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-500/10 font-medium" 
                          placeholder="Particulars"
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                        />
                      </div>
                      <div className="w-48 relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span>
                        <input 
                          type="number" 
                          required 
                          className="w-full pl-12 pr-8 py-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-500/10 font-black text-right" 
                          placeholder="0.00"
                          value={item.amount || ''}
                          onChange={e => updateItem(idx, 'amount', e.target.value)}
                        />
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notes / Signature Block</label>
                  <textarea 
                    rows={4} 
                    className="w-full px-8 py-5 bg-slate-50 rounded-[1.5rem] border-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm text-slate-600"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bank Payment Instructions</label>
                  <textarea 
                    rows={4} 
                    className="w-full px-8 py-5 bg-slate-50 rounded-[1.5rem] border-none focus:ring-4 focus:ring-indigo-500/10 font-mono text-[10px] text-slate-500"
                    value={formData.bankDetails}
                    onChange={e => setFormData({...formData, bankDetails: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center p-10 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-600/30">
                <div className="mb-6 md:mb-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Total Amount in Words</p>
                  <p className="text-sm font-bold mt-2 opacity-90 max-w-md">
                    Rupees {numberToWordsIndian(formData.items?.reduce((s, i) => s + i.amount, 0) || 0)}
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Total Payable</p>
                  <p className="text-5xl font-black mt-1 tracking-tighter">
                    ₹{(formData.items?.reduce((s, i) => s + i.amount, 0) || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-6 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all">Discard</button>
                <button type="submit" className="flex-[2] py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-widest text-white bg-slate-900 shadow-2xl shadow-slate-900/20 hover:bg-indigo-600 active:scale-[0.98] transition-all">
                  {editingInvoice ? 'Update Record' : 'Save & Finalize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
