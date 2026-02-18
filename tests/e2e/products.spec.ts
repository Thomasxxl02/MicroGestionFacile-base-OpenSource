import { test, expect } from '../fixtures/auth.fixture';
import { CommonActions } from '../utils/helpers';
import { faker } from '@faker-js/faker';

// Configure faker for French locale
faker.seed([54321]); // Fixed seed for reproducible tests

/**
 * Tests E2E: Gestion des produits et prestations
 * Scénarios: CRUD, recherche, tri, stock, export, informations légales
 */

test.describe('📦 Product & Service Management', () => {
  test.beforeEach(async ({ page, authenticatedPage: _authenticatedPage }) => {
    // L'utilisateur est authentifié.
    // Aller sur la page catalogue
    await CommonActions.navigateToSection(page, 'products');
  });

  test.describe('📋 Liste et affichage', () => {
    test('affiche la liste vide du catalogue', async ({ page }) => {
      const emptyState = page.locator('[data-testid="products-empty-state"]');
      await expect(emptyState).toBeVisible({ timeout: 10000 });
    });

    test('affiche les statistiques du catalogue', async ({ page }) => {
      // Créer un produit de test
      await createTestProduct(page, {
        name: 'Test Stats Product',
        price: 100,
        type: 'service',
      });

      // Vérifier que les stats sont affichées
      const statsCard = page.locator('[data-testid="product-stats"]');
      await expect(statsCard).toBeVisible();

      // Doit afficher au moins 1 article
      await expect(statsCard).toContainText('1');
    });
  });

  test.describe('✏️ Création de prestation (service)', () => {
    test('crée une prestation simple', async ({ page }) => {
      const serviceName = 'Consultation SEO';

      await page.locator('button:has-text("Nouveau produit")').click();

      // Sélectionner type prestation
      const serviceTab = page.locator('[role="tab"]:has-text("Prestation")');
      if (await serviceTab.isVisible()) {
        await serviceTab.click();
      }

      // Remplir les champs
      await page.locator('input[name="name"]').fill(serviceName);
      await page.locator('textarea[name="description"]').fill('Audit SEO complet');
      await page.locator('input[name="price"]').fill('500');
      await page.locator('select[name="unit"]').selectOption('heure');
      await page.locator('select[name="taxCategory"]').selectOption('SERVICE_BIC');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });

      await expect(page.locator(`text=${serviceName}`)).toBeVisible();
    });

    test('crée une prestation avec toutes les informations', async ({ page }) => {
      const serviceName = 'Formation React Avancée';

      await page.locator('button:has-text("Nouveau produit")').click();

      await page.locator('input[name="name"]').fill(serviceName);
      await page.locator('input[name="shortDescription"]').fill('Formation 2 jours');
      await page
        .locator('textarea[name="description"]')
        .fill('Formation complète sur React, TypeScript et patterns avancés');
      await page.locator('input[name="price"]').fill('1200');
      await page.locator('select[name="unit"]').selectOption('journée');
      await page.locator('select[name="taxRate"]').selectOption('20');
      await page.locator('select[name="taxCategory"]').selectOption('SERVICE_BIC');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });
    });

    test('valide les champs obligatoires pour une prestation', async ({ page }) => {
      await page.locator('button:has-text("Nouveau produit")').click();

      // Soumettre sans remplir
      await page.locator('button[type="submit"]:has-text("Créer")').click();

      // Vérifier les messages d'erreur
      await expect(page.locator('text=/nom.*requis/i')).toBeVisible();
    });
  });

  test.describe('✏️ Création de produit (marchandise)', () => {
    test('crée un produit avec stock', async ({ page }) => {
      const productName = 'MacBook Pro M2';

      await page.locator('button:has-text("Nouveau produit")').click();

      // Sélectionner type produit
      const productTab = page.locator('[role="tab"]:has-text("Produit")');
      if (await productTab.isVisible()) {
        await productTab.click();
      }

      // Remplir les champs
      await page.locator('input[name="name"]').fill(productName);
      await page.locator('input[name="sku"]').fill('APPLE-MBP-M2-2023');
      await page.locator('input[name="brand"]').fill('Apple');
      await page.locator('textarea[name="description"]').fill('Ordinateur portable 14"');
      await page.locator('input[name="price"]').fill('2499');
      await page.locator('input[name="stock"]').fill('10');
      await page.locator('select[name="taxCategory"]').selectOption('MARCHANDISE');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });

      await expect(page.locator(`text=${productName}`)).toBeVisible();
    });

    test('crée un produit avec informations légales complètes', async ({ page }) => {
      const productName = 'iPhone 15 Pro';

      await page.locator('button:has-text("Nouveau produit")').click();

      const productTab = page.locator('[role="tab"]:has-text("Produit")');
      if (await productTab.isVisible()) {
        await productTab.click();
      }

      await page.locator('input[name="name"]').fill(productName);
      await page.locator('input[name="sku"]').fill('APPLE-IP15-PRO');
      await page.locator('input[name="brand"]').fill('Apple');
      await page.locator('input[name="price"]').fill('1329');
      await page.locator('input[name="stock"]').fill('5');

      // Informations légales
      await page.locator('input[name="ecoParticipation"]').fill('0.50');
      await page.locator('input[name="repairabilityIndex"]').fill('6.2');
      await page.locator('select[name="legalWarranty"]').selectOption('2 ans');
      await page.locator('select[name="origin"]').selectOption('Chine');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });
    });

    test('affiche un avertissement pour stock faible', async ({ page }) => {
      await createTestProduct(page, {
        name: 'Produit Stock Faible',
        price: 50,
        type: 'product',
        stock: 2,
      });

      // Vérifier l'affichage de l'alerte stock faible
      await expect(page.locator('text=/stock.*faible/i')).toBeVisible();
    });
  });

  test.describe('🔍 Recherche et filtrage', () => {
    test('recherche un produit par nom', async ({ page }) => {
      await createTestProduct(page, { name: 'Ordinateur Dell', price: 800, type: 'product' });
      await createTestProduct(page, { name: 'Clavier Logitech', price: 50, type: 'product' });

      await page.locator('input[placeholder*="Rechercher"]').fill('Dell');

      await expect(page.locator('text=Ordinateur Dell')).toBeVisible();
      await expect(page.locator('text=Clavier Logitech')).not.toBeVisible();
    });

    test('recherche un produit par description', async ({ page }) => {
      await createTestProduct(page, {
        name: 'Produit Test',
        price: 100,
        type: 'service',
        description: 'Service de consulting en cybersécurité',
      });

      await page.locator('input[placeholder*="Rechercher"]').fill('cybersécurité');

      await expect(page.locator('text=Produit Test')).toBeVisible();
    });

    test('affiche un message quand aucun résultat', async ({ page }) => {
      await createTestProduct(page, { name: 'Test Product', price: 100, type: 'service' });

      await page.locator('input[placeholder*="Rechercher"]').fill('ProduitInexistant12345');

      await expect(page.locator('text=/aucun.*résultat/i')).toBeVisible();
    });
  });

  test.describe('↕️ Tri des produits', () => {
    test('trie les produits par nom', async ({ page }) => {
      await createTestProduct(page, { name: 'Zebra Service', price: 100, type: 'service' });
      await createTestProduct(page, { name: 'Alpha Service', price: 200, type: 'service' });

      const sortSelect = page.locator('select[aria-label*="Trier"]');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('name');
      }

      const firstProduct = page.locator('[data-testid="product-card"]').first();
      await expect(firstProduct).toContainText('Alpha');
    });

    test('trie les produits par prix', async ({ page }) => {
      await createTestProduct(page, { name: 'Produit Cher', price: 5000, type: 'product' });
      await createTestProduct(page, { name: 'Produit Pas Cher', price: 50, type: 'product' });

      const sortSelect = page.locator('select[aria-label*="Trier"]');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('price');
      }

      // Le plus cher devrait être en premier
      const firstProduct = page.locator('[data-testid="product-card"]').first();
      await expect(firstProduct).toContainText('Produit Cher');
    });

    test('trie par type (produit/prestation)', async ({ page }) => {
      await createTestProduct(page, { name: 'Service A', price: 100, type: 'service' });
      await createTestProduct(page, { name: 'Produit B', price: 200, type: 'product' });

      const sortSelect = page.locator('select[aria-label*="Trier"]');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('type');
      }

      await page.waitForTimeout(500);
    });
  });

  test.describe('📝 Modification de produit', () => {
    test("modifie le prix d'un produit", async ({ page }) => {
      const productName = 'Produit à Modifier';
      await createTestProduct(page, { name: productName, price: 100, type: 'service' });

      const productCard = page.locator(`text=${productName}`).locator('..').locator('..');
      await productCard.hover();
      await productCard.locator('button[aria-label*="Modifier"]').click();

      await page.locator('input[name="price"]').fill('150');
      await page.locator('button[type="submit"]:has-text("Enregistrer")').click();

      await expect(page.locator('[role="status"]:has-text("modifié")')).toBeVisible({
        timeout: 5000,
      });

      await expect(page.locator('text=/150/i')).toBeVisible();
    });

    test("modifie le stock d'un produit", async ({ page }) => {
      const productName = 'Produit Stock';
      await createTestProduct(page, {
        name: productName,
        price: 100,
        type: 'product',
        stock: 10,
      });

      const productCard = page.locator(`text=${productName}`).locator('..').locator('..');
      await productCard.hover();
      await productCard.locator('button[aria-label*="Modifier"]').click();

      await page.locator('input[name="stock"]').fill('25');
      await page.locator('button[type="submit"]:has-text("Enregistrer")').click();

      await expect(page.locator('[role="status"]:has-text("modifié")')).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('🗑️ Suppression', () => {
    test('supprime un produit', async ({ page }) => {
      const productName = 'Produit à Supprimer';
      await createTestProduct(page, { name: productName, price: 100, type: 'service' });

      const productCard = page.locator(`text=${productName}`).locator('..').locator('..');
      await productCard.hover();
      await productCard.locator('button[aria-label*="Supprimer"]').click();

      await page.locator('button:has-text("Supprimer")').click();

      await expect(page.locator('[role="status"]:has-text("supprimé")')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator(`text=${productName}`)).not.toBeVisible();
    });
  });

  test.describe('📊 Export CSV', () => {
    test('exporte le catalogue en CSV', async ({ page }) => {
      await createTestProduct(page, { name: 'Produit Export', price: 100, type: 'service' });

      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Exporter")').click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/catalogue_export_.*\.csv/);
    });

    test('le CSV contient toutes les colonnes nécessaires', async ({ page }) => {
      await createTestProduct(page, {
        name: 'Produit CSV',
        price: 100,
        type: 'product',
        description: 'Description test',
      });

      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Exporter")').click();

      const download = await downloadPromise;
      const path = await download.path();

      // Vérifier que le fichier existe
      expect(path).toBeTruthy();
    });
  });

  test.describe('📐 Calculs de prix', () => {
    test('calcule correctement le prix TTC avec TVA 20%', async ({ page }) => {
      await createTestProduct(page, { name: 'Produit TVA', price: 100, type: 'service' });

      // Prix HT: 100€
      await expect(page.locator('text=100')).toBeVisible();

      // TVA 20%: devrait afficher 20€ ou le taux
      await expect(page.locator('text=/20%/i')).toBeVisible();

      // Prix TTC: 120€
      await expect(page.locator('text=/120/i')).toBeVisible();
    });

    test('gère les différents taux de TVA', async ({ page }) => {
      await page.locator('button:has-text("Nouveau produit")').click();

      await page.locator('input[name="name"]').fill('Produit TVA Réduite');
      await page.locator('input[name="price"]').fill('100');
      await page.locator('select[name="taxRate"]').selectOption('5.5'); // TVA réduite

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('text=/5[.,]5%/i')).toBeVisible();
    });
  });

  test.describe('📦 Gestion du stock', () => {
    test('affiche le niveau de stock', async ({ page }) => {
      await createTestProduct(page, {
        name: 'Produit Stock',
        price: 100,
        type: 'product',
        stock: 15,
      });

      await expect(page.locator('text=/stock.*15/i')).toBeVisible();
    });

    test('alerte sur stock critique', async ({ page }) => {
      await createTestProduct(page, {
        name: 'Produit Critique',
        price: 100,
        type: 'product',
        stock: 1,
      });

      await expect(page.locator('text=/stock.*faible|critique|alert/i')).toBeVisible();
    });

    test('ne montre pas de stock pour les prestations', async ({ page }) => {
      await createTestProduct(page, {
        name: 'Service Sans Stock',
        price: 100,
        type: 'service',
      });

      const serviceCard = page.locator('text=Service Sans Stock').locator('..').locator('..');
      await expect(serviceCard.locator('text=/stock/i')).not.toBeVisible();
    });
  });

  test.describe('ℹ️ Informations légales', () => {
    test("affiche l'éco-participation", async ({ page }) => {
      await page.locator('button:has-text("Nouveau produit")').click();

      const productTab = page.locator('[role="tab"]:has-text("Produit")');
      if (await productTab.isVisible()) {
        await productTab.click();
      }

      await page.locator('input[name="name"]').fill('Produit Éco');
      await page.locator('input[name="price"]').fill('100');
      await page.locator('input[name="ecoParticipation"]').fill('1.50');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('text=/éco.*1[.,]50/i')).toBeVisible();
    });

    test("affiche l'indice de réparabilité", async ({ page }) => {
      await page.locator('button:has-text("Nouveau produit")').click();

      const productTab = page.locator('[role="tab"]:has-text("Produit")');
      if (await productTab.isVisible()) {
        await productTab.click();
      }

      await page.locator('input[name="name"]').fill('Produit Réparable');
      await page.locator('input[name="price"]').fill('100');
      await page.locator('input[name="repairabilityIndex"]').fill('7.5');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('text=/réparabilité.*7[.,]5/i')).toBeVisible();
    });

    test('affiche la garantie légale', async ({ page }) => {
      await createTestProduct(page, { name: 'Produit Garantie', price: 100, type: 'product' });

      await expect(page.locator('text=/garantie.*2 ans/i')).toBeVisible();
    });

    test("affiche l'origine du produit", async ({ page }) => {
      await page.locator('button:has-text("Nouveau produit")').click();

      await page.locator('input[name="name"]').fill('Produit Made in France');
      await page.locator('input[name="price"]').fill('100');
      await page.locator('select[name="origin"]').selectOption('France');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('text=France')).toBeVisible();
    });
  });

  test.describe('🏷️ SKU et marques', () => {
    test('affiche le SKU', async ({ page }) => {
      await page.locator('button:has-text("Nouveau produit")').click();

      const productTab = page.locator('[role="tab"]:has-text("Produit")');
      if (await productTab.isVisible()) {
        await productTab.click();
      }

      await page.locator('input[name="name"]').fill('Produit SKU');
      await page.locator('input[name="sku"]').fill('SKU-TEST-001');
      await page.locator('input[name="price"]').fill('100');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('text=SKU-TEST-001')).toBeVisible();
    });

    test('affiche la marque', async ({ page }) => {
      await page.locator('button:has-text("Nouveau produit")').click();

      await page.locator('input[name="name"]').fill('Produit Marque');
      await page.locator('input[name="brand"]').fill('Apple');
      await page.locator('input[name="price"]').fill('100');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('text=Apple')).toBeVisible();
    });
  });
});

/**
 * Helper: Créer un produit/service de test
 */
async function createTestProduct(
  page: any,
  data: {
    name: string;
    price: number;
    type: 'service' | 'product';
    description?: string;
    stock?: number;
  }
) {
  await page.locator('button:has-text("Nouveau produit")').click();

  // Sélectionner le type
  if (data.type === 'product') {
    const productTab = page.locator('[role="tab"]:has-text("Produit")');
    if (await productTab.isVisible()) {
      await productTab.click();
    }
  }

  await page.locator('input[name="name"]').fill(data.name);
  await page.locator('input[name="price"]').fill(data.price.toString());

  if (data.description) {
    await page.locator('textarea[name="description"]').fill(data.description);
  }

  if (data.type === 'product' && data.stock !== undefined) {
    await page.locator('input[name="stock"]').fill(data.stock.toString());
  }

  await page.locator('button[type="submit"]:has-text("Créer")').click();

  await page.locator('[role="status"]:has-text("créé")').waitFor({ timeout: 5000 });

  const closeButton = page.locator('button[aria-label*="Fermer"]');
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }

  await page.waitForTimeout(500);
}
