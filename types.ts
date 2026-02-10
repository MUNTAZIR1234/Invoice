export type PropertyType = 'Flat' | 'Garage' | 'Godown';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  address?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  propertyId: string;
  status: 'Active' | 'Former';
}

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  items: InvoiceItem[];
  totalAmount: number;
  dueDate: string;
  createdAt: string;
  dateOfReceipt?: string;
  status: InvoiceStatus;
  notes?: string;
  bankDetails?: string;
  billingPeriod: string;
  invoiceType: 'Rent Invoice' | 'Tax Receipt';
}

export interface Expense {
  id: string;
  propertyId: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  invoiceSettings?: {
    primaryColor: string;
    fontFamily: string;
  };
}