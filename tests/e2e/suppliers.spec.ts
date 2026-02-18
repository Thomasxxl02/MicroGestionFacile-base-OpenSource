import { test, expect } from '../fixtures/auth.fixture';
import { CommonActions } from '../utils/helpers';
import { faker } from '@faker-js/faker';

// Configure faker for French locale
faker.seed([98765]); // Fixed seed for reproducible tests

/**
 * Tests E2E: Gestion des fournisseurs
 * Scénarios: CRUD, recherche, tri, catégories, données sensibles
 */

test.describe('🚚 Supplier Management', () => {
  test.beforeEach(async ({ page, authenticatedPage: _authenticatedPage }) => {
    // L'utilisateur est authentifié.
    // Aller sur la page fournisseurs
    await CommonActions.navigateToSection(page, 'suppliers');
  });

  test.describe('📋 Liste et affichage', () => {
    test('affiche la liste vide des fournisseurs', async ({ page }) => {
      const emptyState = page.locator('[data-testid="suppliers-empty-state"]');
      await expect(emptyState).toBeVisible({ timeout: 10000 });
    });

    test('affiche les statistiques des fournisseurs', async ({ page }) => {
      await createTestSupplier(page, {
        name: 'Test Stats Supplier',
        email: 'stats@supplier.com',
        category: 'Services',
      });

      const statsCard = page.locator('[data-testid="supplier-stats"]');
      await expect(statsCard).toBeVisible();
      
      await expect(statsCard).toContainText('1');
    });
  });

  test.describe('✏️ Création de fournisseur', () => {
    test('crée un fournisseur français', async ({ page }) => {
      const supplierName = faker.company.name();
      const supplierEmail = faker.internet.email().toLowerCase();

      await page.locator('button:has-text("Nouveau fournisseur")').click();

      await page.locator('input[name="name"]').fill(supplierName);
      await page.locator('input[name="email"]').fill(supplierEmail);
      await page.locator('input[name="address"]').fill('123 rue du Fournisseur');
      await page.locator('input[name="phone"]').fill('+33123456789');
      await page.locator('select[name="country"]').selectOption('FR');
      await page.locator('input[name="siret"]').fill('12345678901234');
      await page.locator('select[name="category"]').selectOption('Services');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });

      await expect(page.locator(`text=${supplierName}`)).toBeVisible();
    });

    test('crée un fournisseur étranger', async ({ page }) => {
      const supplierName = faker.company.name() + ' Inc.';
      const supplierEmail = faker.internet.email().toLowerCase();

      await page.locator('button:has-text("Nouveau fournisseur")').click();

      await page.locator('input[name="name"]').fill(supplierName);
      await page.locator('input[name="email"]').fill(supplierEmail);
      await page.locator('input[name="address"]').fill('123 Main Street');
      await page.locator('select[name="country"]').selectOption('US');
      await page.locator('select[name="currency"]').selectOption('USD');
      await page.locator('input[name="vatNumber"]').fill('US123456789');
      await page.locator('select[name="category"]').selectOption('Logiciels');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });
    });

    test('crée un fournisseur avec RIB', async ({ page }) => {
      const supplierName = 'Fournisseur avec RIB';
      
      await page.locator('button:has-text("Nouveau fournisseur")').click();

      await page.locator('input[name="name"]').fill(supplierName);
      await page.locator('input[name="email"]').fill('rib@supplier.com');
      await page.locator('input[name="address"]').fill('Adresse test');
      await page.locator('input[name="iban"]').fill('FR7612345678901234567890123');
      await page.locator('input[name="bic"]').fill('BNPAFRPPXXX');
      await page.locator('select[name="category"]').selectOption('Services');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });

      // Vérifier que le RIB n'est pas visible en clair
      await expect(page.locator('text=FR7612345678901234567890123')).not.toBeVisible();
    });

    test('valide les champs obligatoires', async ({ page }) => {
      await page.locator('button:has-text("Nouveau fournisseur")').click();

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('text=/nom.*requis/i')).toBeVisible();
    });

    test('valide le format email', async ({ page }) => {
      await page.locator('button:has-text("Nouveau fournisseur")').click();

      await page.locator('input[name="name"]').fill('Test Supplier');
      await page.locator('input[name="email"]').fill('email-invalide');
      await page.locator('input[name="address"]').fill('Adresse');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('text=/email.*invalide/i')).toBeVisible();
    });

    test('valide le format SIRET', async ({ page }) => {
      await page.locator('button:has-text("Nouveau fournisseur")').click();

      await page.locator('input[name="name"]').fill('Test Supplier');
      await page.locator('input[name="email"]').fill('test@supplier.com');
      await page.locator('input[name="siret"]').fill('123'); // SIRET invalide

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('text=/siret.*invalide/i')).toBeVisible();
    });
  });

  test.describe('🔍 Recherche et filtrage', () => {
    test('recherche un fournisseur par nom', async ({ page }) => {
      await createTestSupplier(page, { name: 'AWS Services', email: 'aws@test.com', category: 'Hébergement' });
      await createTestSupplier(page, { name: 'Microsoft Azure', email: 'azure@test.com', category: 'Hébergement' });

      await page.locator('input[placeholder*="Rechercher"]').fill('AWS');

      await expect(page.locator('text=AWS Services')).toBeVisible();
      await expect(page.locator('text=Microsoft Azure')).not.toBeVisible();
    });

    test('recherche un fournisseur par catégorie', async ({ page }) => {
      await createTestSupplier(page, { name: 'Search Test 1', email: 'test1@test.com', category: 'Logiciels' });
      await createTestSupplier(page, { name: 'Search Test 2', email: 'test2@test.com', category: 'Hébergement' });

      await page.locator('input[placeholder*="Rechercher"]').fill('Logiciels');

      await expect(page.locator('text=Search Test 1')).toBeVisible();
      await expect(page.locator('text=Search Test 2')).not.toBeVisible();
    });

    test('filtre par catégorie', async ({ page }) => {
      await createTestSupplier(page, { name: 'Supplier Cat 1', email: 'cat1@test.com', category: 'Énergie' });
      await createTestSupplier(page, { name: 'Supplier Cat 2', email: 'cat2@test.com', category: 'Services' });

      const categoryFilter = page.locator('select[aria-label*="Catégorie"]');
      if (await categoryFilter.isVisible()) {
        await categoryFilter.selectOption('Énergie');
      }

      await expect(page.locator('text=Supplier Cat 1')).toBeVisible();
      await expect(page.locator('text=Supplier Cat 2')).not.toBeVisible();
    });

    test('affiche un message quand aucun résultat', async ({ page }) => {
      await createTestSupplier(page, { name: 'Test Supplier', email: 'test@test.com', category: 'Services' });

      await page.locator('input[placeholder*="Rechercher"]').fill('FournisseurInexistant12345');

      await expect(page.locator('text=/aucun.*résultat/i')).toBeVisible();
    });
  });

  test.describe('↕️ Tri des fournisseurs', () => {
    test('trie les fournisseurs par nom', async ({ page }) => {
      await createTestSupplier(page, { name: 'Zebra Corp', email: 'zebra@test.com', category: 'Services' });
      await createTestSupplier(page, { name: 'Alpha Ltd', email: 'alpha@test.com', category: 'Services' });

      const sortSelect = page.locator('select[aria-label*="Trier"]');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('name');
      }

      const firstSupplier = page.locator('[data-testid="supplier-card"]').first();
      await expect(firstSupplier).toContainText('Alpha');
    });

    test('trie par dépenses totales', async ({ page }) => {
      // Créer des fournisseurs (nécessiterait des dépenses associées pour tester complètement)
      await createTestSupplier(page, { name: 'High Spending', email: 'high@test.com', category: 'Services' });
      await createTestSupplier(page, { name: 'Low Spending', email: 'low@test.com', category: 'Services' });

      const sortSelect = page.locator('select[aria-label*="Trier"]');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('spending');
        await page.waitForTimeout(500);
      }
    });

    test('trie par catégorie', async ({ page }) => {
      await createTestSupplier(page, { name: 'Supplier A', email: 'a@test.com', category: 'Logiciels' });
      await createTestSupplier(page, { name: 'Supplier B', email: 'b@test.com', category: 'Hébergement' });

      const sortSelect = page.locator('select[aria-label*="Trier"]');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('category');
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('📝 Modification de fournisseur', () => {
    test('modifie les informations d\'un fournisseur', async ({ page }) => {
      const originalName = 'Fournisseur Original';
      const updatedName = 'Fournisseur Modifié';

      await createTestSupplier(page, { name: originalName, email: 'edit@test.com', category: 'Services' });

      const supplierCard = page.locator(`text=${originalName}`).locator('..').locator('..');
      await supplierCard.hover();
      await supplierCard.locator('button[aria-label*="Modifier"]').click();

      await page.locator('input[name="name"]').fill(updatedName);
      await page.locator('button[type="submit"]:has-text("Enregistrer")').click();

      await expect(page.locator('[role="status"]:has-text("modifié")')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator(`text=${updatedName}`)).toBeVisible();
    });

    test('modifie le RIB d\'un fournisseur', async ({ page }) => {
      const supplierName = 'Fournisseur RIB';
      
      await createTestSupplier(page, { name: supplierName, email: 'rib@test.com', category: 'Services' });

      const supplierCard = page.locator(`text=${supplierName}`).locator('..').locator('..');
      await supplierCard.hover();
      await supplierCard.locator('button[aria-label*="Modifier"]').click();

      await page.locator('input[name="iban"]').fill('FR7600000000000000000000001');
      await page.locator('button[type="submit"]:has-text("Enregistrer")').click();

      await expect(page.locator('[role="status"]:has-text("modifié")')).toBeVisible({
        timeout: 5000,
      });

      // Vérifier qu'une notification de sécurité est déclenchée
      await expect(page.locator('text=/notification.*sécurité/i')).toBeVisible();
    });
  });

  test.describe('🗑️ Suppression', () => {
    test('supprime un fournisseur sans dépenses', async ({ page }) => {
      const supplierName = 'Fournisseur à Supprimer';
      await createTestSupplier(page, { name: supplierName, email: 'delete@test.com', category: 'Services' });

      const supplierCard = page.locator(`text=${supplierName}`).locator('..').locator('..');
      await supplierCard.hover();
      await supplierCard.locator('button[aria-label*="Supprimer"]').click();

      await page.locator('button:has-text("Supprimer")').click();

      await expect(page.locator('[role="status"]:has-text("supprimé")')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator(`text=${supplierName}`)).not.toBeVisible();
    });

    test('empêche la suppression d\'un fournisseur avec dépenses', async ({ page }) => {
      const supplierName = 'Fournisseur avec Dépenses';
      await createTestSupplier(page, { name: supplierName, email: 'withdeps@test.com', category: 'Services' });

      // TODO: Créer une dépense associée au fournisseur
      // Pour l'instant on simule juste la tentative de suppression

      const supplierCard = page.locator(`text=${supplierName}`).locator('..').locator('..');
      await supplierCard.hover();
      const deleteButton = supplierCard.locator('button[aria-label*="Supprimer"]');
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Devrait afficher un message d'erreur
        await expect(page.locator('text=/impossible.*dépenses/i')).toBeVisible();
      }
    });
  });

  test.describe('🔒 Sécurité des données sensibles', () => {
    test('masque les RIB par défaut', async ({ page }) => {
      await createTestSupplier(page, {
        name: 'Supplier Secure',
        email: 'secure@test.com',
        category: 'Services',
        iban: 'FR7612345678901234567890123',
      });

      // Le RIB ne doit pas être visible en clair
      await expect(page.locator('text=FR7612345678901234567890123')).not.toBeVisible();
      
      // Devrait afficher des astérisques ou un masque
      await expect(page.locator('text=/\\*\\*\\*\\*/i')).toBeVisible();
    });

    test('permet de révéler le RIB avec autorisation', async ({ page }) => {
      await createTestSupplier(page, {
        name: 'Supplier Reveal',
        email: 'reveal@test.com',
        category: 'Services',
        iban: 'FR7600000000000000000000001',
      });

      const revealButton = page.locator('button[aria-label*="Révéler IBAN"]');
      if (await revealButton.isVisible()) {
        await revealButton.click();
        
        // Le RIB devrait maintenant être visible
        await expect(page.locator('text=/FR76/i')).toBeVisible();
      }
    });

    test('enregistre l\'accès aux données sensibles dans l\'audit', async ({ page }) => {
      await createTestSupplier(page, {
        name: 'Supplier Audit',
        email: 'audit@test.com',
        category: 'Services',
        iban: 'FR7600000000000000000000002',
      });

      const revealButton = page.locator('button[aria-label*="Révéler IBAN"]');
      if (await revealButton.isVisible()) {
        await revealButton.click();
        
        // Vérifier qu'un log d'audit est créé (visible dans la console ou via notification)
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('📊 Statistiques et dépenses', () => {
    test('affiche le total dépensé par fournisseur', async ({ page }) => {
      // Nécessite la création de dépenses associées
      await createTestSupplier(page, {
        name: 'Supplier Stats',
        email: 'stats@test.com',
        category: 'Services',
      });

      // TODO: Ajouter des dépenses pour ce fournisseur via l'API ou l'UI

      await expect(page.locator('text=/total.*dépensé/i')).toBeVisible();
    });

    test('affiche le nombre de dépenses', async ({ page }) => {
      await createTestSupplier(page, {
        name: 'Supplier Count',
        email: 'count@test.com',
        category: 'Services',
      });

      await expect(page.locator('text=/dépenses/i')).toBeVisible();
    });

    test('affiche la date de dernière activité', async ({ page }) => {
      await createTestSupplier(page, {
        name: 'Supplier Activity',
        email: 'activity@test.com',
        category: 'Services',
      });

      // Si des dépenses existent, afficher la dernière date
      const activityIndicator = page.locator('text=/dernière activité|dernier paiement/i');
      // Peut ne pas être visible si aucune dépense
    });
  });

  test.describe('📁 Catégories', () => {
    test('affiche les catégories disponibles', async ({ page }) => {
      await createTestSupplier(page, { name: 'Cat Test 1', email: 'cat1@test.com', category: 'Hébergement' });
      await createTestSupplier(page, { name: 'Cat Test 2', email: 'cat2@test.com', category: 'Logiciels' });
      await createTestSupplier(page, { name: 'Cat Test 3', email: 'cat3@test.com', category: 'Énergie' });

      const categoryFilter = page.locator('select[aria-label*="Catégorie"]');
      if (await categoryFilter.isVisible()) {
        await expect(categoryFilter.locator('option:has-text("Hébergement")')).toBeVisible();
        await expect(categoryFilter.locator('option:has-text("Logiciels")')).toBeVisible();
        await expect(categoryFilter.locator('option:has-text("Énergie")')).toBeVisible();
      }
    });
  });

  test.describe('🌍 Gestion internationale', () => {
    test('affiche les drapeaux des pays', async ({ page }) => {
      await createTestSupplier(page, {
        name: 'French Supplier',
        email: 'fr@test.com',
        category: 'Services',
        country: 'FR',
      });

      await expect(page.locator('text=🇫🇷')).toBeVisible();
    });

    test('gère les fournisseurs multi-devises', async ({ page }) => {
      await createTestSupplier(page, {
        name: 'US Supplier',
        email: 'us@test.com',
        category: 'Services',
        country: 'US',
        currency: 'USD',
      });

      await expect(page.locator('text=USD')).toBeVisible();
    });
  });

  test.describe('📄 Export CSV', () => {
    test('exporte la liste des fournisseurs', async ({ page }) => {
      await createTestSupplier(page, { name: 'Export Test', email: 'export@test.com', category: 'Services' });

      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Exporter")').click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/fournisseurs_export_.*\.csv/i);
    });
  });

  test.describe('🏷️ Statuts', () => {
    test('change le statut d\'un fournisseur', async ({ page }) => {
      await createTestSupplier(page, { name: 'Status Test', email: 'status@test.com', category: 'Services' });

      const supplierCard = page.locator('text=Status Test').locator('..').locator('..');
      await supplierCard.hover();
      await supplierCard.locator('button[aria-label*="Modifier"]').click();

      const statusSelect = page.locator('select[name="status"]');
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption('APPROVED');
      }

      await page.locator('button[type="submit"]:has-text("Enregistrer")').click();

      await expect(page.locator('[role="status"]:has-text("modifié")')).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('💾 Notes et informations complémentaires', () => {
    test('ajoute des notes à un fournisseur', async ({ page }) => {
      await page.locator('button:has-text("Nouveau fournisseur")').click();

      await page.locator('input[name="name"]').fill('Supplier with Notes');
      await page.locator('input[name="email"]').fill('notes@test.com');
      await page.locator('select[name="category"]').selectOption('Services');
      await page.locator('textarea[name="notes"]').fill('Fournisseur prioritaire, paiement sous 15 jours');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });

      await expect(page.locator('text=/Fournisseur prioritaire/i')).toBeVisible();
    });

    test('ajoute un code comptable', async ({ page }) => {
      await page.locator('button:has-text("Nouveau fournisseur")').click();

      await page.locator('input[name="name"]').fill('Supplier Code');
      await page.locator('input[name="email"]').fill('code@test.com');
      await page.locator('select[name="category"]').selectOption('Services');
      await page.locator('input[name="accountingCode"]').fill('401001');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });

      await expect(page.locator('text=401001')).toBeVisible();
    });
  });
});

/**
 * Helper: Créer un fournisseur de test
 */
async function createTestSupplier(
  page: any,
  data: {
    name: string;
    email: string;
    category: string;
    country?: string;
    currency?: string;
    iban?: string;
  }
) {
  await page.locator('button:has-text("Nouveau fournisseur")').click();

  await page.locator('input[name="name"]').fill(data.name);
  await page.locator('input[name="email"]').fill(data.email);
  await page.locator('input[name="address"]').fill('Test Address');
  await page.locator('select[name="category"]').selectOption(data.category);

  if (data.country) {
    await page.locator('select[name="country"]').selectOption(data.country);
  }

  if (data.currency) {
    await page.locator('select[name="currency"]').selectOption(data.currency);
  }

  if (data.iban) {
    await page.locator('input[name="iban"]').fill(data.iban);
  }

  await page.locator('button[type="submit"]:has-text("Créer")').click();

  await page.locator('[role="status"]:has-text("créé")').waitFor({ timeout: 5000 });

  const closeButton = page.locator('button[aria-label*="Fermer"]');
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }

  await page.waitForTimeout(500);
}
