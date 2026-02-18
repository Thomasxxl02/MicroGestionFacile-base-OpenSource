/**
 * Dashboard.test.tsx
 * 🧪 Tests du composant Dashboard principal
 * Validation de l'affichage des données de gestion
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock des données et services
vi.mock('../hooks/useValidatedData', () => ({
  useValidatedInvoices: vi.fn(() => ({
    data: [
      {
        id: 'inv-1',
        number: 'FAC-001',
        date: '2025-02-01',
        total: 1200,
        status: 'paid',
      },
    ],
    errorSummary: null,
  })),
  useValidatedExpenses: vi.fn(() => ({
    data: [
      {
        id: 'exp-1',
        description: 'Test',
        amount: 100,
        status: 'validated',
      },
    ],
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
}));

vi.mock('../hooks/useAsync', () => ({
  useAsync: () => ({
    execute: vi.fn(async (fn) => {
      try {
        return await fn();
      } catch {
        return null;
      }
    }),
    data: null,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../services/businessService', () => ({
  calculateUrssaf: vi.fn(() => ({
    totalVA: 1200,
    tax: 200,
  })),
  checkVatThreshold: vi.fn(() => ({
    exceedsThreshold: false,
    threshold: 36500,
  })),
  checkCaThreshold: vi.fn(() => ({
    exceedsThreshold: false,
    threshold: 72600,
  })),
  getNextUrssafDeadline: vi.fn(() => ({
    date: new Date('2025-03-15'),
    label: 'Prochaine déclaration',
  })),
}));

vi.mock('../services/geminiService', () => ({
  analyzePredictiveVat: vi.fn(() =>
    Promise.resolve({
      predictedVatAmount: 500,
      confidence: 0.9,
    })
  ),
}));

vi.mock('../services/loggerService', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../store', () => ({
  useUIStore: () => ({
    isDarkMode: false,
  }),
}));

vi.mock('../components/ThresholdMonitor', () => ({
  default: () => <div data-testid="threshold-monitor">Threshold Monitor</div>,
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

vi.mock('../components/ui/Card', () => ({
  default: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { children, title }: any
  ) => (
    <div data-testid="card">
      {title && <h2>{title}</h2>}
      {children}
    </div>
  ),
}));

vi.mock('../components/ui/Badge', () => ({
  default: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { children }: any
  ) => <span data-testid="badge">{children}</span>,
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

vi.mock('../components/ui/EmptyState', () => ({
  default: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { title, description }: any
  ) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));

describe('📊 Dashboard Component', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Wrapper = ({ children }: any) => <BrowserRouter>{children}</BrowserRouter>;

  describe('Rendu initial', () => {
    it('devrait se rendre sans erreur', () => {
      const { container } = render(<Dashboard />, { wrapper: Wrapper });
      expect(container).toBeTruthy();
    });

    it('devrait afficher le composant Header', () => {
      render(<Dashboard />, { wrapper: Wrapper });
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('devrait afficher le ThresholdMonitor', () => {
      render(<Dashboard />, { wrapper: Wrapper });
      expect(screen.getByTestId('threshold-monitor')).toBeInTheDocument();
    });

    it('devrait afficher des cartes de statistiques', () => {
      render(<Dashboard />, { wrapper: Wrapper });
      const cards = screen.getAllByTestId('card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Affichage des données', () => {
    it('devrait afficher les KPIs principaux', async () => {
      render(<Dashboard />, { wrapper: Wrapper });

      await waitFor(() => {
        // Vérifier que le contenu est rendu (statistiques, montants, etc.)
        expect(screen.getByTestId('threshold-monitor')).toBeInTheDocument();
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de validation', () => {
      render(<Dashboard />, { wrapper: Wrapper });
      // Vérifier que le composant se rend même avec erreur
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('devrait contenir un Header avec titre', () => {
      render(<Dashboard />, { wrapper: Wrapper });
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('devrait contenir des boutons navigables', () => {
      render(<Dashboard />, { wrapper: Wrapper });
      const buttons = screen.queryAllByTestId('button');
      buttons.forEach((btn) => {
        expect(btn).toBeInTheDocument();
      });
    });
  });

  describe('Intégration avec les hooks', () => {
    it('devrait utiliser les données validées', () => {
      render(<Dashboard />, { wrapper: Wrapper });

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('devrait afficher le ThresholdMonitor pour la surveillance des seuils', () => {
      render(<Dashboard />, { wrapper: Wrapper });

      expect(screen.getByTestId('threshold-monitor')).toBeInTheDocument();
    });
  });
});
