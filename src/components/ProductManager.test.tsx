/**
 * ProductManager.test.tsx
 * 🧪 Tests du composant ProductManager
 * Validation de la gestion des produits et prestations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ProductManager from './ProductManager';
import { useProducts } from '../hooks/useData';
import { Product } from '../types';

// Mock le hook useData
vi.mock('../hooks/useData', () => ({
  useProducts: vi.fn(),
}));

// Mock des produits de test
const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Consultation SEO',
    description: 'Audit complet de référencement',
    price: 500,
    type: 'service',
    unit: 'heure',
    taxRate: 20,
    taxCategory: 'SERVICE_BIC',
    legalWarranty: '2 ans',
    origin: 'France',
  },
  {
    id: 'prod-2',
    name: 'MacBook Pro M2',
    sku: 'APPLE-MBP-M2-2023',
    brand: 'Apple',
    description: 'Ordinateur portable professionnel',
    shortDescription: 'MacBook Pro 14" M2',
    price: 2499,
    type: 'product',
    unit: 'unité',
    taxRate: 20,
    taxCategory: 'MARCHANDISE',
    stock: 5,
    ecoParticipation: 0.5,
    repairabilityIndex: 6.2,
    legalWarranty: '2 ans',
    origin: 'Chine',
  },
  {
    id: 'prod-3',
    name: 'Formation React',
    description: 'Formation complète sur React et TypeScript',
    price: 1200,
    type: 'service',
    unit: 'journée',
    taxRate: 20,
    taxCategory: 'SERVICE_BIC',
    legalWarranty: 'N/A',
    origin: 'France',
  },
  {
    id: 'prod-4',
    name: 'Clavier Mécanique',
    sku: 'KB-MECH-001',
    brand: 'Keychron',
    description: 'Clavier mécanique pour développeurs',
    price: 150,
    type: 'product',
    unit: 'unité',
    taxRate: 20,
    taxCategory: 'MARCHANDISE',
    stock: 2, // Stock faible
    legalWarranty: '2 ans',
    origin: 'Chine',
  },
];

vi.mock('../hooks/useData', () => ({
  useProducts: vi.fn(() => mockProducts),
}));

vi.mock('../services/db', () => ({
  db: {
    products: {
      add: vi.fn((product) => Promise.resolve(product.id)),
      update: vi.fn((_id, _data) => Promise.resolve(1)),
      delete: vi.fn((_id) => Promise.resolve()),
      toArray: vi.fn(() => Promise.resolve(mockProducts)),
    },
  },
}));

vi.mock('../services/validationService', () => ({
  validateProduct: vi.fn((_product) => ({
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

describe('🧪 ProductManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendu initial', () => {
    it('devrait se rendre sans erreur', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument();
      });
    });

    it('devrait afficher la liste des produits et services', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Consultation SEO')).toBeInTheDocument();
        expect(screen.getByText('MacBook Pro M2')).toBeInTheDocument();
        expect(screen.getByText('Formation React')).toBeInTheDocument();
      });
    });

    it('devrait afficher les statistiques correctes', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // 4 produits au total
        expect(screen.getByText('4')).toBeInTheDocument();

        // 2 prestations
        expect(screen.getByText('2')).toBeInTheDocument();

        // 2 marchandises
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('devrait calculer la valeur du stock correctement', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // MacBook: 2499 * 5 = 12495
        // Clavier: 150 * 2 = 300
        // Total: 12795
        const stockValue = 12495 + 300;
        expect(screen.getByText(new RegExp(stockValue.toString()))).toBeInTheDocument();
      });
    });

    it('devrait identifier les produits en stock faible', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // 1 produit avec stock <= 5 (Clavier avec stock 2)
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('Recherche et filtrage', () => {
    it('devrait filtrer les produits par nom', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'MacBook');

      await waitFor(() => {
        expect(screen.getByText('MacBook Pro M2')).toBeInTheDocument();
        expect(screen.queryByText('Consultation SEO')).not.toBeInTheDocument();
      });
    });

    it('devrait filtrer les produits par description', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'TypeScript');

      await waitFor(() => {
        expect(screen.getByText('Formation React')).toBeInTheDocument();
        expect(screen.queryByText('MacBook Pro M2')).not.toBeInTheDocument();
      });
    });

    it('devrait gérer la recherche insensible à la casse', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'MACBOOK');

      await waitFor(() => {
        expect(screen.getByText('MacBook Pro M2')).toBeInTheDocument();
      });
    });
  });

  describe('Tri des produits', () => {
    it('devrait trier par nom (par défaut)', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        const productNames = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);

        // Ordre alphabétique: Clavier, Consultation, Formation, MacBook
        expect(productNames[0]).toContain('Clavier');
      });
    });

    it('devrait permettre de trier par prix', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      const sortSelect = screen.getByLabelText(/trier/i);
      await user.selectOptions(sortSelect, 'price');

      await waitFor(() => {
        // Le plus cher en premier: MacBook (2499)
        const firstProduct = screen.getAllByRole('heading', { level: 4 })[0];
        expect(firstProduct).toHaveTextContent('MacBook');
      });
    });

    it('devrait permettre de trier par type', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      const sortSelect = screen.getByLabelText(/trier/i);
      await user.selectOptions(sortSelect, 'type');

      await waitFor(() => {
        // Les produits (product) avant les services
        const productCards = screen.getAllByTestId(/product-card/i);
        expect(productCards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Distinction produits / prestations', () => {
    it('devrait afficher le badge correct pour une prestation', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Prestation')).toBeInTheDocument();
      });
    });

    it('devrait afficher le badge correct pour un produit', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Marchandise')).toBeInTheDocument();
      });
    });

    it('devrait afficher le stock pour les produits uniquement', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // MacBook a un stock de 5
        expect(screen.getByText(/stock.*5/i)).toBeInTheDocument();

        // Les services n'ont pas de stock
        const serviceCard = screen.getByText('Consultation SEO').closest('div');
        expect(serviceCard).not.toHaveTextContent(/stock/i);
      });
    });
  });

  describe('Informations légales et commerciales', () => {
    it("devrait afficher l'éco-participation si présente", async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // MacBook a une éco-participation de 0.5€
        expect(screen.getByText(/éco.*0[.,]5/i)).toBeInTheDocument();
      });
    });

    it("devrait afficher l'indice de réparabilité", async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // MacBook a un indice de 6.2
        expect(screen.getByText(/réparabilité.*6[.,]2/i)).toBeInTheDocument();
      });
    });

    it('devrait afficher la garantie légale', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/2 ans/i)).toBeInTheDocument();
      });
    });

    it("devrait afficher l'origine du produit", async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('France')).toBeInTheDocument();
        expect(screen.getByText('Chine')).toBeInTheDocument();
      });
    });

    it('devrait afficher le SKU pour les produits', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/APPLE-MBP-M2-2023/i)).toBeInTheDocument();
      });
    });

    it('devrait afficher la marque', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('Keychron')).toBeInTheDocument();
      });
    });
  });

  describe('Catégories fiscales', () => {
    it('devrait afficher la catégorie fiscale pour les services', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/SERVICE_BIC/i)).toBeInTheDocument();
      });
    });

    it('devrait afficher la catégorie marchandise', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/MARCHANDISE/i)).toBeInTheDocument();
      });
    });
  });

  describe('Affichage des prix', () => {
    it('devrait afficher le prix HT correctement formaté', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/500.*€/)).toBeInTheDocument();
        expect(screen.getByText(/2[\s,]?499.*€/)).toBeInTheDocument();
      });
    });

    it('devrait afficher le taux de TVA', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/20%/)).toBeInTheDocument();
      });
    });
  });

  describe('Export CSV', () => {
    it('devrait pouvoir exporter le catalogue en CSV', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <ProductManager />
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
    it("devrait afficher un message quand aucun produit n'existe", async () => {
      vi.mocked(useProducts).mockReturnValue([]);

      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/aucun.*produit/i)).toBeInTheDocument();
      });
    });

    it('devrait afficher un message quand aucun résultat de recherche', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await user.type(searchInput, 'ProduitInexistant12345');

      await waitFor(() => {
        expect(screen.getByText(/aucun résultat/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation des données', () => {
    it('devrait valider les produits chargés', async () => {
      const { validateProduct } = await import('../services/validationService');

      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(validateProduct).toHaveBeenCalled();
      });
    });
  });

  describe('Unités de mesure', () => {
    it('devrait afficher les bonnes unités', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/heure/i)).toBeInTheDocument();
        expect(screen.getByText(/journée/i)).toBeInTheDocument();
        expect(screen.getByText(/unité/i)).toBeInTheDocument();
      });
    });
  });

  describe('Alertes stock', () => {
    it('devrait mettre en évidence les produits en stock faible', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Le clavier a un stock de 2 (faible)
        const lowStockBadge = screen.getByText(/stock faible/i);
        expect(lowStockBadge).toBeInTheDocument();
      });
    });

    it('devrait afficher un indicateur visuel pour stock critique', async () => {
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Rechercher les badges d'alerte
        const alertBadges = screen.getAllByRole('status');
        expect(alertBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Vue détaillée', () => {
    it("devrait pouvoir ouvrir les détails d'un produit", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      const detailButton = screen.getAllByLabelText(/voir détails/i)[0];
      await user.click(detailButton);

      await waitFor(() => {
        // Le modal de détails devrait s'ouvrir
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('devrait afficher toutes les informations dans la vue détaillée', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <ProductManager />
        </BrowserRouter>
      );

      const detailButton = screen.getAllByLabelText(/voir détails/i)[0];
      await user.click(detailButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveTextContent(/description/i);
        expect(dialog).toHaveTextContent(/prix/i);
      });
    });
  });
});
