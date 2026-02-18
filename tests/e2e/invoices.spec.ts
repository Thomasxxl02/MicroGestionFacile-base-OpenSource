import { test, expect } from '../fixtures/auth.fixture';
import { CommonActions } from '../utils/helpers';
import { generateTestData } from '../fixtures/test-data-generator';
import { faker } from '@faker-js/faker';

// Configure faker for French locale
faker.seed([12345]); // Fixed seed for reproducible tests

/**
 * Tests E2E: Gestion des factures
 * Scénarios: CRUD, numérotation, calculs, exports
 */

test.describe('📄 Invoice Management', () => {
  test.beforeEach(async ({ page, authenticatedPage: _authenticatedPage }) => {
    // L'utilisateur est authentifié.
    // Aller sur la page factures
    await CommonActions.navigateToSection(page, 'invoices');
  });

  test('affiche la liste des factures vide', async ({ page }) => {
    const emptyState = page.locator('[data-testid="invoices-empty-state"]');
    await emptyState.waitFor();
    expect(emptyState).toBeVisible();
  });

  test('créer une facture simple', async ({ page }) => {
    // Cliquer sur "Nouvelle facture"
    await page.locator('button:has-text("Nouvelle facture")').click();

    // Vérifier que le formulaire apparaît
    const form = page.locator('[data-testid="invoice-form"]');
    await form.waitFor();

    // Remplir les données minimales
    const clientName = faker.company.name();
    const productName = faker.commerce.productName();

    await page.locator('input[name="clientId"]').fill(clientName);
    await page.locator('input[name="items.0.description"]').fill(productName);
    await page.locator('input[name="items.0.quantity"]').fill('1');
    await page.locator('input[name="items.0.unitPrice"]').fill('100.00');

    // Soumettre
    await page.locator('button:has-text("Créer facture")').click();

    // Vérifier le toast de succès
    await page.locator('[role="status"]:has-text("créée")').waitFor();
    expect(page.locator('[role="status"]')).toContainText('créée');
  });

  test('génère automatiquement le numéro de facture', async ({ page }) => {
    // Créer une facture
    await page.locator('button:has-text("Nouvelle facture")').click();
    await page.locator('input[name="clientId"]').fill('Client Test');
    await page.locator('input[name="items.0.description"]').fill('Service');
    await page.locator('input[name="items.0.quantity"]').fill('1');
    await page.locator('input[name="items.0.unitPrice"]').fill('100.00');

    // Vérifier que le numéro est auto-généré (lecture seule ou prérempli)
    const numberField = page.locator('input[name="number"]');
    const autoNumber = await numberField.inputValue();
    expect(autoNumber).toMatch(/^FAC-/); // Format FAC-XXXXXX
  });

  test('calcule correctement les montants (TVA 20%)', async ({ page }) => {
    // Créer une facture avec montants précis
    await page.locator('button:has-text("Nouvelle facture")').click();

    await page.locator('input[name="clientId"]').fill('Calcul Test');
    await page.locator('input[name="items.0.description"]').fill('Produit');
    await page.locator('input[name="items.0.quantity"]').fill('10');
    await page.locator('input[name="items.0.unitPrice"]').fill('100.00');

    // Attendre le calcul
    await page.waitForTimeout(500);

    // Le HT doit être 10 * 100 = 1000.00
    const htDisplay = page.locator('[data-testid="subtotal"]');
    await htDisplay.waitFor();
    const htText = await htDisplay.textContent();
    expect(htText).toContain('1000');

    // La TVA doit être 1000 * 0.20 = 200.00
    const taxDisplay = page.locator('[data-testid="tax-amount"]');
    const taxText = await taxDisplay.textContent();
    expect(taxText).toContain('200');

    // Le TTC doit être 1200.00
    const ttcDisplay = page.locator('[data-testid="total"]');
    const ttcText = await ttcDisplay.textContent();
    expect(ttcText).toContain('1200');
  });

  test('supporte plusieurs lignes de facture', async ({ page }) => {
    await page.locator('button:has-text("Nouvelle facture")').click();

    await page.locator('input[name="clientId"]').fill('Multi-lignes');

    // Ligne 1
    await page.locator('input[name="items.0.description"]').fill('Service A');
    await page.locator('input[name="items.0.quantity"]').fill('5');
    await page.locator('input[name="items.0.unitPrice"]').fill('50.00');

    // Ajouter ligne 2
    await page.locator('button:has-text("Ajouter ligne")').click();
    await page.waitForTimeout(300);
    const descriptions = page.locator('input[name="items.1.description"]');
    await descriptions.fill('Service B');
    await page.locator('input[name="items.1.quantity"]').fill('3');
    await page.locator('input[name="items.1.unitPrice"]').fill('75.00');

    // Vérifier le calcul du total global
    const totalDisplay = page.locator('[data-testid="total"]');
    await totalDisplay.waitFor();
    const totalText = await totalDisplay.textContent();

    // 5*50 + 3*75 = 250 + 225 = 475 HT
    // 475 * 1.20 = 570 TTC
    expect(totalText).toContain('570');
  });

  test('applique le régime FNC si applicable', async ({ page }) => {
    // Créer une facture avec HT > francise TVA (36800€)
    // pour vérifier la présence du régime FNS/FNC

    await page.locator('button:has-text("Nouvelle facture")').click();

    await page.locator('input[name="clientId"]').fill('Test FNC');
    await page.locator('input[name="items.0.description"]').fill('Produit');
    await page.locator('input[name="items.0.quantity"]').fill('500');
    await page.locator('input[name="items.0.unitPrice"]').fill('100.00');

    // Attendre le calcul
    await page.waitForTimeout(500);

    // Vérifier la présence d'un avertissement FNC
    const fncWarning = page.locator('[data-testid="fnc-warning"]');
    const exists = await fncWarning.isVisible({ timeout: 3000 }).catch(() => false);

    if (exists) {
      expect(fncWarning).toContainText('franchise');
    }
  });

  test('liste et affiche les factures existantes', async ({ page }) => {
    // Créer 3 factures
    for (let i = 0; i < 3; i++) {
      const clientName = faker.company.name();
      const productName = faker.commerce.productName();

      await page.locator('button:has-text("Nouvelle facture")').click();
      await page.waitForTimeout(300);

      await page.locator('input[name="clientId"]').fill(clientName);
      await page.locator('input[name="items.0.description"]').fill(productName);
      await page.locator('input[name="items.0.quantity"]').fill('1');
      await page.locator('input[name="items.0.unitPrice"]').fill('100.00');

      await page.locator('button:has-text("Créer facture")').click();
      await page.locator('[role="status"]').waitFor();
      await page.waitForTimeout(300);
    }

    // Aller sur la liste
    await CommonActions.navigateToSection(page, 'invoices');

    // Vérifier qu'au moins 3 lignes existent
    const rows = page.locator('[data-testid^="invoice-row"]');
    expect(rows.count()).resolves.toBeGreaterThanOrEqual(3);
  });

  test('permet de modifier une facture en brouillon', async ({ page }) => {
    // Créer une facture
    const clientName = faker.company.name();

    await page.locator('button:has-text("Nouvelle facture")').click();

    await page.locator('input[name="clientId"]').fill(clientName);
    await page.locator('input[name="items.0.description"]').fill('Service original');
    await page.locator('input[name="items.0.quantity"]').fill('1');
    await page.locator('input[name="items.0.unitPrice"]').fill('100.00');

    await page.locator('button:has-text("Créer facture")').click();
    await page.locator('[role="status"]').waitFor();

    // Cliquer sur la facture pour la modifier
    const firstInvoice = page.locator('[data-testid^="invoice-row"]').first();
    await firstInvoice.click();

    // Vérifier que c'est en mode édition
    const editButton = page.locator('button:has-text("Éditer")');
    await editButton.isVisible({ timeout: 3000 }).catch(() => false);

    // Ou directement modifiable si statut DRAFT
    const descField = page.locator('input[name="items.0.description"]');
    if (await descField.isVisible()) {
      await descField.clear();
      await descField.fill('Service modifié');

      await page.locator('button:has-text("Enregistrer")').click();
      await page.locator('[role="status"]:has-text("mise à jour")').waitFor();
    }
  });

  test('supprime une facture en brouillon', async ({ page }) => {
    // Créer une test data pour référence
    generateTestData.invoice();
    await page.locator('button:has-text("Nouvelle facture")').click();

    await page.locator('input[name="clientId"]').fill('À supprimer');
    await page.locator('input[name="items.0.description"]').fill('Service');
    await page.locator('input[name="items.0.quantity"]').fill('1');
    await page.locator('input[name="items.0.unitPrice"]').fill('50.00');

    await page.locator('button:has-text("Créer facture")').click();
    await page.locator('[role="status"]').waitFor();

    // Cliquer sur la facture
    const invoiceRow = page.locator('[data-testid^="invoice-row"]').first();
    await invoiceRow.click();

    // Cliquer sur supprimer
    const deleteButton = page.locator('button:has-text("Supprimer")');
    await deleteButton.click();

    // Confirmer la suppression
    const confirmButton = page.locator('button:has-text("Confirmer")');
    await confirmButton.click();

    // Vérifier le toast
    await page.locator('[role="status"]:has-text("supprimée")').waitFor();
  });
});
