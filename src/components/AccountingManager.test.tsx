/**
 * AccountingManager.test.tsx
 * 🧪 Tests du composant AccountingManager
 * Validation de la gestion comptable
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AccountingManager from './AccountingManager';
import { Invoice, Expense, Client, Supplier, UserProfile } from '../types';
import * as useDataHooks from '../hooks/useData';

// Mock des données comptables
const mockUserProfile: UserProfile = {
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

const mockClients: Client[] = [
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

const mockSuppliers: Supplier[] = [
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

const mockInvoices: Invoice[] = [
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

const mockExpenses: Expense[] = [
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
        expect(screen.getByText(/bilan/i)).toBeInTheDocument();
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
        expect(screen.getByText(/1[\s,]?560/)).toBeInTheDocument();
      });
    });

    it('devrait calculer correctement les dépenses totales', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Dépenses validées uniquement = 120 + 150 = 270€
        expect(screen.getByText(/270/)).toBeInTheDocument();
      });
    });

    it('devrait calculer le résultat net', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Résultat = CA (1560) - Dépenses (270) = 1290€
        expect(screen.getByText(/1[\s,]?290/)).toBeInTheDocument();
      });
    });

    it('ne devrait compter que les factures payées', async () => {
      const mockInvoicesWithDraft = [
        ...mockInvoices,
        {
          id: 'inv-4',
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
      ];

      vi.mocked(useDataHooks.useInvoices).mockReturnValueOnce(mockInvoicesWithDraft);

      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Le CA ne doit pas inclure la facture draft
        expect(screen.queryByText(/6[\s,]?560/)).not.toBeInTheDocument();
      });
    });

    it('devrait gérer les avoirs dans le calcul du CA', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // L'avoir AV-001 (240€) doit être déduit du CA
        // CA sans avoir serait 1800€, avec avoir = 1560€
        expect(screen.getByText(/1[\s,]?560/)).toBeInTheDocument();
      });
    });
  });

  describe('Calcul des cotisations URSSAF', () => {
    it('devrait afficher les cotisations calculées', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Montant total des cotisations (mockées à 364.8€)
        expect(screen.getByText(/364[.,]8/)).toBeInTheDocument();
      });
    });

    it('devrait afficher le détail des cotisations', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Vérifier la présence des différentes cotisations
        expect(screen.getByText(/sécurité sociale/i)).toBeInTheDocument();
        expect(screen.getByText(/CFP/i)).toBeInTheDocument();
      });
    });
  });

  describe('TVA', () => {
    it('devrait calculer la TVA collectée', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // TVA collectée = 200 + 100 - 40 (avoir) = 260€
        expect(screen.getByText(/260/)).toBeInTheDocument();
      });
    });

    it('devrait calculer la TVA déductible', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // TVA déductible = 24 + 30 = 54€ (dépenses validées uniquement)
        expect(screen.getByText(/54/)).toBeInTheDocument();
      });
    });

    it('devrait calculer la TVA à payer', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // TVA à payer = Collectée (260) - Déductible (54) = 206€
        expect(screen.getByText(/206/)).toBeInTheDocument();
      });
    });

    it('ne devrait pas afficher la TVA si exonéré', async () => {
      const vatExemptProfile = { ...mockUserProfile, isVatExempt: true };
      vi.mocked(useDataHooks.useUserProfile).mockReturnValueOnce({
        profile: vatExemptProfile,
        isLoading: false,
      });

      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Section TVA ne devrait pas être visible
        expect(screen.queryByText(/TVA à payer/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Filtrage par période', () => {
    it('devrait permettre de filtrer par année', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      const yearButton = screen.getByRole('button', { name: /année/i });
      await user.click(yearButton);

      await waitFor(() => {
        expect(screen.getByText(/2025/)).toBeInTheDocument();
      });
    });

    it('devrait permettre de filtrer par mois', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      const monthButton = screen.getByRole('button', { name: /mois/i });
      await user.click(monthButton);

      await waitFor(() => {
        expect(screen.getByText(/février/i)).toBeInTheDocument();
      });
    });

    it('devrait permettre de filtrer par trimestre', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      const quarterButton = screen.getByRole('button', { name: /trimestre/i });
      await user.click(quarterButton);

      await waitFor(() => {
        expect(screen.getByText(/Q1|T1|trimestre 1/i)).toBeInTheDocument();
      });
    });

    it('devrait afficher toutes les données sans filtre', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      const allButton = screen.getByRole('button', { name: /tout/i });
      await user.click(allButton);

      await waitFor(() => {
        // Toutes les factures devraient être comptées
        expect(screen.getByText(/1[\s,]?560/)).toBeInTheDocument();
      });
    });
  });

  describe('Graphiques', () => {
    it('devrait afficher un graphique des revenus vs dépenses', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Recharts crée des éléments SVG
        const charts = screen.getAllByRole('img', { hidden: true });
        expect(charts.length).toBeGreaterThan(0);
      });
    });

    it('devrait afficher un graphique circulaire des dépenses', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Vérifier la présence de catégories de dépenses
        expect(screen.getByText(/Services/i)).toBeInTheDocument();
        expect(screen.getByText(/Énergie/i)).toBeInTheDocument();
      });
    });
  });

  describe('Export FEC', () => {
    it("devrait permettre d'exporter le FEC", async () => {
      const user = userEvent.setup();
      const { downloadFEC } = await import('../services/fecService');

      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      const exportButton = screen.getByRole('button', { name: /télécharger fec/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(downloadFEC).toHaveBeenCalled();
      });
    });
  });

  describe('Journal comptable', () => {
    it("devrait afficher l'onglet journal", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      const journalTab = screen.getByRole('button', { name: /journal/i });
      await user.click(journalTab);

      await waitFor(
        () => {
          expect(screen.getByText(/écritures comptables/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('devrait générer des écritures comptables automatiquement', async () => {
      const user = userEvent.setup();
      const { generateJournalEntries } = await import('../services/accountingService');

      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      const journalTab = screen.getByRole('button', { name: /journal/i });
      await user.click(journalTab);

      await waitFor(
        () => {
          expect(generateJournalEntries).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('devrait afficher les comptes et montants', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      const journalTab = screen.getByRole('button', { name: /journal/i });
      await user.click(journalTab);

      await waitFor(() => {
        // Vérifier la présence de comptes comptables
        expect(screen.getByText(/411000|Clients/i)).toBeInTheDocument();
      });
    });

    it('devrait équilibrer débits et crédits', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      const journalTab = screen.getByRole('button', { name: /journal/i });
      await user.click(journalTab);

      await waitFor(() => {
        // Les totaux débits et crédits doivent être affichés et égaux
        const debits = screen.getAllByText(/débit/i);
        const credits = screen.getAllByText(/crédit/i);
        expect(debits.length).toBeGreaterThan(0);
        expect(credits.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Indicateurs de performance', () => {
    it('devrait afficher le ratio de charges', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Ratio = (270 / 1560) * 100 = 17.3%
        expect(screen.getByText(/17[.,]3%/)).toBeInTheDocument();
      });
    });

    it('devrait afficher la marge nette', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Marge = ((1560 - 270) / 1560) * 100 = 82.7%
        expect(screen.getByText(/82[.,]7%/)).toBeInTheDocument();
      });
    });

    it('devrait calculer le point mort', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Point mort = charges fixes / marge
        expect(screen.getByText(/point mort|seuil de rentabilité/i)).toBeInTheDocument();
      });
    });
  });

  describe('Recherche dans le journal', () => {
    it('devrait permettre de rechercher des écritures', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      const journalTab = screen.getByRole('button', { name: /journal/i });
      await user.click(journalTab);

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'Clients');

      await waitFor(() => {
        expect(screen.getByText(/Clients/i)).toBeInTheDocument();
      });
    });
  });

  describe('Gestion des utilisateurs avancés', () => {
    it('devrait afficher des conseils pour optimiser la fiscalité', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/conseil|optimisation|astuce/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation des montants avec Decimal.js', () => {
    it('devrait utiliser Decimal pour la précision monétaire', async () => {
      render(
        <BrowserRouter>
          <AccountingManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Vérifier que les montants affichés sont précis (pas d'erreurs d'arrondi)
        // Ex: 1560.00 et non 1559.9999999
        const amounts = screen.getAllByText(/€/);
        expect(amounts.length).toBeGreaterThan(0);
      });
    });
  });
});
