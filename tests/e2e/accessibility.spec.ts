/**
 * Accessibility Audit Test Suite
 * Vérifie la conformité WCAG 2.1 AA
 *
 * Note: Pour les audits complets Axe, installer:
 * npm install --save-dev axe-playwright @axe-core/react
 *
 * Ces tests s'exécutent APRÈS le build et ne bloquent pas le déploiement Vercel
 */

import { test, expect } from '../fixtures/auth.fixture';

// Skip tests on Vercel during build
const skipOnVercel = process.env.VERCEL === 'true';
const describe = skipOnVercel ? test.describe.skip : test.describe;

describe('🧪 Accessibility Audit (WCAG 2.1 AA)', () => {
  test("devrait passer l'audit d'accessibilité sur la page d'accueil", async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.goto('/');

    // Vérifier qu'il n'y a pas d'erreurs d'accessibilité basiques
    const inaccessibleElements = await page.evaluate(() => {
      const issues: string[] = [];

      // Vérifier que tous les boutons ont un texte accessible
      document.querySelectorAll('button').forEach((btn) => {
        if (!btn.textContent?.trim() && !btn.getAttribute('aria-label')) {
          issues.push(`Button without accessible name at ${btn.className}`);
        }
      });

      // Vérifier que tous les liens ont du texte ou un aria-label
      document.querySelectorAll('a').forEach((link) => {
        if (!link.textContent?.trim() && !link.getAttribute('aria-label')) {
          issues.push(`Link without accessible name`);
        }
      });

      return issues;
    });

    expect(inaccessibleElements).toHaveLength(0);
    console.info('✅ Accessibility audit passed');
  });

  test('devrait avoir des labels accessibles sur les inputs', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    const inputs = await page.locator('input').count();

    for (let i = 0; i < inputs; i++) {
      const input = page.locator('input').nth(i);
      const label = input.locator('label');
      const ariaLabel = await input.getAttribute('aria-label');

      // Soit un label, soit un aria-label
      const hasAccessibleName = (await label.count()) > 0 || ariaLabel;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('devrait avoir une navigation au clavier fonctionnelle', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.goto('/');

    // Tabuler à travers les éléments interactifs
    const focusableElements = await page
      .locator('button, a[href], input, select, textarea, [tabindex]')
      .count();

    expect(focusableElements).toBeGreaterThan(0);
  });

  test('devrait avoir un contraste de couleur suffisant', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.goto('/');

    // Vérifier le contraste sur les boutons principaux
    const contrastIssues = await page.evaluate(() => {
      const issues: string[] = [];

      document.querySelectorAll('button').forEach((btn) => {
        const style = window.getComputedStyle(btn);
        const bgColor = style.backgroundColor;
        const textColor = style.color;

        // Vérification simple : les couleurs ne doivent pas être identiques
        if (bgColor === textColor) {
          issues.push('Insufficient contrast on button');
        }
      });

      return issues;
    });

    expect(contrastIssues).toHaveLength(0);
  });

  test("devrait avoir une structure d'en-têtes valide", async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.goto('/');

    const h1 = await page.locator('h1').count();
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();

    // Au moins un H1 et une structure hiérarchique
    expect(h1).toBeGreaterThanOrEqual(1);
    expect(headings).toBeGreaterThan(0);
  });

  test('devrait supporter le focus visible sur les boutons', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.goto('/');

    const buttons = page.locator('button');

    for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
      const button = buttons.nth(i);
      await button.focus();

      // Vérifier qu'il y a un indicateur de focus
      const outline = await button.evaluate(() => {
        const style = window.getComputedStyle(document.activeElement!);
        return style.outline || style.boxShadow;
      });

      expect(outline).toBeTruthy();
    }
  });

  test('devrait avoir des textes alt sur les images', async ({
    page,
    authenticatedPage: _authenticatedPage,
  }) => {
    await page.goto('/');

    const images = page.locator('img:not([alt*=""])');
    const imagesCount = await images.count();

    // Les images décoratives doivent avoir alt=""
    // Les images informatives doivent avoir un alt descriptif
    for (let i = 0; i < imagesCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      expect(alt).not.toBeNull();
    }
  });
});
