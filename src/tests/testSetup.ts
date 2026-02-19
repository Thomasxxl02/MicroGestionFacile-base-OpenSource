/**
 * Configuration centralisée et robuste pour les tests
 * Évi te la duplication et les problèmes d'isolation
 */

import { vi } from 'vitest';
import type { Supplier, Expense, Client, Invoice, UserProfile } from '../types';

/**
 * Store mutable pour les mocks - permet de modifier les données entre les tests
 */
export const createMockStore = () => ({
  suppliers: [] as Supplier[],
  expenses: [] as Expense[],
  clients: [] as Client[],
  invoices: [] as Invoice[],
  userProfile: null as UserProfile | null,
});

export type MockStore = ReturnType<typeof createMockStore>;

/**
 * Configure tous les hooks de données avec un store spécifique
 */
export function setupDataMocks(
  mockStore: MockStore,
  useDataHooksModule: Record<string, { mockImplementation: (fn: () => unknown) => void }>
) {
  // Configurer les mocks à retourner les données du store
  vi.mocked(useDataHooksModule.useSuppliers).mockImplementation(() => mockStore.suppliers);
  vi.mocked(useDataHooksModule.useExpenses).mockImplementation(() => mockStore.expenses);
  vi.mocked(useDataHooksModule.useClients).mockImplementation(() => mockStore.clients);
  vi.mocked(useDataHooksModule.useInvoices).mockImplementation(() => mockStore.invoices);
  vi.mocked(useDataHooksModule.useUserProfile).mockImplementation(() => ({
    profile: mockStore.userProfile,
    isLoading: false,
  }));
}

/**
 * Options pour waitFor avec timeouts appropriés pour les tests
 */
export const waitForOptions = Object.freeze({
  timeout: 3000,
  interval: 50,
});

/**
 * Data-testid helpers pour les sélecteurs robustes
 */
export const testIds = Object.freeze({
  suppliersContainer: 'suppliers-container',
  clientsContainer: 'clients-container',
  invoicesContainer: 'invoices-container',
  expensesContainer: 'expenses-container',
  searchInput: 'search-input',
  emptyState: 'empty-state',
  loadingSpinner: 'loading-spinner',
});
