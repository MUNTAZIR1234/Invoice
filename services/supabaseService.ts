
import { createClient } from '@supabase/supabase-js';
import { Tenant, Property, Invoice, Expense, CompanyInfo } from '../types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isCloudEnabled = !!supabaseUrl && !!supabaseAnonKey;

// Only initialize if keys are present
export const supabase = isCloudEnabled 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

export const supabaseService = {
  async fetchAll() {
    if (!supabase) return null;

    const [tenants, properties, invoices, expenses, company] = await Promise.all([
      supabase.from('tenants').select('*'),
      supabase.from('properties').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('company').select('*').single()
    ]);

    return {
      tenants: tenants.data || [],
      properties: properties.data || [],
      invoices: invoices.data || [],
      expenses: expenses.data || [],
      company: company.data || null
    };
  },

  async syncData(type: string, data: any) {
    if (!supabase) return;

    // Supabase standard: upsert handles both insert and update if an ID matches
    const { error } = await supabase
      .from(type)
      .upsert(data);
    
    if (error) console.error(`Error syncing ${type}:`, error);
  },

  async deleteRecord(type: string, id: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from(type)
      .delete()
      .eq('id', id);
    
    if (error) console.error(`Error deleting ${type}:`, error);
  }
};
