/**
 * 🧪 Wrapper pour tester les composants avec données injectées
 *
 * Solution: Passer les données directement au composant via des fixtures
 * plutôt que de compter sur les hooks internes
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Invoice, Expense, Client, Supplier, UserProfile } from '../types';

/**
 * 📦 Props pour contrôler les données dans les tests
 */
export interface TestWrapperProps {
  children: React.ReactNode;
  mockInvoices?: Invoice[];
  mockExpenses?: Expense[];
  mockClients?: Client[];
  mockSuppliers?: Supplier[];
  mockUserProfile?: UserProfile;
}

/**
 * ✅ Test Wrapper: Fournit les données maquées
 *
 * Usage:
 * ```tsx
 * render(
 *   <TestWrapper mockInvoices={mockInvoices}>
 *     <AccountingManager />
 *   </TestWrapper>
 * );
 * ```
 */
export const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  // TODO: Créer un context qui passe les données mockées à useData hooks
  // Pour l'instant, juste router wrapping
  return <BrowserRouter>{children}</BrowserRouter>;
};

/**
 * 🎯 Façon alternative: Mocker la DB Dexie directement
 *
 * Si on peut mocker Dexie.db, alors tous les hooks useData
 * vont simplement recevoire les bonnes données
 */
export function mockDexieDatabase(_config?: {
  invoices?: Invoice[];
  expenses?: Expense[];
  clients?: Client[];
  suppliers?: Supplier[];
}) {
  // À implémenter: Mock la classe db de dexie
  // db.invoices.toArray() → retourne config.invoices
  // db.expenses.toArray() → retourne config.expenses
  // etc.
  // Voir vitest-mock-dexie ou créer notre propre mock
}

/**
 * 💡 MEILLEURE APPROCHE: Mocker les hooks directement dans beforeEach
 *
 * Plutôt que de configurer les mocks au niveau du module,
 * les configurer dans beforeEach avec les vraies données
 */
export function setupTestHooksWithData(
  _invoices?: Invoice[],
  _expenses?: Expense[],
  _clients?: Client[],
  _suppliers?: Supplier[],
  _userProfile?: UserProfile
) {
  // PSEUDO-CODE:
  // vi.mocked(useInvoices).mockReturnValue(invoices);
  // vi.mocked(useExpenses).mockReturnValue(expenses);
  // etc.
  // LE PROBLÈME: Si les mocks utilisent `useLiveQuery()`,
  // ils peuvent retourner undefined initialement
}

/**
 * ✅ VRAIE SOLUTION: Wrapper avec données passées via prop
 * ET injection via Context
 */

import { createContext, useContext } from 'react';

const TestDataContext = createContext<{
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  suppliers: Supplier[];
  userProfile: UserProfile | null;
} | null>(null);

export const useTestData = () => {
  const context = useContext(TestDataContext);
  if (!context) {
    throw new Error('useTestData must be used within TestDataProvider');
  }
  return context;
};

export const TestDataProvider: React.FC<{
  children: React.ReactNode;
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  suppliers: Supplier[];
  userProfile: UserProfile;
}> = ({ children, ...data }) => (
  <TestDataContext.Provider value={data}>{children}</TestDataContext.Provider>
);

/**
 * 🎯 Utiliser un proxy pour les hooks
 *
 * Dans setup.ts global, remplacer useData hooks avec:
 */
export function createTestHookProxy() {
  return {
    useInvoices: () => useTestData().invoices,
    useExpenses: () => useTestData().expenses,
    useClients: () => useTestData().clients,
    useSuppliers: () => useTestData().suppliers,
    useUserProfile: () => ({
      profile: useTestData().userProfile,
      isLoading: false,
    }),
  };
}
