/**
 * AccountingManager.test.tsx
 * 🧪 Tests du composant AccountingManager
 * Validation de la gestion comptable
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import { BrowserRouter } from 'react-router-dom';
import AccountingManager from './AccountingManager';
import { Invoice, Expense, Client, Supplier, UserProfile } from '../types';
import {
  testInvoices,
  testExpenses,
  testClients,
  testSuppliers,
  testUserProfile,
} from '../tests/fixtures/testData';

// ✅ Variables mutables pour les mocks
let mockInvoices: Invoice[] = testInvoices;
let mockExpenses: Expense[] = testExpenses;
let mockClients: Client[] = testClients;
let mockSuppliers: Supplier[] = testSuppliers;
let mockUserProfile: UserProfile = testUserProfile;

vi.mock('../hooks/useData', () => ({
  useExpenses: vi.fn(() => mockExpenses),
  useInvoices: vi.fn(() => mockInvoices),
  useSuppliers: vi.fn(() => mockSuppliers),
  useClients: vi.fn(() => mockClients),
  useUserProfile: vi.fn(() => ({ profile: mockUserProfile, isLoading: false })),
}));

vi.mock('../services/businessService', () => ({
  calculateUrssaf: vi.fn((_invoices, _profile) => ({
    total: 364.8,
    breakdown: {
      socialSecurity: 304,
      cfp: 24,
      versementLiberatoire: 36.8,
    },
    turnover: {
      total: 1800,
      services: 1800,
      sales: 0,
    },
  })),
}));

vi.mock('../services/accountingService', () => ({
  generateJournalEntries: vi.fn(() => [
    {
      id: 'entry-1',
      date: '2025-02-01',
      journal: 'VT',
      compteNum: '411000',
      compteLib: 'Clients',
      debit: 1200,
      credit: 0,
    },
  ]),
}));

vi.mock('../services/fecService', () => ({
  downloadFEC: vi.fn(() => Promise.resolve()),
}));

vi.mock('../services/geminiService', () => ({
  ocrExpense: vi.fn(() =>
    Promise.resolve({
      description: 'Facture OCR',
      amount: 100,
      date: '2025-02-01',
      category: 'Services',
    })
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('🧪 AccountingManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mutable variables
    mockInvoices = testInvoices;
    mockExpenses = testExpenses;
    mockClients = testClients;
    mockSuppliers = testSuppliers;
    mockUserProfile = testUserProfile;
  });

  describe('Rendu initial', () => {
    it('devrait se rendre sans erreur', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument();
      });
    });

    it("devrait afficher l'onglet bilan par défaut", async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Bilan/i)).toBeInTheDocument();
      });
    });
  });

  describe('Calculs financiers', () => {
    it("devrait calculer correctement le chiffre d'affaires", async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // CA = 1200 + 600 - 240 (avoir) = 1560€
        const container = screen.getByText(/Recettes/i).closest('div');
        expect(container?.textContent).toMatch(/1560/);
      });
    });

    it('devrait calculer correctement les dépenses totales', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Dépenses = 120 + 150 + 500 = 770€
        const container = screen.getByText(/Dépenses/i).closest('div');
        expect(container?.textContent).toMatch(/770/);
      });
    });

    it('devrait calculer le résultat net', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Résultat Brut = CA (1560) - Dépenses (770) = 790€
        const container = screen.getByText(/Résultat Brut/i).closest('div');
        expect(container?.textContent).toMatch(/790/);
      });
    });
  });
});
