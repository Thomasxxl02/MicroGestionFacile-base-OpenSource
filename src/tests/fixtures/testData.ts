/**
 * 🗂️ Données de test réalistes et centralisées
 *
 * À importer directement dans les tests
 * évite les problèmes de closure avec vi.mock()
 */

import { Invoice, Expense, Client, Supplier, UserProfile } from '../../types';

// ============================================================
// USER PROFILE
// ============================================================

export const testUserProfile: UserProfile = {
  companyName: 'Test Company',
  siret: '12345678901234',
  address: '123 Test Street',
  email: 'test@example.com',
  phone: '+33123456789',
  activityType: 'services',
  isVatExempt: false,
  hasAccre: false,
  hasVersementLiberatoire: false,
  contributionQuarter: 'monthly',
  isConfigured: true,
  backupFrequency: 'weekly',
  defaultCurrency: 'EUR',
};

// ============================================================
// CLIENTS
// ============================================================

export const testClients: Client[] = [
  {
    id: 'client-1',
    name: 'Client Test',
    email: 'client@test.com',
    address: '123 Client St',
    country: 'FR',
    currency: 'EUR',
    language: 'fr',
    taxType: 'DOMESTIC',
    paymentTerms: 30,
  },
  {
    id: 'client-2',
    name: 'Another Client',
    email: 'another@test.com',
    address: '456 Another St',
    country: 'FR',
    currency: 'EUR',
    language: 'fr',
    taxType: 'DOMESTIC',
    paymentTerms: 30,
  },
  {
    id: 'client-3',
    name: 'Berlin GmbH',
    email: 'hello@berlin.de',
    address: 'Berliner Str. 10',
    country: 'DE',
    currency: 'EUR',
    language: 'de',
    taxType: 'EU_B2B',
    paymentTerms: 30,
    tvaNumber: 'DE987654321',
    archived: true,
  },
];

// ============================================================
// SUPPLIERS
// ============================================================

export const testSuppliers: Supplier[] = [
  {
    id: 'supplier-1',
    name: 'Supplier Test',
    email: 'supplier@test.com',
    address: '456 Supplier Ave',
    category: 'Services',
    country: 'FR',
    origin: 'FR',
    currency: 'EUR',
    status: 'VALIDATED',
  },
  {
    id: 'supplier-2',
    name: 'Another Supplier',
    email: 'another@supplier.com',
    address: '789 Supplier Ave',
    category: 'Equipment',
    country: 'FR',
    origin: 'FR',
    currency: 'EUR',
    status: 'VALIDATED',
  },
];

// ============================================================
// INVOICES
// ============================================================

export const testInvoices: Invoice[] = [
  {
    id: 'inv-1',
    number: 'FAC-001',
    clientId: 'client-1',
    date: '2025-02-01',
    dueDate: '2025-03-01',
    status: 'paid',
    total: 1200,
    subtotal: 1000,
    taxAmount: 200,
    items: [
      {
        id: 'item-1',
        description: 'Service de consulting',
        quantity: 10,
        unit: 'heure',
        unitPrice: 100,
        taxRate: 20,
        category: 'SERVICE_BIC',
      },
    ],
    type: 'invoice',
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 'inv-2',
    number: 'FAC-002',
    clientId: 'client-1',
    date: '2025-02-15',
    dueDate: '2025-03-15',
    status: 'paid',
    total: 800,
    subtotal: 666.67,
    taxAmount: 133.33,
    items: [],
    type: 'invoice',
    createdAt: '2025-02-15T00:00:00.000Z',
    updatedAt: '2025-02-15T00:00:00.000Z',
  },
  {
    id: 'inv-3',
    number: 'FAC-003',
    clientId: 'client-2',
    date: '2025-02-05',
    dueDate: '2025-03-05',
    status: 'draft',
    total: 500,
    subtotal: 416.67,
    taxAmount: 83.33,
    items: [],
    type: 'invoice',
    createdAt: '2025-02-05T00:00:00.000Z',
    updatedAt: '2025-02-05T00:00:00.000Z',
  },
];

// ============================================================
// EXPENSES
// ============================================================

export const testExpenses: Expense[] = [
  {
    id: 'exp-1',
    date: '2025-02-05',
    description: 'Hébergement serveur',
    amount: 120,
    vatAmount: 24,
    category: 'Services',
    status: 'validated',
    supplierId: 'supplier-1',
    createdAt: '2025-02-05T00:00:00.000Z',
  },
  {
    id: 'exp-2',
    date: '2025-02-10',
    description: 'Facture électricité',
    amount: 150,
    vatAmount: 30,
    category: 'Énergie',
    status: 'validated',
    supplierId: 'supplier-1',
    createdAt: '2025-02-10T00:00:00.000Z',
  },
  {
    id: 'exp-3',
    date: '2025-02-25',
    description: 'Matériel informatique',
    amount: 500,
    vatAmount: 100,
    category: 'Équipement',
    status: 'validated',
    supplierId: 'supplier-2',
    createdAt: '2025-02-25T00:00:00.000Z',
  },
];

// ============================================================
// COLLECTIONS
// ============================================================

/**
 * 📦 Toutes les données d'un seul appel
 */
export const testFixture = {
  users: { profile: testUserProfile },
  clients: testClients,
  suppliers: testSuppliers,
  invoices: testInvoices,
  expenses: testExpenses,
};

/**
 * 🎯 Variantes pour différents scénarios
 */

// Sans dépenses
export const testInvoicesOnly = {
  ...testFixture,
  expenses: [],
};

// Avec facture brouillon
export const testInvoicesWithDraft = {
  ...testFixture,
  invoices: [
    ...testInvoices,
    {
      id: 'inv-draft',
      number: 'FAC-003',
      clientId: 'client-1',
      date: '2025-02-28',
      dueDate: '2025-03-28',
      status: 'draft' as const,
      total: 5000,
      subtotal: 4166.67,
      taxAmount: 833.33,
      items: [],
      type: 'invoice' as const,
      createdAt: '2025-02-28T00:00:00.000Z',
      updatedAt: '2025-02-28T00:00:00.000Z',
    },
  ],
};

// Vide
export const testFixtureEmpty = {
  clients: [],
  suppliers: [],
  invoices: [],
  expenses: [],
  users: { profile: testUserProfile },
};
