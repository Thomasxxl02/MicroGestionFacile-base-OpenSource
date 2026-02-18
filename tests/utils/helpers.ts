import { Page } from '@playwright/test';

/**
 * Helpers pour interactions courantes
 */

export class CommonActions {
  /**
   * Navigue vers une section de l'app
   */
  static async navigateToSection(
    page: Page,
    section:
      | 'dashboard'
      | 'invoices'
      | 'clients'
      | 'suppliers'
      | 'products'
      | 'accounting'
      | 'settings'
  ) {
    // Cliquer sur le menu si mobile
    const sidebar = page.locator('[data-testid="sidebar"]');
    if (!(await sidebar.isVisible())) {
      await page.locator('[data-testid="menu-toggle"]').click();
    }

    const sectionButton = page.locator(`[data-testid="nav-${section}"]`);
    await sectionButton.click();

    // Attendre que la section se charge
    await page.locator(`[data-testid="${section}-container"]`).waitFor({ timeout: 5000 });
  }

  /**
   * Crée une facture via l'interface
   */
  static async createInvoice(page: Page, invoice: any) {
    // Aller sur Factures
    await this.navigateToSection(page, 'invoices');

    // Cliquer sur "Nouvelle facture"
    await page.locator('button:has-text("Nouvelle facture")').click();

    // Remplir le formulaire
    if (invoice.clientName) {
      await page.locator('input[name="clientName"]').fill(invoice.clientName);
    }

    if (invoice.items) {
      for (let i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];

        // Ajouter ligne si nécessaire
        if (i > 0) {
          await page.locator('button:has-text("Ajouter ligne")').click();
        }

        // Remplir description
        const descInputs = page.locator('input[name="items.description"]');
        await descInputs.nth(i).fill(item.description);

        // Remplir quantité
        const qtyInputs = page.locator('input[name="items.quantity"]');
        await qtyInputs.nth(i).fill(item.quantity.toString());

        // Remplir prix unitaire
        const priceInputs = page.locator('input[name="items.unitPrice"]');
        await priceInputs.nth(i).fill(item.unitPrice.toString());
      }
    }

    // Soumettre
    await page.locator('button:has-text("Créer facture")').click();

    // Attendre la confirmation
    await page.locator('[data-testid="invoice-created-toast"]').waitFor({ timeout: 5000 });
  }

  /**
   * Crée un client via l'interface
   */
  static async createClient(page: Page, client: any) {
    await this.navigateToSection(page, 'clients');

    await page.locator('button:has-text("Nouveau client")').click();

    if (client.name) {
      await page.locator('input[name="name"]').fill(client.name);
    }
    if (client.email) {
      await page.locator('input[name="email"]').fill(client.email);
    }
    if (client.phone) {
      await page.locator('input[name="phone"]').fill(client.phone);
    }
    if (client.address) {
      await page.locator('input[name="address"]').fill(client.address);
    }
    if (client.city) {
      await page.locator('input[name="city"]').fill(client.city);
    }
    if (client.postalCode) {
      await page.locator('input[name="postalCode"]').fill(client.postalCode);
    }

    await page.locator('button:has-text("Créer client")').click();
    await page.locator('[data-testid="client-created-toast"]').waitFor({ timeout: 5000 });
  }

  /**
   * Toggle le dark mode
   */
  static async toggleDarkMode(page: Page) {
    const themeButton = page.locator('[data-testid="theme-toggle"]');
    await themeButton.click();

    // Vérifier que la classe dark a changé
    const htmlElement = page.locator('html');
    const darkClass = await htmlElement.getAttribute('class');
    return darkClass?.includes('dark') ?? false;
  }

  /**
   * Ouvre l'export PDF
   */
  static async exportToPDF(page: Page, invoiceId: string) {
    // Ouvrir l'invoice
    await page.locator(`[data-testid="invoice-row-${invoiceId}"]`).click();

    // Cliquer sur export
    const exportButton = page.locator('button:has-text("Télécharger PDF")');

    // Écouter le téléchargement
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    return download;
  }

  /**
   * Attend que l'app soit en mode offline
   */
  static async waitForOfflineMode(page: Page, timeout = 5000) {
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    await offlineIndicator.waitFor({ timeout });
  }

  /**
   * Simule une déconnexion réseau
   */
  static async goOffline(page: Page) {
    const context = page.context();
    await context.setOffline(true);
  }

  /**
   * Simule une reconnexion réseau
   */
  static async goOnline(page: Page) {
    const context = page.context();
    await context.setOffline(false);
  }
}
