
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Turso Client
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize Database
async function initDb() {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        address TEXT
      )
    `);
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        propertyId TEXT NOT NULL,
        status TEXT NOT NULL
      )
    `);
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        items TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        dueDate TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        dateOfReceipt TEXT,
        status TEXT NOT NULL,
        notes TEXT,
        bankDetails TEXT,
        billingPeriod TEXT NOT NULL,
        invoiceType TEXT NOT NULL
      )
    `);
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        propertyId TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT NOT NULL
      )
    `);
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS company (
        id TEXT PRIMARY KEY DEFAULT 'main',
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        email TEXT NOT NULL,
        invoiceSettings TEXT
      )
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initDb();

// API Routes
app.get('/api/data', async (req: Request, res: Response) => {
  try {
    const [tenants, properties, invoices, expenses, company] = await Promise.all([
      turso.execute('SELECT * FROM tenants'),
      turso.execute('SELECT * FROM properties'),
      turso.execute('SELECT * FROM invoices'),
      turso.execute('SELECT * FROM expenses'),
      turso.execute('SELECT * FROM company LIMIT 1')
    ]);

    res.json({
      tenants: tenants.rows,
      properties: properties.rows,
      invoices: invoices.rows.map(row => ({
        ...row,
        items: JSON.parse(row.items as string)
      })),
      expenses: expenses.rows,
      company: company.rows[0] ? {
        ...company.rows[0],
        invoiceSettings: company.rows[0].invoiceSettings ? JSON.parse(company.rows[0].invoiceSettings as string) : undefined
      } : null
    });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/sync/:type', async (req: Request, res: Response) => {
  const { type } = req.params;
  const data = req.body;

  try {
    if (type === 'tenants') {
      for (const item of data) {
        await turso.execute({
          sql: 'INSERT INTO tenants (id, name, email, phone, address, propertyId, status) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, email=excluded.email, phone=excluded.phone, address=excluded.address, propertyId=excluded.propertyId, status=excluded.status',
          args: [item.id, item.name, item.email, item.phone, item.address, item.propertyId, item.status]
        });
      }
    } else if (type === 'properties') {
      for (const item of data) {
        await turso.execute({
          sql: 'INSERT INTO properties (id, name, type, address) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, type=excluded.type, address=excluded.address',
          args: [item.id, item.name, item.type, item.address]
        });
      }
    } else if (type === 'invoices') {
      for (const item of data) {
        await turso.execute({
          sql: 'INSERT INTO invoices (id, tenantId, items, totalAmount, dueDate, createdAt, dateOfReceipt, status, notes, bankDetails, billingPeriod, invoiceType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET tenantId=excluded.tenantId, items=excluded.items, totalAmount=excluded.totalAmount, dueDate=excluded.dueDate, createdAt=excluded.createdAt, dateOfReceipt=excluded.dateOfReceipt, status=excluded.status, notes=excluded.notes, bankDetails=excluded.bankDetails, billingPeriod=excluded.billingPeriod, invoiceType=excluded.invoiceType',
          args: [item.id, item.tenantId, JSON.stringify(item.items), item.totalAmount, item.dueDate, item.createdAt, item.dateOfReceipt, item.status, item.notes, item.bankDetails, item.billingPeriod, item.invoiceType]
        });
      }
    } else if (type === 'expenses') {
      for (const item of data) {
        await turso.execute({
          sql: 'INSERT INTO expenses (id, propertyId, amount, category, date, description) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET propertyId=excluded.propertyId, amount=excluded.amount, category=excluded.category, date=excluded.date, description=excluded.description',
          args: [item.id, item.propertyId, item.amount, item.category, item.date, item.description]
        });
      }
    } else if (type === 'company') {
      const item = data[0];
      if (item) {
        await turso.execute({
          sql: 'INSERT INTO company (id, name, address, email, invoiceSettings) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, address=excluded.address, email=excluded.email, invoiceSettings=excluded.invoiceSettings',
          args: ['main', item.name, item.address, item.email, item.invoiceSettings ? JSON.stringify(item.invoiceSettings) : null]
        });
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(`Error syncing ${type}:`, err);
    res.status(500).json({ error: `Failed to sync ${type}` });
  }
});

app.delete('/api/delete/:type/:id', async (req: Request, res: Response) => {
  const { type, id } = req.params;
  try {
    await turso.execute({
      sql: `DELETE FROM ${type} WHERE id = ?`,
      args: [id as string]
    });
    res.json({ success: true });
  } catch (err) {
    console.error(`Error deleting ${type}:`, err);
    res.status(500).json({ error: `Failed to delete ${type}` });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
