/**
 * 🔧 Mock Setup Centralisé pour useData Hooks
 *
 * Ce fichier fournit une configuration de mocks robuste et testable
 * pour tous les hooks useData utilisés dans les tests unitaires.
 */

import { vi } from 'vitest';
import { Invoice, Expense, Client, Supplier, UserProfile } from '../../types';

/**
 * 📋 Données de test réalistes et complètes
 * À utiliser comme base pour chaque test
 */
export const createMockUserProfile = (): UserProfile => ({
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
});

export const createMockClients = (): Client[] => [
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
];

export const createMockSuppliers = (): Supplier[] => [
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
];

export const createMockInvoices = (): Invoice[] => [
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
    total: 600,
    subtotal: 500,
    taxAmount: 100,
    items: [],
    type: 'invoice',
    createdAt: '2025-02-15T00:00:00.000Z',
    updatedAt: '2025-02-15T00:00:00.000Z',
  },
  {
    id: 'inv-3',
    number: 'AV-001',
    clientId: 'client-1',
    date: '2025-02-20',
    dueDate: '2025-02-20',
    status: 'paid',
    total: 240,
    subtotal: 200,
    taxAmount: 40,
    items: [],
    type: 'credit_note',
    createdAt: '2025-02-20T00:00:00.000Z',
    updatedAt: '2025-02-20T00:00:00.000Z',
  },
];

export const createMockExpenses = (): Expense[] => [
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
    supplierId: 'supplier-1',
    createdAt: '2025-02-25T00:00:00.000Z',
  },
];

/**
 * 🔌 Store des données maquées (mutable pour tests)
 */
const mockDataStore = {
  invoices: createMockInvoices(),
  expenses: createMockExpenses(),
  suppliers: createMockSuppliers(),
  clients: createMockClients(),
  userProfile: createMockUserProfile(),
};

/**
 * 🎯 Configuration automatique des mocks
 * À appeler dans beforeEach de chaque suite de tests
 */
export interface MockDataConfig {
  invoices?: Invoice[];
  expenses?: Expense[];
  suppliers?: Supplier[];
  clients?: Client[];
  userProfile?: UserProfile;
}

export async function setupUseDataMocks(config?: MockDataConfig) {
  // ✅ Réinitialiser le store avec les données par défaut
  mockDataStore.invoices = config?.invoices ?? createMockInvoices();
  mockDataStore.expenses = config?.expenses ?? createMockExpenses();
  mockDataStore.suppliers = config?.suppliers ?? createMockSuppliers();
  mockDataStore.clients = config?.clients ?? createMockClients();
  mockDataStore.userProfile = config?.userProfile ?? createMockUserProfile();

  // ✅ Configurer les mocks
  const { useInvoices, useExpenses, useSuppliers, useClients, useUserProfile } =
    await import('../../hooks/useData');
  vi.mocked(useInvoices).mockReturnValue(mockDataStore.invoices);
  vi.mocked(useExpenses).mockReturnValue(mockDataStore.expenses);
  vi.mocked(useSuppliers).mockReturnValue(mockDataStore.suppliers);
  vi.mocked(useClients).mockReturnValue(mockDataStore.clients);
  vi.mocked(useUserProfile).mockReturnValue({
    profile: mockDataStore.userProfile,
    isLoading: false,
  });
}

/**
 * 💾 Helper: Mettre à jour les données de test
 */
export async function updateMockData(updates: Partial<typeof mockDataStore>) {
  Object.assign(mockDataStore, updates);
  await setupUseDataMocks();
}

/**
 * 🔄 Reset complet
 */
export async function resetMockData() {
  mockDataStore.invoices = createMockInvoices();
  mockDataStore.expenses = createMockExpenses();
  mockDataStore.suppliers = createMockSuppliers();
  mockDataStore.clients = createMockClients();
  mockDataStore.userProfile = createMockUserProfile();
  await setupUseDataMocks();
}
