import Dexie, { type Table } from 'dexie';
import { logger } from './loggerService';
import {
  Invoice,
  Client,
  Supplier,
  Product,
  Expense,
  UserProfile,
  InvoiceSchema,
  ClientSchema,
  SupplierSchema,
  ProductSchema,
  ExpenseSchema,
  UserProfileSchema,
} from '../types';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
}

export interface SecurityKey {
  id: string;
  keyData: any; // JsonWebKey format
  createdAt: string;
}

export class MyDatabase extends Dexie {
  invoices!: Table<Invoice>;
  clients!: Table<Client>;
  suppliers!: Table<Supplier>;
  products!: Table<Product>;
  expenses!: Table<Expense>;
  userProfile!: Table<UserProfile & { id: string }>; // Store profile with a fixed id 'current'
  auditLogs!: Table<AuditLog>;
  securityKeys!: Table<SecurityKey>;

  constructor() {
    super('MicroGestionDB');
    this.version(4)
      .stores({
        invoices: 'id, date, serviceDate, clientId, status, type, number',
        clients: 'id, name, email',
        suppliers: 'id, name',
        products: 'id, name',
        expenses: 'id, date, category, supplierId',
        userProfile: 'id',
        auditLogs: 'id, timestamp, action, resourceType, resourceId',
        securityKeys: 'id, createdAt',
      })
      .upgrade(async (trans) => {
        // Migration version 3 -> 4: Move encryption key from localStorage to IndexedDB
        const oldKey = localStorage.getItem('mgf_master_key');
        if (oldKey && trans.table('securityKeys')) {
          await trans.table('securityKeys').add({
            id: 'master_key',
            keyData: JSON.parse(oldKey),
            createdAt: new Date().toISOString(),
          });
          localStorage.removeItem('mgf_master_key');
        }
      });

    // Validation hooks for runtime safety
    this.invoices.hook('reading', (obj) => InvoiceSchema.parse(obj));
    this.clients.hook('reading', (obj) => ClientSchema.parse(obj));
    this.suppliers.hook('reading', (obj) => SupplierSchema.parse(obj));
    this.products.hook('reading', (obj) => ProductSchema.parse(obj));
    this.expenses.hook('reading', (obj) => ExpenseSchema.parse(obj));
    this.userProfile.hook('reading', (obj) => {
      // Handle null/undefined safely (Dexie calls hooks even for empty results)
      if (!obj) return obj;
      const { id, ...profile } = obj;
      return { id, ...UserProfileSchema.parse(profile) };
    });
  }
}

export const db = new MyDatabase();

/**
 * Enregistre un log d'audit dans la base de données (Audit Trail - Impact Infrastructure)
 */
export async function addAuditLog(
  action: string,
  resourceType: string,
  resourceId: string,
  details: string
) {
  try {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      resourceType,
      resourceId,
      details,
    };
    await db.auditLogs.add(log);
  } catch (error) {
    logger.error(
      'Failed to add audit log',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

export async function exportDatabase() {
  const data = {
    invoices: await db.invoices.toArray(),
    clients: await db.clients.toArray(),
    suppliers: await db.suppliers.toArray(),
    products: await db.products.toArray(),
    expenses: await db.expenses.toArray(),
    userProfile: await db.userProfile.toArray(),
    exportDate: new Date().toISOString(),
    version: 1,
  };

  await addAuditLog('export', 'database', 'all', `Export généré le ${new Date().toLocaleString()}`);
  return JSON.stringify(data, null, 2);
}

export async function importDatabase(jsonData: string) {
  const data = JSON.parse(jsonData);

  await db.transaction(
    'rw',
    [db.invoices, db.clients, db.suppliers, db.products, db.expenses, db.userProfile, db.auditLogs],
    async () => {
      await Promise.all([
        db.invoices.clear(),
        db.clients.clear(),
        db.suppliers.clear(),
        db.products.clear(),
        db.expenses.clear(),
        db.userProfile.clear(),
      ]);

      if (data.invoices) await db.invoices.bulkAdd(data.invoices);
      if (data.clients) await db.clients.bulkAdd(data.clients);
      if (data.suppliers) await db.suppliers.bulkAdd(data.suppliers);
      if (data.products) await db.products.bulkAdd(data.products);
      if (data.expenses) await db.expenses.bulkAdd(data.expenses);
      if (data.userProfile) await db.userProfile.bulkAdd(data.userProfile);

      await addAuditLog('import', 'database', 'all', `Importation de données (Restauration)`);
    }
  );
}

export async function clearDatabase() {
  await db.transaction(
    'rw',
    [db.invoices, db.clients, db.suppliers, db.products, db.expenses, db.userProfile, db.auditLogs],
    async () => {
      await Promise.all([
        db.invoices.clear(),
        db.clients.clear(),
        db.suppliers.clear(),
        db.products.clear(),
        db.expenses.clear(),
        db.userProfile.clear(),
      ]);
      await addAuditLog(
        'clear',
        'database',
        'all',
        'Réinitialisation complète de la base de données'
      );
    }
  );
}

/**
 * Native pagination and filtering for Invoices
 */
export async function getInvoicesPaginated({
  page,
  pageSize,
  type,
  status,
  searchQuery,
}: {
  page: number;
  pageSize: number;
  type?: string | 'all';
  status?: string | 'all';
  searchQuery?: string;
}) {
  let collection = db.invoices.orderBy('date').reverse();

  if (type && type !== 'all') {
    collection = collection.filter((inv) => inv.type === type);
  }

  if (status && status !== 'all') {
    collection = collection.filter((inv) => inv.status === status);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    collection = collection.filter((inv) => inv.number.toLowerCase().includes(q));
    // Note: Filtering by client name would require joining with clients table,
    // which is better handled by fetching filtered invoice IDs first or denormalizing.
    // For now, we stick to invoice number for performance.
  }

  const total = await collection.count();
  const items = await collection
    .offset(page * pageSize)
    .limit(pageSize)
    .toArray();

  return { items, total };
}
