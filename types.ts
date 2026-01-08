
export type PropertyType = 'Flat' | 'Garage' | 'Godown';

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  address?: string;
  unitNumber?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  propertyId: string;
  status: 'Active' | 'Former';
  moveInDate?: string;
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
  notes?: string;
  bankDetails?: string;
  billingPeriod: string;
  invoiceType: 'Rent Invoice' | 'Tax Receipt';
}

export interface InvoiceSettings {
  primaryColor: string;
  fontFamily: 'helvetica' | 'times' | 'courier';
  headerLayout: 'standard' | 'modern';
  showBankDetails: boolean;
  showTenantContact: boolean;
}

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  invoiceSettings?: InvoiceSettings;
}

export interface Expense {
  id: string;
  propertyId: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}
