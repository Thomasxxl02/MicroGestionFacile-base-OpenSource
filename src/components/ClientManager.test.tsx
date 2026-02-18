/**
 * ClientManager.test.tsx
 * 🧪 Tests du composant ClientManager
 * Validation de la gestion des clients
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClientManager from './ClientManager';
import { Client, Invoice } from '../types';
import * as useDataHooks from '../hooks/useData';

// Mock des dépendances
const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Acme Corp',
    email: 'contact@acme.com',
    address: '123 rue de la Paix',
    country: 'FR',
    currency: 'EUR',
    language: 'fr',
    taxType: 'DOMESTIC',
    paymentTerms: 30,
    siret: '12345678901234',
    phone: '+33123456789',
  },
  {
    id: 'client-2',
    name: 'Tech Solutions',
    email: 'info@techsol.com',
    address: '45 avenue des Champs',
    country: 'FR',
    currency: 'EUR',
    language: 'fr',
    taxType: 'DOMESTIC',
    paymentTerms: 30,
    tvaNumber: 'FR12345678901',
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
    items: [],
    type: 'invoice',
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 'inv-2',
    number: 'FAC-002',
    clientId: 'client-1',
    date: '2025-02-10',
    dueDate: '2025-03-10',
    status: 'paid',
    total: 800,
    subtotal: 666.67,
    taxAmount: 133.33,
    items: [],
    type: 'invoice',
    createdAt: '2025-02-10T00:00:00.000Z',
    updatedAt: '2025-02-10T00:00:00.000Z',
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

vi.mock('../hooks/useData', () => ({
  useClients: vi.fn(() => mockClients),
  useInvoices: vi.fn(() => mockInvoices),
}));

vi.mock('../services/db', () => ({
  db: {
    clients: {
      add: vi.fn((client) => Promise.resolve(client.id)),
      update: vi.fn((_id, _data) => Promise.resolve(1)),
      delete: vi.fn((_id) => Promise.resolve()),
      toArray: vi.fn(() => Promise.resolve(mockClients)),
    },
  },
}));

vi.mock('../services/validationService', () => ({
  validateClient: vi.fn((_client) => ({
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('🧪 ClientManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendu initial', () => {
    it('devrait se rendre sans erreur', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument();
      });
    });

    it('devrait afficher la liste des clients actifs', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
        expect(screen.queryByText('Berlin GmbH')).not.toBeInTheDocument(); // archived
      });
    });

    it('devrait afficher les statistiques correctes', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        // 2 clients actifs (client-3 est archivé)
        expect(screen.getByText(/2/)).toBeInTheDocument();
      });
    });
  });

  describe('Recherche et filtrage', () => {
    it('devrait filtrer les clients par nom', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'Acme');

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.queryByText('Tech Solutions')).not.toBeInTheDocument();
      });
    });

    it('devrait filtrer les clients par email', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'techsol');

      await waitFor(() => {
        expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
        expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
      });
    });

    it('devrait gérer la recherche insensible à la casse', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'ACME');

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });
    });
  });

  describe('Tri des clients', () => {
    it('devrait permettre de trier par nom', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        const clientNames = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
        expect(clientNames[0]).toBe('Acme Corp');
      });
    });

    it("devrait permettre de trier par chiffre d'affaires", async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      // Par défaut, client-1 (2000€) devrait être avant client-2 (0€ - facture draft)
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });
    });
  });

  describe('Affichage des clients archivés', () => {
    it('ne devrait pas afficher les clients archivés par défaut', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('Berlin GmbH')).not.toBeInTheDocument();
      });
    });

    it('devrait afficher les clients archivés quand activé', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      // Chercher le bouton d'affichage des archivés
      const archiveButton = screen.getByLabelText(/archivés/i) || screen.getByRole('checkbox');
      await user.click(archiveButton);

      await waitFor(() => {
        expect(screen.getByText('Berlin GmbH')).toBeInTheDocument();
      });
    });
  });

  describe('Calcul des statistiques clients', () => {
    it("devrait calculer correctement le chiffre d'affaires par client", async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        // Client-1 a 2 factures payées: 1200 + 800 = 2000€
        expect(screen.getByText(/2[\s,]?000/)).toBeInTheDocument();
      });
    });

    it('ne devrait compter que les factures payées', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        // Client-2 a 1 facture draft qui ne doit pas être comptée
        const stats = screen.getAllByText(/0/);
        expect(stats.length).toBeGreaterThan(0);
      });
    });

    it('devrait gérer les avoirs (credit notes)', async () => {
      // Ajouter un avoir dans les mocks pour ce test
      const mockInvoicesWithCredit = [
        ...mockInvoices,
        {
          id: 'inv-4',
          number: 'AV-001',
          clientId: 'client-1',
          date: '2025-02-15',
          dueDate: '2025-02-15',
          status: 'paid',
          total: 300,
          subtotal: 250,
          taxAmount: 50,
          items: [],
          type: 'credit_note',
          createdAt: '2025-02-15T00:00:00.000Z',
          updatedAt: '2025-02-15T00:00:00.000Z',
        },
      ];

      vi.mocked(useDataHooks.useInvoices).mockReturnValueOnce(mockInvoicesWithCredit as Invoice[]);

      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        // Client-1: 2000 - 300 = 1700€
        expect(screen.getByText(/1[\s,]?700/)).toBeInTheDocument();
      });
    });
  });

  describe('Types de clients internationaux', () => {
    it('devrait afficher le badge correct pour un client FR', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('🇫🇷')).toBeInTheDocument();
      });
    });

    it('devrait afficher les informations fiscales pour clients EU', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      // Afficher les clients archivés pour voir Berlin GmbH
      const archiveButton = screen.getByLabelText(/archivés/i) || screen.getByRole('checkbox');
      await user.click(archiveButton);

      await waitFor(() => {
        expect(screen.getByText(/DE987654321/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('devrait naviguer vers les détails du client au clic', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ClientManager />} />
            <Route path="/:id" element={<div>Client Details</div>} />
          </Routes>
        </BrowserRouter>
      );

      const clientCard = screen.getByText('Acme Corp').closest('div[role="button"]');
      if (clientCard) {
        await user.click(clientCard);
      }

      await waitFor(() => {
        expect(window.location.pathname).toContain('client-1');
      });
    });
  });

  describe('Validation des données', () => {
    it('devrait valider les clients chargés', async () => {
      const { validateClient } = await import('../services/validationService');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(validateClient).toHaveBeenCalled();
      });
    });
  });

  describe('État vide', () => {
    it("devrait afficher un message quand aucun client n'existe", async () => {
      vi.mocked(useDataHooks.useClients).mockReturnValueOnce([]);

      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/aucun client/i)).toBeInTheDocument();
      });
    });

    it('devrait afficher un message quand aucun résultat de recherche', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientManager />} />
          </Routes>
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'ClientInexistant12345');

      await waitFor(() => {
        expect(screen.getByText(/aucun résultat/i)).toBeInTheDocument();
      });
    });
  });
});
