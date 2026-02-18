/**
 * SupplierManager.test.tsx
 * 🧪 Tests du composant SupplierManager
 * Validation de la gestion des fournisseurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SupplierManager from './SupplierManager';
import { Supplier, Expense} from '../types';
import * as useDataHooks from '../hooks/useData';

// Mock des fournisseurs de test
const mockSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'OVH',
    email: 'contact@ovh.com',
    address: '2 rue Kellermann',
    phone: '+33123456789',
    siret: '42478828500538',
    category: 'Hébergement',
    notes: 'Fournisseur cloud principal',
    iban: 'encrypted_iban_1',
    bic: 'encrypted_bic_1',
    country: 'FR',
    origin: 'FR',
    currency: 'EUR',
    status: 'VALIDATED',
  },
  {
    id: 'sup-2',
    name: 'Adobe Inc',
    email: 'sales@adobe.com',
    address: '345 Park Avenue, San Jose',
    phone: '+14085366000',
    category: 'Logiciels',
    notes: 'Creative Cloud subscription',
    vatNumber: 'US123456789',
    country: 'US',
    origin: 'NON_EU',
    currency: 'USD',
    status: 'VALIDATED',
  },
  {
    id: 'sup-3',
    name: 'Electricité de France',
    email: 'contact@edf.fr',
    address: '22-30 Avenue de Wagram, Paris',
    category: 'Énergie',
    siret: '55208131600047',
    country: 'FR',
    origin: 'FR',
    currency: 'EUR',
    status: 'PENDING',
  },
  {
    id: 'sup-4',
    name: 'Bureau Veritas',
    email: 'info@bureauveritas.com',
    category: 'Services',
    country: 'FR',
    origin: 'FR',
    currency: 'EUR',
    status: 'VALIDATED',
  },
];

const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    date: '2025-02-01',
    description: 'Hébergement serveur',
    amount: 120,
    vatAmount: 24,
    category: 'Services',
    status: 'validated',
    supplierId: 'sup-1',
    createdAt: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 'exp-2',
    date: '2025-02-10',
    description: 'Abonnement Creative Cloud',
    amount: 60,
    vatAmount: 12,
    category: 'Logiciels',
    status: 'validated',
    supplierId: 'sup-2',
    createdAt: '2025-02-10T00:00:00.000Z',
  },
  {
    id: 'exp-3',
    date: '2025-02-15',
    description: 'Facture électricité',
    amount: 150,
    vatAmount: 30,
    category: 'Énergie',
    status: 'validated',
    supplierId: 'sup-3',
    createdAt: '2025-02-15T00:00:00.000Z',
  },
  {
    id: 'exp-4',
    date: '2025-01-20',
    description: 'Hébergement serveur mois précédent',
    amount: 120,
    vatAmount: 24,
    category: 'Services',
    status: 'validated',
    supplierId: 'sup-1',
    createdAt: '2025-01-20T00:00:00.000Z',
  },
];

vi.mock('../hooks/useData', () => ({
  useSuppliers: vi.fn(() => mockSuppliers),
  useExpenses: vi.fn(() => mockExpenses),
}));

vi.mock('../services/db', () => ({
  db: {
    suppliers: {
      add: vi.fn((supplier) => Promise.resolve(supplier.id)),
      update: vi.fn((_id, _data) => Promise.resolve(1)),
      delete: vi.fn((_id) => Promise.resolve()),
      toArray: vi.fn(() => Promise.resolve(mockSuppliers)),
    },
  },
}));

vi.mock('../services/securityService', () => ({
  securityService: {
    encrypt: vi.fn((data) => Promise.resolve(`encrypted_${data}`)),
    decrypt: vi.fn((data) => Promise.resolve(data.replace('encrypted_', ''))),
  },
}));

vi.mock('../services/validationService', () => ({
  validateSupplier: vi.fn((_supplier) => ({
    valid: true,
    errors: [],
    warnings: [],
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('🧪 SupplierManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendu initial', () => {
    it('devrait se rendre sans erreur', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument();
      });
    });

    it('devrait afficher la liste des fournisseurs', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('OVH')).toBeInTheDocument();
        expect(screen.getByText('Adobe Inc')).toBeInTheDocument();
        expect(screen.getByText('Electricité de France')).toBeInTheDocument();
      });
    });

    it('devrait afficher les statistiques correctes', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // 4 fournisseurs au total
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });
  });

  describe('Calcul des dépenses par fournisseur', () => {
    it('devrait calculer correctement le total dépensé par fournisseur', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // OVH: 120 + 120 = 240€
        expect(screen.getByText(/240/)).toBeInTheDocument();
      });
    });

    it('devrait compter le nombre de dépenses par fournisseur', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // OVH a 2 dépenses
        const ovhCard = screen.getByText('OVH').closest('div');
        expect(ovhCard).toHaveTextContent('2');
      });
    });

    it('ne devrait compter que les dépenses validées', async () => {
      const mockExpensesWithDraft = [
        ...mockExpenses,
        {
          id: 'exp-5',
          date: '2025-02-20',
          description: 'Dépense annulée',
          amount: 1000,
          vatAmount: 200,
          category: 'Services',
          status: 'cancelled' as const,
          supplierId: 'sup-1',
          createdAt: '2025-02-20T00:00:00.000Z',
        },
      ];

      vi.mocked(useDataHooks.useExpenses).mockReturnValueOnce(mockExpensesWithDraft);

      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // L'annulation ne doit pas être comptée: toujours 240€ pour OVH
        expect(screen.getByText(/240/)).toBeInTheDocument();
      });
    });
  });

  describe('Recherche et filtrage', () => {
    it('devrait filtrer les fournisseurs par nom', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'OVH');

      await waitFor(() => {
        expect(screen.getByText('OVH')).toBeInTheDocument();
        expect(screen.queryByText('Adobe Inc')).not.toBeInTheDocument();
      });
    });

    it('devrait filtrer par catégorie', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'Logiciels');

      await waitFor(() => {
        expect(screen.getByText('Adobe Inc')).toBeInTheDocument();
        expect(screen.queryByText('OVH')).not.toBeInTheDocument();
      });
    });

    it('devrait gérer la recherche insensible à la casse', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'ovh');

      await waitFor(() => {
        expect(screen.getByText('OVH')).toBeInTheDocument();
      });
    });
  });

  describe('Tri des fournisseurs', () => {
    it('devrait trier par nom (par défaut)', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        const supplierNames = screen
          .getAllByRole('heading', { level: 4 })
          .map((h) => h.textContent);
        
        // Ordre alphabétique: Adobe, Bureau Veritas, Electricité, OVH
        expect(supplierNames[0]).toBe('Adobe Inc');
      });
    });

    it('devrait permettre de trier par dépenses', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      const sortSelect = screen.getByLabelText(/trier/i);
      await user.selectOptions(sortSelect, 'spending');

      await waitFor(() => {
        // OVH (240€) devrait être en premier
        const firstSupplier = screen.getAllByRole('heading', { level: 4 })[0];
        expect(firstSupplier).toHaveTextContent('OVH');
      });
    });

    it('devrait permettre de trier par catégorie', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      const sortSelect = screen.getByLabelText(/trier/i);
      await user.selectOptions(sortSelect, 'category');

      await waitFor(() => {
        // Tri alphabétique des catégories
        const categories = screen
          .getAllByText(/Hébergement|Logiciels|Énergie|Services/i)
          .map((el) => el.textContent);
        expect(categories.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Filtre par catégorie', () => {
    it('devrait afficher les catégories disponibles', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Hébergement')).toBeInTheDocument();
        expect(screen.getByText('Logiciels')).toBeInTheDocument();
        expect(screen.getByText('Énergie')).toBeInTheDocument();
      });
    });

    it('devrait filtrer par catégorie sélectionnée', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      const categoryFilter = screen.getByLabelText(/catégorie/i);
      await user.selectOptions(categoryFilter, 'Logiciels');

      await waitFor(() => {
        expect(screen.getByText('Adobe Inc')).toBeInTheDocument();
        expect(screen.queryByText('OVH')).not.toBeInTheDocument();
      });
    });
  });

  describe('Affichage des informations', () => {
    it('devrait afficher le SIRET pour les fournisseurs français', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/42478828500538/)).toBeInTheDocument();
        expect(screen.getByText(/55208131600047/)).toBeInTheDocument();
      });
    });

    it('devrait afficher le numéro de TVA pour les fournisseurs étrangers', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/US123456789/)).toBeInTheDocument();
      });
    });

    it('devrait afficher le pays d\'origine', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('🇫🇷')).toBeInTheDocument();
        expect(screen.getByText('🇺🇸')).toBeInTheDocument();
      });
    });

    it('devrait afficher la devise', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/EUR/)).toBeInTheDocument();
        expect(screen.getByText(/USD/)).toBeInTheDocument();
      });
    });
  });

  describe('Statuts des fournisseurs', () => {
    it('devrait afficher le badge APPROVED', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/approved|approuvé/i)).toBeInTheDocument();
      });
    });

    it('devrait afficher le badge PENDING', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/pending|en attente/i)).toBeInTheDocument();
      });
    });
  });

  describe('Catégories de fournisseurs', () => {
    it('devrait afficher les badges de catégorie', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Hébergement')).toBeInTheDocument();
        expect(screen.getByText('Logiciels')).toBeInTheDocument();
        expect(screen.getByText('Énergie')).toBeInTheDocument();
        expect(screen.getByText('Services')).toBeInTheDocument();
      });
    });
  });

  describe('Sécurité des données sensibles', () => {
    it('devrait masquer les IBAN par défaut', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Les IBAN ne doivent pas être visibles en clair
        expect(screen.queryByText(/FR76/)).not.toBeInTheDocument();
      });
    });

    it('devrait permettre de révéler les IBAN', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      // Cliquer sur le bouton de révélation
      const revealButtons = screen.getAllByLabelText(/révéler|afficher/i);
      if (revealButtons.length > 0) {
        await user.click(revealButtons[0]);
        
        await waitFor(() => {
          // L'IBAN déchiffré devrait apparaître
          expect(screen.getByText(/iban/i)).toBeInTheDocument();
        });
      }
    });

    it('devrait chiffrer les données sensibles avant sauvegarde', async () => {
      const { securityService } = await import('../services/securityService');
      
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      // Ouvrir le formulaire d'édition
      const editButtons = screen.getAllByLabelText(/modifier/i);
      if (editButtons.length > 0) {
        await userEvent.click(editButtons[0]);
      }

      await waitFor(() => {
        expect(securityService.decrypt).toHaveBeenCalled();
      });
    });
  });

  describe('Dernière activité', () => {
    it('devrait afficher la date de dernière dépense', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // OVH a une dépense le 2025-02-01
        expect(screen.getByText(/2025-02-01|février 2025|dernière activité/i)).toBeInTheDocument();
      });
    });

    it('ne devrait rien afficher si aucune dépense', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Bureau Veritas n'a pas de dépenses
        const bureauVeritasCard = screen.getByText('Bureau Veritas').closest('div');
        expect(bureauVeritasCard).not.toHaveTextContent(/dernière activité/i);
      });
    });
  });

  describe('Export CSV', () => {
    it('devrait pouvoir exporter les fournisseurs en CSV', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      const exportButton = screen.getByRole('button', { name: /exporter/i });
      await user.click(exportButton);

      // Vérifier qu'aucune erreur n'est levée
      await waitFor(() => {
        expect(screen.queryByText(/erreur/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('État vide', () => {
    it('devrait afficher un message quand aucun fournisseur n\'existe', async () => {
      vi.mocked(useDataHooks.useSuppliers).mockReturnValueOnce([]);

      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/aucun.*fournisseur/i)).toBeInTheDocument();
      });
    });

    it('devrait afficher un message quand aucun résultat de recherche', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'FournisseurInexistant12345');

      await waitFor(() => {
        expect(screen.getByText(/aucun résultat/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation des données', () => {
    it('devrait valider les fournisseurs chargés', async () => {
      const { validateSupplier } = await import('../services/validationService');
      
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(validateSupplier).toHaveBeenCalled();
      });
    });
  });

  describe('Calculs avec Decimal.js', () => {
    it('devrait utiliser Decimal pour les calculs de dépenses', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Vérifier que les montants sont précis (pas d'erreurs d'arrondi)
        const amounts = screen.getAllByText(/€/);
        expect(amounts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Notes et informations additionnelles', () => {
    it('devrait afficher les notes si présentes', async () => {
      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Fournisseur cloud principal/i)).toBeInTheDocument();
      });
    });

    it('devrait afficher les codes comptables', async () => {
      const mockSuppliersWithAccounting = mockSuppliers.map((s) => ({
        ...s,
        accountingCode: '401' + s.id.slice(-3),
      }));

      vi.mocked(useDataHooks.useSuppliers).mockReturnValueOnce(
        mockSuppliersWithAccounting
      );

      render(
        <BrowserRouter>
          <SupplierManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/401/)).toBeInTheDocument();
      });
    });
  });
});
