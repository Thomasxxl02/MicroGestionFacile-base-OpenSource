import { test, expect } from '../fixtures/auth.fixture';

/**
 * Test avec fixture authentifiée: vérifier si le dashboard se charge avec IndexedDB pré-initialisé
 */
test('React mounts with pre-loaded profile in IndexedDB', async ({ authenticatedPage, page }) => {
  // La fixture a déjà :
  // 1. Injecté le profil via addInitScript dans IndexedDB
  // 2. Navigué à / et attendu le chargement
  // 3. Vérifié ou retry le dashboard
  
  // Vérifier que le dashboard est visible
  const dashboard = await page.locator('[data-testid="dashboard"]').isVisible();
  expect(dashboard).toBeTruthy();
});
