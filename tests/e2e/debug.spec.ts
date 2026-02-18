import { test, expect } from '../fixtures/auth.fixture';

/**
 * Test de debug pour identifier le problème de navigation
 */

test.describe('🔍 Debug Navigation', () => {
  test('vérifie que le setup wizard fonctionne', async ({ page }) => {
    await page.goto('/');

    // Attendre que la page se charge
    await page.waitForLoadState('networkidle');

    // Prendre un screenshot
    await page.screenshot({ path: 'test-results/01-initial-load.png', fullPage: true });

    console.info('Page loaded, URL:', page.url());
  });

  test("vérifie que le dashboard s'affiche", async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    // L'authentification devrait être faite
    await page.waitForLoadState('networkidle');

    // Prendre un screenshot
    await page.screenshot({ path: 'test-results/02-after-auth.png', fullPage: true });

    console.info('After auth, URL:', page.url());

    // Vérifier que le dashboard est visible
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 10000 });

    console.info('Dashboard found!');
  });

  test('vérifie que la sidebar est visible', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.waitForLoadState('networkidle');

    // Chercher la sidebar
    const sidebar = page.locator('[data-testid="sidebar"]');
    const isVisible = await sidebar.isVisible().catch(() => false);

    console.info('Sidebar visible:', isVisible);

    if (!isVisible) {
      // Peut-être que c'est mobile et on doit cliquer sur le menu
      const menuToggle = page.locator('[data-testid="menu-toggle"]');
      const menuVisible = await menuToggle.isVisible().catch(() => false);
      console.info('Menu toggle visible:', menuVisible);

      if (menuVisible) {
        await menuToggle.click();
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({ path: 'test-results/03-sidebar-check.png', fullPage: true });

    await expect(sidebar).toBeVisible({ timeout: 10000 });
    console.info('Sidebar confirmed visible!');
  });

  test('vérifie que le bouton nav-clients existe', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.waitForLoadState('networkidle');

    // S'assurer que la sidebar est visible
    const sidebar = page.locator('[data-testid="sidebar"]');
    if (!(await sidebar.isVisible())) {
      const menuToggle = page.locator('[data-testid="menu-toggle"]');
      if (await menuToggle.isVisible()) {
        await menuToggle.click();
        await page.waitForTimeout(500);
      }
    }

    // Chercher le bouton clients
    const navClients = page.locator('[data-testid="nav-clients"]');
    await expect(navClients).toBeVisible({ timeout: 10000 });

    console.info('Nav clients button found!');
    await page.screenshot({ path: 'test-results/04-nav-clients.png', fullPage: true });
  });

  test('vérifie la navigation vers clients', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.waitForLoadState('networkidle');

    console.info('Starting navigation to clients...');

    // S'assurer que la sidebar est visible
    const sidebar = page.locator('[data-testid="sidebar"]');
    if (!(await sidebar.isVisible())) {
      const menuToggle = page.locator('[data-testid="menu-toggle"]');
      if (await menuToggle.isVisible()) {
        await menuToggle.click();
        await page.waitForTimeout(500);
      }
    }

    // Cliquer sur clients
    const navClients = page.locator('[data-testid="nav-clients"]');
    await navClients.click();

    console.info('Clicked nav-clients, waiting for page...');
    await page.waitForTimeout(1000);

    console.info('Current URL:', page.url());
    await page.screenshot({ path: 'test-results/05-clicked-clients.png', fullPage: true });

    // Attendre le container clients
    const clientsContainer = page.locator('[data-testid="clients-container"]');
    await expect(clientsContainer).toBeVisible({ timeout: 10000 });

    console.info('Clients container found!');
    await page.screenshot({ path: 'test-results/06-clients-loaded.png', fullPage: true });
  });
});
