/**
 * testConstants.ts
 * 🧪 Constantes et mocks pour les tests
 * Séparé de testUtils.tsx pour éviter les warnings react-refresh
 */

import { vi } from 'vitest';

/**
 * Mock des services de toast
 * Évite les avertissements avec sonner
 */
export const mockToast = () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
});

/**
 * Mock des hooks validés
 * Données par défaut pour les tests
 */
export const mockValidatedHooks = () => ({
  useValidatedInvoices: vi.fn(() => ({
    data: [],
    errorSummary: null,
  })),
  useValidatedExpenses: vi.fn(() => ({
    data: [],
    errorSummary: null,
  })),
  useValidatedUserProfile: vi.fn(() => ({
    profile: {
      id: 'user-1',
      companyName: 'Test Company',
      siret: '12345678901234',
      isVatExempt: false,
      activityType: 'services',
    },
    errorSummary: null,
  })),
});

/**
 * Mock des services métier
 */
export const mockBusinessService = () => ({
  calculateUrssaf: vi.fn(() => ({
    totalVA: 0,
    tax: 0,
  })),
  checkVatThreshold: vi.fn(() => ({
    shouldPayVat: false,
  })),
  checkCaThreshold: vi.fn(() => ({
    shouldChangeStatus: false,
  })),
});

/**
 * Mock minimal d'une facture
 */
export const createMockInvoice = (overrides = {}) => ({
  id: 'inv-test-1',
  number: 'INV-TEST-001',
  date: new Date().toISOString(),
  status: 'draft' as const,
  clientId: 'client-1',
  items: [],
  total: 0,
  currency: 'EUR',
  ...overrides,
});

/**
 * Mock minimal d'un client
 */
export const createMockClient = (overrides = {}) => ({
  id: 'client-test-1',
  name: 'Test Client',
  email: 'client@test.com',
  country: 'FR',
  currency: 'EUR',
  ...overrides,
});
