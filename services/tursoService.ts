
import { Tenant, Property, Invoice, Expense, CompanyInfo } from '../types';

export const tursoService = {
  async fetchAll() {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to fetch data');
      return await response.json();
    } catch (err) {
      console.error('Error fetching all data:', err);
      return null;
    }
  },

  async syncData(type: string, data: any) {
    try {
      // Wrap single object in array if needed (for company)
      const payload = Array.isArray(data) ? data : [data];
      const response = await fetch(`/api/sync/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Failed to sync ${type}`);
      return await response.json();
    } catch (err) {
      console.error(`Error syncing ${type}:`, err);
    }
  },

  async deleteRecord(type: string, id: string) {
    try {
      const response = await fetch(`/api/delete/${type}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Failed to delete ${type}`);
      return await response.json();
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
    }
  }
};
