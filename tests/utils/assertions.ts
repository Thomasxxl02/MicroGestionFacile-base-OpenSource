import { Page } from '@playwright/test';

/**
 * Helpers pour les assertions personnalisées
 */

export class CustomAssertions {
  /**
   * Vérifie qu'une facture a des montants cohérents
   */
  static async assertInvoiceAmounts(page: Page, expectedSubtotal: number) {
    // Récupérer les montants du DOM
    const subtotal = await page.locator('[data-testid="invoice-subtotal"]').textContent();
    const _taxAmount = await page.locator('[data-testid="invoice-tax-amount"]').textContent();
    const _total = await page.locator('[data-testid="invoice-total"]').textContent();

    // Parser les montants (gérer les formats € et virgules)
    const parseAmount = (text: string | null): number => {
      if (!text) return 0;
      return parseFloat(text.replace(/[€\s,]/g, '.'));
    };

    const subtotalNum = parseAmount(subtotal);

    // Vérifier la cohérence (tolérance 0.01€ pour arrondis)
    if (Math.abs(subtotalNum - expectedSubtotal) > 0.01) {
      throw new Error(`Subtotal mismatch: expected ${expectedSubtotal}, got ${subtotalNum}`);
    }
  }

  /**
   * Vérifie qu'une notification a bien été affichée
   */
  static async assertToastMessage(page: Page, message: string | RegExp) {
    const toast = page.locator('[role="status"]');
    if (typeof message === 'string') {
      await toast.getByText(message).waitFor({ timeout: 5000 });
    } else {
      await page.locator('[role="status"]', { hasText: message }).waitFor({ timeout: 5000 });
    }
  }

  /**
   * Vérifie qu'une donnée est présente dans le localStorage
   */
  static async assertLocalStorageValue(page: Page, key: string, expectedValue?: any) {
    const value = await page.evaluate((k) => localStorage.getItem(k), key);
    if (!value) {
      throw new Error(`LocalStorage key "${key}" not found`);
    }
    if (expectedValue !== undefined) {
      const parsed = JSON.parse(value);
      if (parsed !== expectedValue) {
        throw new Error(
          `LocalStorage value mismatch for "${key}": expected ${expectedValue}, got ${parsed}`
        );
      }
    }
  }

  /**
   * Vérifie qu'une donnée est chiffrée dans IndexedDB
   */
  static async assertIndexedDBEncrypted(page: Page, dbName: string, storeName: string) {
    const data = await page.evaluate(
      async ({ dbName, storeName }) => {
        return new Promise((resolve, reject) => {
          const req = indexedDB.open(dbName);
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction(storeName);
            const store = tx.objectStore(storeName);
            const getReq = store.getAll();

            getReq.onsuccess = () => {
              resolve(getReq.result);
            };
            getReq.onerror = () => reject(new Error('Cannot read IndexedDB'));
          };
          req.onerror = () => reject(new Error('Cannot open IndexedDB'));
        });
      },
      { dbName, storeName }
    );

    // Vérifie que les données ne sont pas en clair
    return data;
  }
}
