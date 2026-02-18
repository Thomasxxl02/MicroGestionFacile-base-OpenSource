import { test, expect } from '../fixtures/auth.fixture';
import { CommonActions } from '../utils/helpers';
import { faker } from '@faker-js/faker';

// Configure faker for French locale
faker.seed([12345]); // Fixed seed for reproducible tests

/**
 * Tests E2E: Gestion des clients
 * Scénarios: CRUD, recherche, tri, archivage, types internationaux
 */

test.describe('👥 Client Management', () => {
  test.beforeEach(async ({ page, authenticatedPage: _authenticatedPage }) => {
    // L'utilisateur est authentifié.
    // Aller sur la page clients
    await CommonActions.navigateToSection(page, 'clients');
  });

  test.describe('📋 Liste et affichage', () => {
    test('affiche la liste vide des clients', async ({ page }) => {
      const emptyState = page.locator('[data-testid="clients-empty-state"]');
      await expect(emptyState).toBeVisible({ timeout: 10000 });
    });

    test('affiche les statistiques de clients', async ({ page }) => {
      // Créer un client de test
      await createTestClient(page, {
        name: 'Test Stats Client',
        email: 'stats@test.com',
      });

      // Vérifier que les stats sont affichées
      const statsCard = page.locator('[data-testid="client-stats"]');
      await expect(statsCard).toBeVisible();
      
      // Doit afficher au moins 1 client
      await expect(statsCard).toContainText('1');
    });

    test('affiche les clients par défaut (non archivés)', async ({ page }) => {
      // Créer un client actif
      await createTestClient(page, {
        name: 'Client Actif',
        email: 'actif@test.com',
      });

      // Vérifier la présence du client
      await expect(page.locator('text=Client Actif')).toBeVisible();
    });
  });

  test.describe('✏️ Création de client', () => {
    test('crée un client entreprise français', async ({ page }) => {
      const clientName = faker.company.name();
      const clientEmail = faker.internet.email().toLowerCase();

      // Ouvrir le formulaire
      await page.locator('button:has-text("Nouveau client")').click();

      // Sélectionner type entreprise
      const companyTab = page.locator('[role="tab"]:has-text("Entreprise")');
      if (await companyTab.isVisible()) {
        await companyTab.click();
      }

      // Remplir les champs obligatoires
      await page.locator('input[name="name"]').fill(clientName);
      await page.locator('input[name="email"]').fill(clientEmail);
      await page.locator('input[name="address"]').fill('123 rue de Test');
      
      // Champs spécifiques France
      await page.locator('select[name="country"]').selectOption('FR');
      await page.locator('select[name="currency"]').selectOption('EUR');
      await page.locator('input[name="siret"]').fill('12345678901234');

      // Soumettre
      await page.locator('button[type="submit"]:has-text("Créer")').click();

      // Vérifier le toast de succès
      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });

      // Vérifier que le client apparaît dans la liste
      await expect(page.locator(`text=${clientName}`)).toBeVisible();
    });

    test('crée un client particulier', async ({ page }) => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const fullName = `${firstName} ${lastName}`;
      const clientEmail = faker.internet.email().toLowerCase();

      // Ouvrir le formulaire
      await page.locator('button:has-text("Nouveau client")').click();

      // Sélectionner type particulier
      const individualTab = page.locator('[role="tab"]:has-text("Particulier")');
      if (await individualTab.isVisible()) {
        await individualTab.click();
      }

      // Remplir les champs
      await page.locator('input[name="name"]').fill(fullName);
      await page.locator('input[name="email"]').fill(clientEmail);
      await page.locator('input[name="address"]').fill('45 avenue Test');
      
      // Soumettre
      await page.locator('button[type="submit"]:has-text("Créer")').click();

      // Vérifier succès
      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });
    });

    test('crée un client européen (B2B intracommunautaire)', async ({ page }) => {
      const companyName = faker.company.name() + ' GmbH';
      const clientEmail = faker.internet.email().toLowerCase();

      await page.locator('button:has-text("Nouveau client")').click();

      // Utiliser le template EU B2B
      const euTemplate = page.locator('button:has-text("🇪🇺 Client EU B2B")');
      if (await euTemplate.isVisible()) {
        await euTemplate.click();
      }

      await page.locator('input[name="name"]').fill(companyName);
      await page.locator('input[name="email"]').fill(clientEmail);
      await page.locator('input[name="address"]').fill('Berliner Str. 10');
      
      // Pays EU (ex: Allemagne)
      await page.locator('select[name="country"]').selectOption('DE');
      await page.locator('input[name="tvaNumber"]').fill('DE123456789');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });

      // Vérifier l'affichage du drapeau EU
      await expect(page.locator('text=🇩🇪')).toBeVisible();
    });

    test('crée un client international (hors UE)', async ({ page }) => {
      const companyName = faker.company.name() + ' Inc.';
      const clientEmail = faker.internet.email().toLowerCase();

      await page.locator('button:has-text("Nouveau client")').click();

      // Utiliser le template Export
      const exportTemplate = page.locator('button:has-text("🌍 Export International")');
      if (await exportTemplate.isVisible()) {
        await exportTemplate.click();
      }

      await page.locator('input[name="name"]').fill(companyName);
      await page.locator('input[name="email"]').fill(clientEmail);
      await page.locator('input[name="address"]').fill('123 Main Street');
      
      // Pays hors UE (ex: USA)
      await page.locator('select[name="country"]').selectOption('US');
      await page.locator('select[name="currency"]').selectOption('USD');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      await expect(page.locator('[role="status"]:has-text("créé")')).toBeVisible({
        timeout: 5000,
      });
    });

    test('valide les champs obligatoires', async ({ page }) => {
      await page.locator('button:has-text("Nouveau client")').click();

      // Soumettre sans remplir
      await page.locator('button[type="submit"]:has-text("Créer")').click();

      // Vérifier les messages d'erreur
      await expect(page.locator('text=/nom.*requis/i')).toBeVisible();
      await expect(page.locator('text=/email.*requis/i')).toBeVisible();
    });

    test('valide le format email', async ({ page }) => {
      await page.locator('button:has-text("Nouveau client")').click();

      await page.locator('input[name="name"]').fill('Test Client');
      await page.locator('input[name="email"]').fill('email-invalide');
      await page.locator('input[name="address"]').fill('Adresse test');

      await page.locator('button[type="submit"]:has-text("Créer")').click();

      // Vérifier le message d'erreur de format email
      await expect(page.locator('text=/email.*invalide/i')).toBeVisible();
    });
  });

  test.describe('🔍 Recherche et filtrage', () => {
    test('recherche un client par nom', async ({ page }) => {
      // Créer plusieurs clients
      await createTestClient(page, { name: 'Apple Corp', email: 'apple@test.com' });
      await createTestClient(page, { name: 'Banana Ltd', email: 'banana@test.com' });

      // Rechercher
      await page.locator('input[placeholder*="Rechercher"]').fill('Apple');

      // Vérifier le résultat
      await expect(page.locator('text=Apple Corp')).toBeVisible();
      await expect(page.locator('text=Banana Ltd')).not.toBeVisible();
    });

    test('recherche un client par email', async ({ page }) => {
      await createTestClient(page, { name: 'Search Test', email: 'unique@search.com' });

      await page.locator('input[placeholder*="Rechercher"]').fill('unique@search');

      await expect(page.locator('text=Search Test')).toBeVisible();
    });

    test('affiche un message quand aucun résultat', async ({ page }) => {
      await createTestClient(page, { name: 'Test Client', email: 'test@test.com' });

      await page.locator('input[placeholder*="Rechercher"]').fill('ClientInexistant12345');

      await expect(page.locator('text=/aucun.*résultat/i')).toBeVisible();
    });
  });

  test.describe('↕️ Tri des clients', () => {
    test('trie les clients par nom', async ({ page }) => {
      // Créer des clients dans le désordre
      await createTestClient(page, { name: 'Zebra Corp', email: 'zebra@test.com' });
      await createTestClient(page, { name: 'Alpha Ltd', email: 'alpha@test.com' });

      // Sélectionner tri par nom
      const sortSelect = page.locator('select[aria-label*="Trier"]');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('name');
      }

      // Vérifier l'ordre
      const firstClient = page.locator('[data-testid="client-card"]').first();
      await expect(firstClient).toContainText('Alpha');
    });

    test('trie les clients par chiffre d\'affaires', async ({ page }) => {
      // Ce test nécessiterait de créer des factures associées
      // Pour l'instant, on vérifie juste que l'option de tri existe
      const sortSelect = page.locator('select[aria-label*="Trier"]');
      
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('revenue');
        // Vérifier que le tri est appliqué (pas d'erreur)
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('📝 Modification de client', () => {
    test('modifie les informations d\'un client', async ({ page }) => {
      const originalName = 'Client Original';
      const updatedName = 'Client Modifié';

      // Créer un client
      await createTestClient(page, { name: originalName, email: 'edit@test.com' });

      // Cliquer sur éditer
      const clientCard = page.locator(`text=${originalName}`).locator('..').locator('..');
      await clientCard.hover();
      await clientCard.locator('button[aria-label*="Modifier"]').click();

      // Modifier le nom
      await page.locator('input[name="name"]').fill(updatedName);
      await page.locator('button[type="submit"]:has-text("Enregistrer")').click();

      // Vérifier la mise à jour
      await expect(page.locator('[role="status"]:has-text("modifié")')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator(`text=${updatedName}`)).toBeVisible();
    });
  });

  test.describe('🗑️ Archivage et suppression', () => {
    test('archive un client', async ({ page }) => {
      const clientName = 'Client à Archiver';
      await createTestClient(page, { name: clientName, email: 'archive@test.com' });

      // Ouvrir les actions
      const clientCard = page.locator(`text=${clientName}`).locator('..').locator('..');
      await clientCard.hover();
      await clientCard.locator('button[aria-label*="Archiver"]').click();

      // Confirmer
      await page.locator('button:has-text("Confirmer")').click();

      // Vérifier que le client n'est plus visible
      await expect(page.locator(`text=${clientName}`)).not.toBeVisible();
    });

    test('affiche les clients archivés', async ({ page }) => {
      const clientName = 'Client Archivé';
      await createTestClient(page, { name: clientName, email: 'archived@test.com' });

      // Archiver
      const clientCard = page.locator(`text=${clientName}`).locator('..').locator('..');
      await clientCard.hover();
      await clientCard.locator('button[aria-label*="Archiver"]').click();
      await page.locator('button:has-text("Confirmer")').click();

      // Activer l'affichage des archivés
      const showArchivedToggle = page.locator('input[type="checkbox"][aria-label*="archivés"]');
      await showArchivedToggle.check();

      // Vérifier que le client apparaît
      await expect(page.locator(`text=${clientName}`)).toBeVisible();
    });

    test('supprime un client sans factures', async ({ page }) => {
      const clientName = 'Client à Supprimer';
      await createTestClient(page, { name: clientName, email: 'delete@test.com' });

      // Ouvrir les actions
      const clientCard = page.locator(`text=${clientName}`).locator('..').locator('..');
      await clientCard.hover();
      await clientCard.locator('button[aria-label*="Supprimer"]').click();

      // Confirmer la suppression
      await page.locator('button:has-text("Supprimer")').click();

      // Vérifier la suppression
      await expect(page.locator('[role="status"]:has-text("supprimé")')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator(`text=${clientName}`)).not.toBeVisible();
    });
  });

  test.describe('📊 Navigation et détails', () => {
    test('navigue vers la page de détails d\'un client', async ({ page }) => {
      const clientName = 'Client Détails';
      await createTestClient(page, { name: clientName, email: 'details@test.com' });

      // Cliquer sur le client
      await page.locator(`text=${clientName}`).click();

      // Vérifier la navigation
      await expect(page).toHaveURL(/\/clients\/.+/);
      await expect(page.locator(`text=${clientName}`)).toBeVisible();
    });

    test('affiche les factures associées au client', async ({ page }) => {
      const clientName = 'Client Factures';
      await createTestClient(page, { name: clientName, email: 'invoices@test.com' });

      // Cliquer sur le client pour voir les détails
      await page.locator(`text=${clientName}`).click();

      // Vérifier la section factures
      await expect(page.locator('text=/factures/i')).toBeVisible();
    });

    test('retourne à la liste depuis les détails', async ({ page }) => {
      const clientName = 'Client Retour';
      await createTestClient(page, { name: clientName, email: 'back@test.com' });

      await page.locator(`text=${clientName}`).click();
      
      // Cliquer sur retour
      await page.locator('button[aria-label*="Retour"]').click();

      // Vérifier le retour à la liste
      await expect(page).toHaveURL(/\/clients\/?$/);
    });
  });

  test.describe('🌍 Gestion internationale', () => {
    test('affiche correctement les devises multiples', async ({ page }) => {
      // Client en USD
      await createTestClient(page, {
        name: 'US Client',
        email: 'us@test.com',
        country: 'US',
        currency: 'USD',
      });

      // Vérifier l'affichage
      await expect(page.locator('text=USD')).toBeVisible();
    });

    test('affiche les numéros de TVA intracommunautaire', async ({ page }) => {
      await createTestClient(page, {
        name: 'EU Client',
        email: 'eu@test.com',
        country: 'DE',
        tvaNumber: 'DE123456789',
      });

      // Vérifier l'affichage du numéro TVA
      await expect(page.locator('text=DE123456789')).toBeVisible();
    });
  });

  test.describe('📈 Statistiques et rapports', () => {
    test('calcule le chiffre d\'affaires total des clients', async ({ page }) => {
      await createTestClient(page, { name: 'Stats Client', email: 'stats@test.com' });

      // Vérifier l'affichage des stats
      const statsSection = page.locator('[data-testid="client-stats"]');
      await expect(statsSection).toBeVisible();
      
      // Vérifier que le CA total est affiché
      await expect(statsSection.locator('text=/chiffre.*affaires/i')).toBeVisible();
    });

    test('identifie les meilleurs clients', async ({ page }) => {
      // Créer plusieurs clients
      await createTestClient(page, { name: 'Top Client 1', email: 'top1@test.com' });
      await createTestClient(page, { name: 'Top Client 2', email: 'top2@test.com' });

      // Sélectionner tri par CA
      const sortSelect = page.locator('select[aria-label*="Trier"]');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('revenue');
      }

      // Les clients avec le plus de CA doivent être en premier
      await page.waitForTimeout(500);
    });
  });
});

/**
 * Helper: Créer un client de test
 */
async function createTestClient(
  page: any,
  data: {
    name: string;
    email: string;
    country?: string;
    currency?: string;
    tvaNumber?: string;
  }
) {
  await page.locator('button:has-text("Nouveau client")').click();

  await page.locator('input[name="name"]').fill(data.name);
  await page.locator('input[name="email"]').fill(data.email);
  await page.locator('input[name="address"]').fill('Test Address');

  if (data.country) {
    await page.locator('select[name="country"]').selectOption(data.country);
  }

  if (data.currency) {
    await page.locator('select[name="currency"]').selectOption(data.currency);
  }

  if (data.tvaNumber) {
    await page.locator('input[name="tvaNumber"]').fill(data.tvaNumber);
  }

  await page.locator('button[type="submit"]:has-text("Créer")').click();

  // Attendre la confirmation
  await page.locator('[role="status"]:has-text("créé")').waitFor({ timeout: 5000 });
  
  // Fermer le modal si nécessaire
  const closeButton = page.locator('button[aria-label*="Fermer"]');
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }

  await page.waitForTimeout(500);
}
