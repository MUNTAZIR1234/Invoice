
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
  // End of the first month
  if (period === PERIOD_1) {
    return `2026-04-30`; // End of April 2026
  } else if (period === PERIOD_2) {
    return `2026-10-31`; // End of October 2026
  }
  return new Date().toISOString().split('T')[0];
};

const numberToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: any): string => {
    if ((n = n.toString()).length > 9) return 'overflow';
    const n_arr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_arr) return '';
    let str = '';
    str += (Number(n_arr[1]) !== 0) ? (a[Number(n_arr[1])] || b[Number(n_arr[1][0])] + ' ' + a[Number(n_arr[1][1])]) + 'Crore ' : '';
    str += (Number(n_arr[2]) !== 0) ? (a[Number(n_arr[2])] || b[Number(n_arr[2][0])] + ' ' + a[Number(n_arr[2][1])]) + 'Lakh ' : '';
    str += (Number(n_arr[3]) !== 0) ? (a[Number(n_arr[3])] || b[Number(n_arr[3][0])] + ' ' + a[Number(n_arr[3][1])]) + 'Thousand ' : '';
    str += (Number(n_arr[4]) !== 0) ? (a[Number(n_arr[4])] || b[Number(n_arr[4][0])] + ' ' + a[Number(n_arr[4][1])]) + 'Hundred ' : '';
    str += (Number(n_arr[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[Number(n_arr[5][0])] + ' ' + a[Number(n_arr[5][1])]) + 'Only ' : 'Only';
    return str;
  };

  return inWords(num);
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

  const [formData, setFormData] = useState<{
    tenantId: string;
    dueDate: string;
    items: InvoiceItem[];
    notes: string;
    bankDetails: string;
    billingPeriod: string;
  }>({
    tenantId: '',
    dueDate: getDueDateForPeriod(PERIOD_1),
    items: [...defaultItems],
    notes: defaultNotes,
    bankDetails: defaultBankDetails,
    billingPeriod: PERIOD_1
  });

  const generateNextInvoiceId = () => {
    if (invoices.length === 0) return 'INV-001';
    const ids = invoices
      .map(inv => {
        const match = inv.id.match(/INV-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => !isNaN(num));
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `INV-${(maxId + 1).toString().padStart(3, '0')}`;
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [79, 70, 229];
  };

  const handleOpenModal = (inv?: Invoice) => {
    if (inv) {
      setEditingInvoice(inv);
      setFormData({
        tenantId: inv.tenantId,
        dueDate: inv.dueDate,
        items: inv.items,
        notes: inv.notes || defaultNotes,
        bankDetails: inv.bankDetails || defaultBankDetails,
        billingPeriod: inv.billingPeriod || PERIOD_1
      });
    } else {
      setEditingInvoice(null);
      setFormData({
        tenantId: '',
        dueDate: getDueDateForPeriod(PERIOD_1),
        items: [...defaultItems],
        notes: defaultNotes,
        bankDetails: defaultBankDetails,
        billingPeriod: PERIOD_1
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

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { description: '', amount: 0 }] });
  const removeItem = (index: number) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: field === 'amount' ? Number(value) : value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = formData.items.reduce((sum, item) => sum + item.amount, 0);
    
    if (editingInvoice) {
      setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? {
        ...inv,
        tenantId: formData.tenantId,
        dueDate: formData.dueDate,
        items: formData.items,
        totalAmount: total,
        notes: formData.notes,
        bankDetails: formData.bankDetails,
        billingPeriod: formData.billingPeriod
      } : inv));
    } else {
      const nextId = generateNextInvoiceId();
      const newInvoice: Invoice = {
        id: nextId,
        tenantId: formData.tenantId,
        items: formData.items,
        totalAmount: total,
        dueDate: formData.dueDate,
        createdAt: new Date().toISOString().split('T')[0],
        notes: formData.notes,
        bankDetails: formData.bankDetails,
        billingPeriod: formData.billingPeriod
      };
      setInvoices(prev => [...prev, newInvoice]);
    }
    setIsModalOpen(false);
  };

  const downloadPDF = (invoice: Invoice) => {
    const tenant = tenants.find(t => t.id === invoice.tenantId);
    const prop = properties.find(p => p.id === tenant?.propertyId);
    const settings = company.invoiceSettings || {
      primaryColor: '#4f46e5',
      fontFamily: 'helvetica',
      headerLayout: 'standard',
      showBankDetails: true,
      showTenantContact: true
    };
    
    const doc = new jsPDF();
    doc.setFont(settings.fontFamily);
    const primaryRGB = hexToRgb(settings.primaryColor);

    if (settings.headerLayout === 'modern') {
      doc.setFillColor(...primaryRGB);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text(company.name, 14, 25);
      doc.setFontSize(10);
      doc.text(company.address, 14, 32);
      doc.text(`Email: ${company.email}`, 14, 38);
      doc.setFontSize(14);
      doc.text('RENTAL INVOICE', 160, 25, { align: 'right' });
      doc.setFontSize(10);
      doc.text(`${invoice.id}`, 160, 32, { align: 'right' });
      doc.text(`Period: ${invoice.billingPeriod}`, 160, 38, { align: 'right' });
    } else {
      doc.setFontSize(22);
      doc.setTextColor(...primaryRGB); 
      doc.text(company.name, 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); 
      const companyAddrLines = doc.splitTextToSize(company.address, 90);
      doc.text(companyAddrLines, 14, 26);
      doc.text(`Email: ${company.email}`, 14, 26 + (companyAddrLines.length * 5));
      doc.setFontSize(24);
      doc.setTextColor(15, 23, 42); 
      doc.text('Rental Invoice', 130, 20);
      doc.setFontSize(10);
      doc.text(`${invoice.id}`, 130, 26);
      doc.text(`Date: ${formatDate(invoice.createdAt)}`, 130, 31);
      doc.text(`Due: ${formatDate(invoice.dueDate)}`, 130, 36);
      doc.setFontSize(11);
      doc.setTextColor(...primaryRGB);
      doc.text(`Period: ${invoice.billingPeriod}`, 130, 42);
      doc.setDrawColor(226, 232, 240); 
      doc.line(14, 48, 196, 48);
    }

    const billToY = settings.headerLayout === 'modern' ? 60 : 58;
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('TENANT:', 14, billToY);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(tenant?.name || 'Valued Tenant', 14, billToY + 7);
    let currentY = billToY + 12;
    if (settings.showTenantContact) {
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const splitTenantAddr = doc.splitTextToSize(tenant?.address || 'No Address Provided', 90);
      doc.text(splitTenantAddr, 14, currentY);
      currentY += (splitTenantAddr.length * 5);
      doc.text(`Email: ${tenant?.email || 'N/A'}`, 14, currentY);
      currentY += 5;
      doc.text(`Contact: ${tenant?.phone || 'N/A'}`, 14, currentY);
      currentY += 6;
    }
    doc.setFontSize(10);
    doc.setTextColor(...primaryRGB);
    doc.text(`Rented: ${prop ? `${prop.type} ${prop.name}` : 'Unassigned'}`, 14, currentY);

    const tableData = invoice.items.map(item => [item.description, `Rs. ${item.amount.toLocaleString()}`]);
    (doc as any).autoTable({
      startY: currentY + 10,
      head: [['Particulars', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: primaryRGB, fontSize: 11, font: settings.fontFamily },
      styles: { fontSize: 10, cellPadding: 5, font: settings.fontFamily },
      foot: [['Total Amount', `Rs. ${invoice.totalAmount.toLocaleString()}`]],
      footStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 12 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 160;
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Amount in words:', 14, finalY + 12);
    doc.setFontSize(10);
    doc.setTextColor(...primaryRGB);
    doc.text(`Rupees ${numberToWords(invoice.totalAmount)}`, 14, finalY + 18);

    let noteY = finalY + 28;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const splitNotes = doc.splitTextToSize(invoice.notes || defaultNotes, 180);
    doc.text(splitNotes, 14, noteY);
    noteY += (splitNotes.length * 5) + 10;

    if (settings.showBankDetails) {
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Bank Details:', 14, noteY);
      doc.setFontSize(9);
      doc.setTextColor(...primaryRGB);
      const splitBank = doc.splitTextToSize(invoice.bankDetails || defaultBankDetails, 180);
      doc.text(splitBank, 14, noteY + 7);
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(200, 200, 200);
    doc.line(130, pageHeight - 40, 186, pageHeight - 40);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Landlord Signature', 145, pageHeight - 34);

    doc.save(`${invoice.id}-${tenant?.name || 'Invoice'}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Invoices</h2>
          <p className="text-slate-500 mt-1">Create and manage rental billing with professional PDF support.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <span>📄</span> Create New Invoice
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Tenant</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Period</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Due Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const tenant = tenants.find(t => t.id === inv.tenantId);
              return (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{tenant?.name || 'Unknown'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{inv.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {inv.billingPeriod}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-900">₹{inv.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => downloadPDF(inv)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group-hover:bg-indigo-50"
                        title="Download PDF"
                      >
                        📥 <span className="text-xs font-bold hidden md:inline ml-1">PDF</span>
                      </button>
                      <button onClick={() => handleOpenModal(inv)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">✏️</button>
                      <button onClick={() => setInvoices(prev => prev.filter(i => i.id !== inv.id))} className="p-2 text-slate-400 hover:text-red-600 transition-colors">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <div className="p-16 text-center text-slate-300">
            <p className="text-5xl mb-4">📄</p>
            <p className="font-bold text-slate-400">No invoices generated yet.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold text-slate-900">{editingInvoice ? 'Edit Rental Invoice' : 'Create Rental Invoice'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Tenant</label>
                <select required value={formData.tenantId} className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500 transition-all" onChange={e => setFormData({...formData, tenantId: e.target.value})}>
                  <option value="">Choose Tenant...</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Billing Period</label>
                  <select required value={formData.billingPeriod} className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500 transition-all" onChange={e => handlePeriodChange(e.target.value)}>
                    <option value={PERIOD_1}>{PERIOD_1}</option>
                    <option value={PERIOD_2}>{PERIOD_2}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                  <input type="date" required value={formData.dueDate} className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500 transition-all" onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Particulars</h4>
                  <button type="button" onClick={addItem} className="text-indigo-600 text-xs font-bold hover:underline">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input required className="flex-1 px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" placeholder="Description" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} />
                      <div className="relative w-32">
                        <span className="absolute left-3 top-2 text-slate-400 text-sm">₹</span>
                        <input type="number" required className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" placeholder="0" value={item.amount || ''} onChange={e => updateItem(index, 'amount', e.target.value)} />
                      </div>
                      <button type="button" onClick={() => removeItem(index)} className="text-slate-400 hover:text-red-500 p-1">🗑️</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                  <textarea value={formData.notes} rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" placeholder="Internal or billing notes..." onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Bank Details</label>
                  <textarea value={formData.bankDetails} rows={8} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-mono" placeholder="Bank Name, A/C, IFSC..." onChange={e => setFormData({...formData, bankDetails: e.target.value})} />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-end items-center gap-4 mb-2">
                  <span className="text-sm font-medium text-slate-500">Total: </span>
                  <span className="text-2xl font-black text-slate-900">₹{formData.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}</span>
                </div>
                <p className="text-right text-xs text-indigo-600 font-medium italic">
                  Rupees {numberToWords(formData.items.reduce((sum, item) => sum + item.amount, 0))}
                </p>
              </div>

              <div className="flex gap-4 sticky bottom-0 bg-white pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                {editingInvoice && (
                   <button 
                     type="button" 
                     onClick={() => downloadPDF(editingInvoice)}
                     className="flex-1 py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                   >
                     📥 Download PDF
                   </button>
                )}
                <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
