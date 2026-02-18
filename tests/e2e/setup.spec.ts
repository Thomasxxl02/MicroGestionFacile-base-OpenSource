import { test, expect } from '@playwright/test';

/**
 * Tests E2E: Setup initial et wizard
 * Scénario: Premier lancement de l'app
 */

test.describe('🚀 Setup Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Vider IndexedDB et localStorage pour simuler premier lancement
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      indexedDB.deleteDatabase('MicroGestionDB');
    });

    // Aller sur la page
    await page.goto('/');
  });

  test('affiche le wizard au premier lancement', async ({ page }) => {
    // Vérifier que le wizard est visible
    const wizard = page.locator('[data-testid="setup-wizard"]');
    await wizard.waitFor({ timeout: 10000 });

    expect(wizard).toBeVisible();
    expect(page.locator('text=Bienvenue')).toBeVisible();
  });

  test('peut remplir les infos entreprise', async ({ page }) => {
    // Remplir Step 1: Company info
    await page.locator('input[name="companyName"]').fill('Mon Entreprise SARL');
    await page.locator('input[name="siret"]').fill('12345678901234');
    await page.locator('select[name="businessType"]').selectOption('EIRL');

    // Vérifier que les valeurs sont présentes
    expect(await page.locator('input[name="companyName"]').inputValue()).toBe(
      'Mon Entreprise SARL'
    );
    expect(await page.locator('input[name="siret"]').inputValue()).toBe('12345678901234');
  });

  test('valide les champs requis', async ({ page }) => {
    // Essayer d'avancer sans rien remplir
    const nextButton = page.locator('button:has-text("Suivant")').first();
    await nextButton.click();

    // Vérifier les erreurs
    const errors = page.locator('[role="alert"]');
    expect(errors).toBeDefined();
    expect(await errors.count()).toBeGreaterThan(0);
  });

  test('procédure complète de setup', async ({ page }) => {
    // Step 1: Company
    await page.locator('input[name="companyName"]').fill('TechStartup SAS');
    await page.locator('input[name="siret"]').fill('12345678901234');
    await page.locator('select[name="businessType"]').selectOption('MICRO');
    await page.locator('button:has-text("Suivant")').first().click();

    // Step 2: Contact
    await page.waitForTimeout(500); // Attendre transition
    await page.locator('input[name="email"]').fill('contact@techstartup.fr');
    await page.locator('input[name="phone"]').fill('0612345678');
    await page.locator('button:has-text("Suivant")').first().click();

    // Step 3: Fiscal
    await page.waitForTimeout(500);
    await page.locator('input[name="vatThreshold"]').fill('36800');
    await page.locator('button:has-text("Suivant")').first().click();

    // Step 4: Finalize
    await page.waitForTimeout(500);
    const finalButton = page.locator('button:has-text("Démarrer")', { hasText: "l'application" });
    await finalButton.click();

    // Vérifier que le dashboard apparaît
    await page.locator('[data-testid="dashboard"]').waitFor({ timeout: 10000 });
    expect(page.locator('text=Tableau de bord')).toBeVisible();
  });

  test('sauvegarde les données du profil dans IndexedDB', async ({ page }) => {
    // Faire le setup complet
    await page.locator('input[name="companyName"]').fill('Test Company');
    await page.locator('input[name="siret"]').fill('99999999999999');
    await page.locator('select[name="businessType"]').selectOption('EIRL');

    // Avancer jusqu'à la fin
    for (let i = 0; i < 3; i++) {
      await page.locator('button:has-text("Suivant")').first().click();
      await page.waitForTimeout(500);
    }

    // Démarrer l'app
    await page.locator('button:has-text("Démarrer")').click();

    // Vérifier dans IndexedDB
    const profileData = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('MicroGestionDB');
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('userProfile', 'readonly');
          const store = tx.objectStore('userProfile');
          const getReq = store.get('current');

          getReq.onsuccess = () => {
            resolve(getReq.result);
          };
          getReq.onerror = () => reject(new Error('Read error'));
        };
        req.onerror = () => reject(new Error('DB open error'));
      });
    });

    expect(profileData).toBeDefined();
    expect((profileData as any).companyName).toBe('Test Company');
  });

  test('évite le wizard si le profil existe', async ({ page }) => {
    // Créer le profil via le wizard
    await page.locator('input[name="companyName"]').fill('Existing Company');
    await page.locator('input[name="siret"]').fill('11111111111111');
    await page.locator('select[name="businessType"]').selectOption('MICRO');

    for (let i = 0; i < 3; i++) {
      await page.locator('button:has-text("Suivant")').first().click();
      await page.waitForTimeout(500);
    }

    await page.locator('button:has-text("Démarrer")').click();
    await page.locator('[data-testid="dashboard"]').waitFor();

    // Recharger la page
    await page.reload();

    // Le wizard NE doit pas apparaître
    const wizard = page.locator('[data-testid="setup-wizard"]');
    const isNotVisible = await wizard
      .isVisible({ timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    expect(isNotVisible).toBe(false);
    expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });
});
