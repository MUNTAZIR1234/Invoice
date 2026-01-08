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

// Indian Number to Words Converter (Lakhs/Crores)
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

const getAutomatedPeriod = () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  if (month >= 3 && month <= 8) return `01 April ${year} to 30 September ${year}`;
  if (month >= 9) return `01 October ${year} to 31 March ${year + 1}`;
  return `01 October ${year - 1} to 31 March ${year}`;
};

export const Invoices: React.FC<InvoicesProps> = ({ invoices, tenants, properties, company, setInvoices }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const defaultNotes = "Issued by Landlord\nMr. Ayyub Bux\nMr. Yousuf Bux";
  const defaultBankDetails = "Name of Account: Ayyub Vali Bux\nBank Name: ICICI Bank Ltd\nAccount No.: 055501081974\nIFSC Code: ICIC0005256\nBranch Name: Umraj, Bharuch";

  const [formData, setFormData] = useState<Partial<Invoice>>({
    tenantId: '',
    dueDate: new Date().toISOString().split('T')[0],
    items: [
      { description: 'Rent Charges', amount: 0 },
      { description: 'Repair & Municipal Tax', amount: 0 },
      { description: 'Service charges for common area', amount: 0 }
    ],
    notes: defaultNotes,
    bankDetails: defaultBankDetails,
    billingPeriod: getAutomatedPeriod(),
    invoiceType: 'Rent Invoice'
  });

  const generateNextInvoiceId = () => {
    const maxId = invoices.reduce((max, inv) => {
      const num = parseInt(inv.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);
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
        items: [
          { description: 'Rent Charges', amount: 0 },
          { description: 'Repair & Municipal Tax', amount: 0 },
          { description: 'Service charges for common area', amount: 0 }
        ],
        notes: defaultNotes,
        bankDetails: defaultBankDetails,
        billingPeriod: getAutomatedPeriod(),
        invoiceType: 'Rent Invoice'
      });
    }
    setIsModalOpen(true);
  };

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
    doc.setFontSize(9);
    doc.setFont(settings.fontFamily, 'normal');
    const tenantAddr = doc.splitTextToSize(tenant?.address || '', 80);
    doc.text(tenantAddr, 15, 74);
    doc.text(`Property: ${prop ? `${prop.type} - ${prop.name}` : 'N/A'}`, 15, 74 + (tenantAddr.length * 5) + 2);

    doc.setFontSize(11);
    doc.setTextColor(settings.primaryColor);
    doc.setFont(settings.fontFamily, 'bold');
    doc.text(`Billing Period:`, 195, 68, { align: 'right' });
    doc.setFontSize(10);
    doc.text(invoice.billingPeriod, 195, 74, { align: 'right' });

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
    doc.setFontSize(10);
    doc.setFont(settings.fontFamily, 'bold');
    doc.text('Amount in words:', 15, finalY + 15);
    doc.setFont(settings.fontFamily, 'normal');
    doc.text(`Rupees ${numberToWordsIndian(invoice.totalAmount)}`, 15, finalY + 21);

    if (invoice.bankDetails) {
      doc.setFontSize(9);
      doc.setFont(settings.fontFamily, 'bold');
      doc.text('Payment Details:', 15, finalY + 40);
      doc.setFont(settings.fontFamily, 'normal');
      doc.setFontSize(8);
      const bank = doc.splitTextToSize(invoice.bankDetails, 180);
      doc.text(bank, 15, finalY + 46);
    }

    doc.setFontSize(10);
    doc.line(140, 270, 195, 270);
    doc.text('Authorized Signature', 145, 275);

    doc.save(`${invoice.id}_${tenant?.name?.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Invoicing</h2>
          <p className="text-slate-500 font-medium">Issue professional 6-month rental statements.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
        >
          New Invoice
        </button>
      </header>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Ref</th>
              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tenant</th>
              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
            {invoices.map(inv => {
              const tenant = tenants.find(t => t.id === inv.tenantId);
              return (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-6 font-bold">{inv.id}</td>
                  <td className="px-10 py-6">{tenant?.name || 'Unknown'}</td>
                  <td className="px-10 py-6 text-sm text-slate-500">{inv.billingPeriod}</td>
                  <td className="px-10 py-6 text-right font-black text-indigo-600">₹{inv.totalAmount.toLocaleString()}</td>
                  <td className="px-10 py-6 text-right space-x-2">
                    <button onClick={() => downloadPDF(inv)} className="text-slate-400 hover:text-indigo-600">📥 PDF</button>
                    <button onClick={() => handleOpenModal(inv)} className="text-slate-400 hover:text-slate-900">✏️ Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Draft Statement</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-2xl">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Tenant</label>
                  <select 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 rounded-xl border-none font-bold"
                    value={formData.tenantId}
                    onChange={e => setFormData({...formData, tenantId: e.target.value})}
                  >
                    <option value="">Choose...</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Billing Period</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 bg-slate-50 rounded-xl border-none font-bold"
                    value={formData.billingPeriod}
                    onChange={e => setFormData({...formData, billingPeriod: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Charges Description</label>
                {formData.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <input 
                      required 
                      className="flex-1 px-6 py-3 bg-slate-50 rounded-xl border-none font-medium" 
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                    />
                    <input 
                      type="number" 
                      required 
                      className="w-40 px-6 py-3 bg-slate-50 rounded-xl border-none font-black text-right" 
                      value={item.amount || ''}
                      onChange={e => updateItem(idx, 'amount', e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="p-8 bg-indigo-50 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Total Amount in Words</p>
                  <p className="font-bold text-indigo-900 mt-1 italic">Rupees {numberToWordsIndian(formData.items?.reduce((s, i) => s + i.amount, 0) || 0)}</p>
                </div>
                <p className="text-4xl font-black text-indigo-600">₹{(formData.items?.reduce((s, i) => s + i.amount, 0) || 0).toLocaleString()}</p>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 rounded-xl font-bold bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-5 rounded-xl font-bold bg-indigo-600 text-white">Save & Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};