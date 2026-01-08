import React, { useState } from 'react';
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

const PERIOD_1 = "01 April 2026 to 30 September 2026";
const PERIOD_2 = "01 October 2026 to 31 March 2027";

const getDueDateForPeriod = (period: string) => {
  if (period === PERIOD_1) return `2026-04-30`;
  if (period === PERIOD_2) return `2026-10-31`;
  return new Date().toISOString().split('T')[0];
};

// World-class Indian Number to Words Converter (Lakhs/Crores)
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
    dueDate: getDueDateForPeriod(PERIOD_1),
    items: [...defaultItems],
    notes: defaultNotes,
    bankDetails: defaultBankDetails,
    billingPeriod: PERIOD_1,
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
        dueDate: getDueDateForPeriod(PERIOD_1),
        items: [...defaultItems],
        notes: defaultNotes,
        bankDetails: defaultBankDetails,
        billingPeriod: PERIOD_1,
        invoiceType: 'Rent Invoice'
      });
    }
    setIsModalOpen(true);
  };

  const handlePeriodChange = (period: string) => {
    setFormData(prev => ({
      ...prev,
      billingPeriod: period,
      dueDate: getDueDateForPeriod(period)
    }));
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
    
    // Header Branding
    doc.setFillColor(settings.primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(settings.fontFamily, 'bold');
    doc.text(company.name, 15, 22);
    doc.setFontSize(9);
    doc.setFont(settings.fontFamily, 'normal');
    doc.text(company.address, 15, 29);
    doc.text(`Email: ${company.email}`, 15, 34);

    doc.setFontSize(14);
    doc.text(invoice.invoiceType.toUpperCase(), 195, 22, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`No: ${invoice.id}`, 195, 29, { align: 'right' });
    doc.text(`Date: ${formatDate(invoice.createdAt)}`, 195, 34, { align: 'right' });

    // Body
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.text('BILL TO:', 15, 55);
    doc.setFontSize(12);
    doc.setFont(settings.fontFamily, 'bold');
    doc.text(tenant?.name || 'N/A', 15, 62);
    doc.setFont(settings.fontFamily, 'normal');
    doc.setFontSize(9);
    const tenantAddr = doc.splitTextToSize(tenant?.address || '', 80);
    doc.text(tenantAddr, 15, 67);
    doc.text(`Property: ${prop ? `${prop.type} - ${prop.name}` : 'N/A'}`, 15, 67 + (tenantAddr.length * 5));

    doc.setFontSize(11);
    doc.setTextColor(settings.primaryColor);
    doc.setFont(settings.fontFamily, 'bold');
    doc.text(`Billing Period: ${invoice.billingPeriod}`, 195, 62, { align: 'right' });
    doc.setTextColor(40, 40, 40);
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 195, 68, { align: 'right' });

    // Table
    const tableData = invoice.items.map(item => [item.description, `Rs. ${item.amount.toLocaleString()}`]);
    (doc as any).autoTable({
      startY: 85,
      head: [['Particulars', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: settings.primaryColor, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      foot: [['TOTAL AMOUNT', `Rs. ${invoice.totalAmount.toLocaleString()}`]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(11);
    doc.setFont(settings.fontFamily, 'bold');
    doc.text('Amount in words:', 15, finalY + 12);
    doc.setFont(settings.fontFamily, 'normal');
    doc.setTextColor(settings.primaryColor);
    doc.text(`Rupees ${numberToWordsIndian(invoice.totalAmount)}`, 15, finalY + 18);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.text('Notes:', 15, finalY + 30);
    doc.setFontSize(8);
    const notes = doc.splitTextToSize(invoice.notes || '', 180);
    doc.text(notes, 15, finalY + 35);

    if (invoice.bankDetails) {
      doc.setFontSize(9);
      doc.setFont(settings.fontFamily, 'bold');
      doc.text('Bank Details for Transfer:', 15, finalY + 55);
      doc.setFont(settings.fontFamily, 'normal');
      doc.setFontSize(8);
      const bank = doc.splitTextToSize(invoice.bankDetails, 180);
      doc.text(bank, 15, finalY + 60);
    }

    // Signature
    doc.setFontSize(10);
    doc.line(140, 270, 195, 270);
    doc.text('Authorized Signature', 145, 275);

    doc.save(`${invoice.id}_${tenant?.name}.pdf`);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Invoice Management</h2>
          <p className="text-slate-500 font-medium">Generate professional 6-month rental bills.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95"
        >
          New Invoice
        </button>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice / Tenant</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoices.map(inv => {
              const tenant = tenants.find(t => t.id === inv.tenantId);
              return (
                <tr key={inv.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-black text-slate-900">{inv.id}</div>
                    <div className="text-xs text-slate-500 font-bold">{tenant?.name || 'Unknown'}</div>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-600">{inv.billingPeriod}</td>
                  <td className="px-8 py-5 text-right font-black text-indigo-600">₹{inv.totalAmount.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button onClick={() => downloadPDF(inv)} className="text-indigo-600 hover:text-indigo-800 font-black text-[10px] uppercase">PDF</button>
                    <button onClick={() => handleOpenModal(inv)} className="text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <div className="p-20 text-center text-slate-300">
            <p className="text-4xl mb-2">📄</p>
            <p className="font-black text-xs uppercase tracking-widest">No invoices yet</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                {editingInvoice ? 'Update Invoice' : 'Draft New Invoice'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 transition-colors text-2xl">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Tenant</label>
                  <select 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all"
                    value={formData.tenantId}
                    onChange={e => setFormData({...formData, tenantId: e.target.value})}
                  >
                    <option value="">Choose...</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Billing Cycle</label>
                  <select 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all"
                    value={formData.billingPeriod}
                    onChange={e => handlePeriodChange(e.target.value)}
                  >
                    <option value={PERIOD_1}>{PERIOD_1}</option>
                    <option value={PERIOD_2}>{PERIOD_2}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Billing Particulars</label>
                  <button type="button" onClick={addItem} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline">+ Add Line</button>
                </div>
                <div className="space-y-3">
                  {formData.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <input 
                        required 
                        className="flex-1 px-6 py-3 bg-slate-50 rounded-xl border-none focus:ring-4 focus:ring-indigo-500/10 font-medium" 
                        placeholder="Description"
                        value={item.description}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                      />
                      <div className="relative w-40">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input 
                          type="number" 
                          required 
                          className="w-full pl-10 pr-6 py-3 bg-slate-50 rounded-xl border-none focus:ring-4 focus:ring-indigo-500/10 font-black text-right" 
                          placeholder="0"
                          value={item.amount || ''}
                          onChange={e => updateItem(idx, 'amount', e.target.value)}
                        />
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="text-slate-300 hover:text-rose-500 transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Landlord Signature & Notes</label>
                  <textarea 
                    rows={4} 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Instructions</label>
                  <textarea 
                    rows={4} 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-500/10 font-mono text-xs"
                    value={formData.bankDetails}
                    onChange={e => setFormData({...formData, bankDetails: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center p-8 bg-indigo-50 rounded-3xl">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Total Calculation</p>
                  <p className="text-sm font-black text-indigo-900 mt-1 italic">
                    Rupees {numberToWordsIndian(formData.items?.reduce((s, i) => s + i.amount, 0) || 0)}
                  </p>
                </div>
                <p className="text-4xl font-black text-indigo-600 tracking-tighter">
                  ₹{(formData.items?.reduce((s, i) => s + i.amount, 0) || 0).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-indigo-600 shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all">
                  {editingInvoice ? 'Update Record' : 'Create & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};