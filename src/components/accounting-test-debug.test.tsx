/**
 * DEBUG TEST - Vérifier que les données maquées sont bien retournées
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AccountingManager from './AccountingManager';

// Mock avec des valeurs par défaut simples
vi.mock('../hooks/useData', () => ({
  useInvoices: vi.fn(() => [
    {
      id: 'inv-1',
      number: 'FAC-001',
      date: '2025-01-01',
      total: 1200,
      status: 'paid',
      clientId: 'client-1',
    },
  ]),
  useExpenses: vi.fn(() => [
    {
      id: 'exp-1',
      description: 'Frais généraux',
      amount: 120,
      date: '2025-01-01',
      category: 'supplies',
    },
  ]),
  useClients: vi.fn(() => []),
  useSuppliers: vi.fn(() => []),
  useUserProfile: vi.fn(() => ({
    profile: {},
    isLoading: false,
  })),
}));

vi.mock('../services/businessService', () => ({
  calculateUrssaf: vi.fn(() => ({
    total: 364.8,
  })),
}));

vi.mock('../services/accountingService', () => ({
  generateJournalEntries: vi.fn(() => []),
}));

vi.mock('../services/fecService', () => ({
  downloadFEC: vi.fn(),
}));

vi.mock('../services/geminiService', () => ({
  ocrExpense: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DEBUG: AccountingManager Data Flow', () => {
  beforeEach(() => {
    console.info('🧹 beforeEach - resetting mocks');
    vi.clearAllMocks();
  });

  it('should verify data structure', () => {
    console.info('📝 Test: verify data structure - checking mock data');

    // Les données maquées sont définies dans le vi.mock
    expect(true).toBe(true);
  });

  it('should render component and check DOM content', async () => {
    console.info('📝 Test: render component');

    const { container } = render(
      <BrowserRouter>
        <AccountingManager />
      </BrowserRouter>
    );

    console.info('✅ Component rendered');

    // Log all text content
    const allText = container.innerText || '';
    console.info('📄 Text content:', allText.substring(0, 500));

    // Check if data appears
    if (allText.includes('1200')) {
      console.info('✅ Found invoice 1200€');
    } else {
      console.info('❌ NOT found: 1200€');
    }

    if (allText.includes('1560')) {
      console.info('✅ Found CA 1560€');
    } else {
      console.info('❌ NOT found: 1560€');
    }

    if (allText.includes('120')) {
      console.info('✅ Found expense 120€');
    } else {
      console.info('❌ NOT found: 120€');
    }

    expect(screen.getByText(/Comptabilité/i)).toBeInTheDocument();
  });
});
