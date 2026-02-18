import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright E2E Tests
 * Tests d'intégration complète de MicroGestionFacile
 */

export default defineConfig({
  testDir: './tests/e2e',
  // Timeout global par test
  timeout: 30 * 1000,

  // Configuration générale
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 3,

  // Reporter
  reporter: [
    ['html', { open: 'never', outputFolder: 'test-results' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Configuration pour serveur de dev
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Configuration des navigateurs
  use: {
    // URL de base pour tous les tests
    baseURL: 'http://localhost:3000',

    // Comportement de navigation
    navigationTimeout: 30 * 1000,
    actionTimeout: 10 * 1000,

    // Screenshots et vidéos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Localisation
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Environmental variables for tests
  globalSetup: './tests/e2e/global-setup.ts',
});
