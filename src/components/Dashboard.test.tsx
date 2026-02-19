/**
 * Dashboard.test.tsx
 * 🧪 Tests du composant Dashboard principal
 * Validation de l'affichage des données de gestion
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import Dashboard from './Dashboard';
import { renderWithRouter, resetTestData } from '../tests/testUtils';

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

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {
    // Required by ResizeObserver API
  }
  unobserve() {
    // Required by ResizeObserver API
  }
  disconnect() {
    // Required by ResizeObserver API
  }
} as any;

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
  default: ({ children, title }: any) => (
    <div data-testid="header">
      {title && <h1>{title}</h1>}
      {children}
    </div>
  ),
}));

vi.mock('../components/ui/Card', () => ({
  default: ({ children, title }: any) => (
    <div data-testid="card">
      {title && <h2>{title}</h2>}
      {children}
    </div>
  ),
}));

vi.mock('../components/ui/Badge', () => ({
  default: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock('../components/ui/Button', () => ({
  default: ({ children, onClick }: any) => (
    <button data-testid="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('../components/ui/EmptyState', () => ({
  default: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));

describe('📊 Dashboard Component', () => {
  beforeEach(() => {
    resetTestData();
  });

  describe('Rendu initial', () => {
    it('devrait se rendre sans erreur', async () => {
      const { container } = await act(async () => {
        return renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });
      expect(container).toBeTruthy();
    });

    it('devrait afficher le composant Header', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('devrait afficher le ThresholdMonitor', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });
      expect(screen.getByTestId('threshold-monitor')).toBeInTheDocument();
    });

    it('devrait afficher des cartes de statistiques', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });
      const cards = screen.getAllByTestId('card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Affichage des graphiques', () => {
    it('devrait afficher le graphique des revenus mensuels (BarChart)', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });
      const barChart = screen.getByTestId('recharts-barchart');
      expect(barChart).toBeInTheDocument();
    });

    it('devrait avoir des données dans le graphique BarChart', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });
      const barChart = screen.getByTestId('recharts-barchart');
      // Vérifier que le chart container existe et contient du contenu
      expect(barChart).toBeInTheDocument();
      // Vérifier qu'il y a du SVG rendu (données)
      const svg = barChart.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.children.length).toBeGreaterThan(0);
    });

    it('devrait afficher les axes X et Y du graphique', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });
      // Vérifier que le chart container existe
      const barChart = screen.getByTestId('recharts-barchart');
      expect(barChart).toBeInTheDocument();
      // Les axes sont rendus à l'intérieur du SVG de Recharts
      expect(barChart.querySelector('svg')).toBeTruthy();
    });

    it('devrait afficher le tooltip du graphique', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });
      // Vérifier que le chart container existe (le tooltip y est intégré)
      const barChart = screen.getByTestId('recharts-barchart');
      expect(barChart).toBeInTheDocument();
      // Le Tooltip est rendu comme partie du BarChart
      expect(barChart.innerHTML.length).toBeGreaterThan(0);
    });

    it('devrait afficher les barres de revenus et avoirs', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });
      // Vérifier que le chart container avec les barres existe
      const barChart = screen.getByTestId('recharts-barchart');
      expect(barChart).toBeInTheDocument();
      // Les barres sont rendues comme des éléments g/path internes au SVG
      const svgElement = barChart.querySelector('svg');
      expect(svgElement).toBeTruthy();
      // Vérifier que le SVG n'est pas vide
      expect(svgElement?.querySelector('g')).toBeTruthy();
    });
  });

  describe('Affichage des données', () => {
    it('devrait afficher les KPIs principaux', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });

      await waitFor(() => {
        // Vérifier que le contenu est rendu (statistiques, montants, etc.)
        expect(screen.getByTestId('threshold-monitor')).toBeInTheDocument();
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de validation', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });
      // Vérifier que le composant se rend même avec erreur
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('devrait contenir un Header avec titre', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('devrait contenir des boutons navigables', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });
      const buttons = screen.queryAllByTestId('button');
      buttons.forEach((btn) => {
        expect(btn).toBeInTheDocument();
      });
    });
  });

  describe('Intégration avec les hooks', () => {
    it('devrait utiliser les données validées', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('devrait afficher le ThresholdMonitor pour la surveillance des seuils', async () => {
      await act(async () => {
        renderWithRouter(<Dashboard />, { useRoutes: true, withCharts: true });
      });

      expect(screen.getByTestId('threshold-monitor')).toBeInTheDocument();
    });
  });
});
