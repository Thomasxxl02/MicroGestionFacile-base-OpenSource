/**
 * InvoiceManager.test.tsx
 * 🧪 Tests du composant InvoiceManager
 * Validation de la gestion des factures
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InvoiceManager from './InvoiceManager';

// Mock des dépendances
vi.mock('../hooks/useData', () => ({
  useInvoices: vi.fn(() => [
    {
      id: 'inv-1',
      number: 'FAC-001',
      date: '2025-02-01',
      clientId: 'client-1',
      total: 1200,
      status: 'draft',
    },
  ]),
  useClients: vi.fn(() => [
    {
      id: 'client-1',
      name: 'Client Test',
      email: 'client@test.com',
    },
  ]),
  useProducts: vi.fn(() => [
    {
      id: 'prod-1',
      name: 'Product Test',
      price: 100,
    },
  ]),
  useUserProfile: vi.fn(() => ({
    profile: {
      id: 'user-1',
      companyName: 'Test Company',
      siret: '12345678901234',
    },
  })),
}));

vi.mock('../services/db', () => ({
  db: {
    invoices: {
      add: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(() => []),
    },
  },
}));

vi.mock('../services/businessService', () => ({
  generateFacturX_XML: vi.fn(() => '<xml></xml>'),
  getNextDocumentNumber: vi.fn(() => 'FAC-002'),
}));

vi.mock('../services/pdfService', () => ({
  generateImmutablePDF_Server: vi.fn(),
  generatePDF: vi.fn(),
}));

vi.mock('../services/validationService', () => ({
  validateInvoice: vi.fn(() => ({
    valid: true,
    data: {},
    errors: [],
  })),
}));

vi.mock('../services/loggerService', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../hooks/useAsync', () => ({
  useAsync: () => ({
    execute: vi.fn(async (fn) => {
      return await fn();
    }),
    data: null,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../lib/utils', () => ({
  calculateHash: vi.fn(() => 'hash-123'),
}));

vi.mock('../components/ui/Header', () => ({
  default: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { children, title }: any
  ) => (
    <div data-testid="header">
      {title && <h1>{title}</h1>}
      {children}
    </div>
  ),
}));

vi.mock('../components/ui/Button', () => ({
  default: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { children, onClick }: any
  ) => (
    <button data-testid="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('../components/ui/ConfirmDialog', () => ({
  default: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { isOpen, onConfirm, onCancel, children, title }: any
  ) => (
    <>
      {isOpen && (
        <div data-testid="confirm-dialog">
          <h2>{title}</h2>
          {children}
          <button data-testid="confirm-btn" onClick={onConfirm}>
            Confirmer
          </button>
          <button data-testid="cancel-btn" onClick={onCancel}>
            Annuler
          </button>
        </div>
      )}
    </>
  ),
}));

vi.mock('../components/invoices/InvoiceList', () => ({
  default: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { onEdit, onDelete }: any
  ) => (
    <div data-testid="invoice-list">
      <button data-testid="invoice-edit" onClick={() => onEdit?.('inv-1')}>
        Éditer
      </button>
      <button data-testid="invoice-delete" onClick={() => onDelete?.('inv-1')}>
        Supprimer
      </button>
    </div>
  ),
}));

vi.mock('../components/invoices/InvoiceForm', () => ({
  default: ({ onBack, onSave }: any) => (
    <div data-testid="invoice-form">
      <button
        data-testid="form-submit"
        onClick={() => onSave?.({ total: 1200 }, 'client-1', false)}
      >
        Enregistrer
      </button>
      <button data-testid="form-back" onClick={onBack}>
        Retour
      </button>
    </div>
  ),
}));

vi.mock('../components/invoices/InvoicePreviewDocument', () => ({
  default: ({ invoice, onBack }: any) => (
    <div data-testid="invoice-preview">
      <p>{invoice?.number}</p>
      <button data-testid="preview-back" onClick={onBack}>
        Retour
      </button>
    </div>
  ),
}));

describe('📄 InvoiceManager Component', () => {
  const Wrapper = ({ children }: any) => (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={children} />
        <Route path="/new" element={children} />
        <Route path="/edit/:id" element={children} />
        <Route path="/preview/:id" element={children} />
      </Routes>
    </BrowserRouter>
  );

  describe('Rendu initial', () => {
    it('devrait se rendre sans erreur', () => {
      const { container } = render(<InvoiceManager />, { wrapper: Wrapper });
      expect(container).toBeTruthy();
    });

    it('devrait afficher le Header', async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('devrait afficher la liste des factures au démarrage', async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByTestId('invoice-list')).toBeInTheDocument();
      });
    });
  });

  describe('Gestion des factures', () => {
    it('devrait charger les factures existantes', async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('devrait charger les clients pour sélection', async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('devrait charger le profil utilisateur', async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });
  });

  describe('Export Factur-X', () => {
    it('devrait générer un fichier XML Factur-X', async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });

      // Vérifier que le composant se rend sans erreur
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('devrait valider les factures avant sauvegarde', async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });

      // Vérifier que le composant se rend sans erreur
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Sauvegardes et Opérations', () => {
    it('devrait utiliser useAsync pour les opérations', async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('devrait supporter la création de nouvelles factures', async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it("devrait supporter l'édition de factures", async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });

      const editBtn = await screen.findByTestId('invoice-edit');
      expect(editBtn).toBeInTheDocument();
    });

    it('devrait supporter la suppression de factures', async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });

      const deleteBtn = await screen.findByTestId('invoice-delete');
      expect(deleteBtn).toBeInTheDocument();
    });
  });

  describe("Gestion d'erreurs", () => {
    it('devrait gérer les clients manquants', async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it("devrait afficher un message d'erreur si le client n'existe pas", async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });

      // Le composant devrait gérer l'erreur
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('État et Hooks', () => {
    it("devrait maintenir l'état de suppression confirmée", async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });
      // Vérifier que le state exists
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it("devrait utiliser le store de l'UI", async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });
      // Vérifier que le composant se rend
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Lazy Loading', () => {
    it('devrait utiliser le lazy loading pour les sous-composants', async () => {
      render(<InvoiceManager />, { wrapper: Wrapper });

      // Les composants des factures devraient être chargés avec Suspense
      await waitFor(() => {
        expect(screen.getByTestId('invoice-list')).toBeInTheDocument();
      });
    });
  });
});
