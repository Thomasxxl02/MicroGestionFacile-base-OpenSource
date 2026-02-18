/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-empty-pattern */
import { test as base, expect } from '@playwright/test';
import { UserProfile } from '../../src/types';
import { generateTestData } from './test-data-generator';

/**
 * Fixture pour les tests d'authentification et setup utilisateur
 */

interface AuthFixtures {
  authenticatedPage: void;
  userProfile: UserProfile;
  apiContext: unknown;
}

export const test = base.extend<AuthFixtures>({
  /**
   * Fixture: Utilisateur authentifié avec profil complètement configuré
   * Stratégie: Pré-initialiser localStorage + attendre que React charge tout
   */
  authenticatedPage: async ({ page, context }, use: (value: void) => Promise<void>) => {
    // Générer un profil utilisateur test
    const testProfile = generateTestData.userProfile();
    
    // Préparer le profil configuré
    const configuredProfile = {
      ...testProfile,
      id: 'current',
      isConfigured: true,
    };

    // Injecter un script pour pré-initialiser localStorage
    // Le profil sera migré vers IndexedDB par App.tsx dans useEffect
    await context.addInitScript((profile: any) => {
      // Stocker dans localStorage - App.tsx le migrera via useEffect
      localStorage.setItem('autogest_profile', JSON.stringify({
        ...profile,
        id: 'current',
        isConfigured: true,
      }));
      
      console.log('[INIT_SCRIPT] Profile stored in localStorage');
    }, configuredProfile);

    // NAVIGATION: Charger la page
    console.log('[TEST] Navigating to / with baseURL http://localhost:3000');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    console.log('[TEST] Page DOM loaded');
    
    // 🔑 CRITICAL WAIT: Donner du temps à React et Dexie pour:
    // 1. React se monter
    // 2. useUserProfile() commencer à lire depuis IndexedDB
    // 3. Migration localStorage -> IndexedDB s'exécuter
    // 4. Dashboard se rendre
    // Note: Cela prend 8-15 secondes selon la machine
    await page.waitForTimeout(10000);
    console.log('[TEST] Waited 10s for React mount + migration + profile load');

    //Attendre le dashboard de maan robuste
    const maxAttempts = 5;
    let dashboardFound = false;

    for (let attempts = 0; attempts < maxAttempts && !dashboardFound; attempts++) {
      // Vérifier si dashboard est visible
      dashboardFound = await page.locator('[data-testid="dashboard"]').isVisible({
        timeout: 3000,
      }).catch(() => false);

      if (dashboardFound) {
        console.log('[TEST] ✅ Dashboard found and visible on attempt', attempts + 1);
        break;
      }

      // Vérifier si SetupWizard est là (mauvais état)
      const hasWizard = await page.locator('[data-testid="setup-wizard"]').isVisible({
        timeout: 1000,
      }).catch(() => false);

      if (hasWizard && attempts < 2) {
        // Le profil n'a pas été chargé, reload et retry
        console.log('[TEST] ⚠️  SetupWizard visible (profile not loaded), reload attempt', attempts + 1);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
      } else if (hasWizard) {
        // Trop de tentatives de reload
        throw new Error('SetupWizard still visible after retries - profile failed to load');
      }
    }

    if (!dashboardFound) {
      // Page est blanche ou incohérente
      const pageContent = await page.evaluate(() => document.body.innerHTML.substring(0, 200));
      throw new Error(`Dashboard not found after ${maxAttempts} attempts. Page: ${pageContent}`);
    }

    // Attendre que le dashboard soit complètement stable
    await page.locator('[data-testid="dashboard"]').waitFor({
      state: 'visible',
      timeout: 5000,
    });

    console.log('[TEST] ✅ Dashboard is stable and ready');

    await use();
  },

  /**
   * Fixture: Profil utilisateur test
   */
  userProfile: async ({}, use) => {
    const profile = generateTestData.userProfile();
    await use(profile);
  },

  /**
   * Fixture: APIContext pour appels directs (futur)
   */
  apiContext: async ({}, use: (value: unknown) => Promise<void>) => {
    // Pour les futurs tests API
    await use(null);
  },
});

export { expect };
