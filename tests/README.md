# 🧪 Tests E2E avec Playwright

Guide complet pour les tests d'intégration end-to-end de MicroGestionFacile.

## 📋 Table des matières

1. [Setup](#setup)
2. [Structure](#structure)
3. [Exécution](#exécution)
4. [Écriture de tests](#écriture-de-tests)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Setup

### Installation

Playwright est déjà installé. Vérifiez que les navigateurs sont bien présents :

```bash
npx playwright install
```

### Configuration

- **Fichier config**: `playwright.config.ts`
- **Tests**: `tests/e2e/*.spec.ts`
- **Fixtures**: `tests/fixtures/`
- **Utilitaires**: `tests/utils/`

---

## Structure

```
tests/
├── e2e/
│   ├── setup.spec.ts              # Tests du wizard initial
│   ├── invoices.spec.ts           # Gestion des factures
│   ├── entities.spec.ts           # Clients, fournisseurs, produits
│   ├── calculations.spec.ts       # Calculs TVA, prorata
│   ├── offline.spec.ts            # Mode offline & PWA
│   ├── exports.spec.ts            # PDF, FEC, Factur-X
│   ├── accessibility.spec.ts      # Tests d'accessibilité (a11y)
│   ├── performance.spec.ts        # Benchmarks de performance
│   └── global-setup.ts            # Initialisation globale
├── fixtures/
│   ├── auth.fixture.ts            # Fixtures d'authentification
│   └── test-data-generator.ts     # Générateurs de données
└── utils/
    ├── helpers.ts                 # Actions courantes
    └── assertions.ts              # Assertions personnalisées
```

---

## Exécution

### Mode développement

```bash
# Tous les tests (avec affichage navigateur)
npm run test:e2e:headed

# Tous les tests en mode debug
npm run test:e2e:debug

# Avec l'interface graphique Playwright
npm run test:e2e:ui
```

### Mode CI (headless)

```bash
# Tous les tests
npm run test:e2e

# Un fichier spécifique
npx playwright test tests/e2e/setup.spec.ts

# Un test spécifique par nom
npx playwright test -g "créer une facture simple"

# Avec filtre (pattern)
npx playwright test tests/e2e/invoices
```

### Reports

```bash
# Générer un rapport HTML
npm run test:e2e

# Afficher le rapport
npm run test:e2e:report

# Reporter JSON (pour CI/CD)
npx playwright test --reporter json
```

---

## Écriture de tests

### Anatomie d'un test

```typescript
import { test, expect } from '@playwright/test';
import { CommonActions } from '../utils/helpers';

test.describe('📋 Feature Name', () => {
  // Setup avant chaque test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // Cleanup après chaque test
  test.afterEach(async ({ context }) => {
    // Optionnel
  });

  test('description claire du scénario', async ({ page }) => {
    // ARRANGE: Préparer l'état initial
    await CommonActions.navigateToSection(page, 'invoices');

    // ACT: Exécuter l'action testée
    await page.locator('button:has-text("Nouveau")').click();

    // ASSERT: Vérifier le résultat
    expect(page.locator('[data-testid="form"]')).toBeVisible();
  });
});
```

### Utiliser les fixtures

```typescript
import { test } from '../fixtures/auth.fixture';
import { generateTestData } from '../fixtures/test-data-generator';

test('avec utilisateur authentifié', async ({ authenticatedPage, page }) => {
  // authenticatedPage a lancé le wizard et configuré un profil
  // page est prêt à utiliser

  const client = generateTestData.client();
  // Utiliser client...
});
```

### Sélecteurs recommandés

```typescript
// ✅ PRÉFÉRÉ: data-testid
await page.locator('[data-testid="invoice-form"]').fill('...');

// ⚠️  ACCEPTABLE: text matching
await page.locator('button:has-text("Créer")').click();

// ⚠️  À ÉVITER: sélecteurs fragiles
await page.locator('.form > div:nth-child(3) > input').fill('...');
```

### Actions courantes

```typescript
import { CommonActions } from '../utils/helpers';

// Naviguer
await CommonActions.navigateToSection(page, 'invoices');

// Créer une facture
await CommonActions.createInvoice(page, invoiceData);

// Créer un client
await CommonActions.createClient(page, clientData);

// Mode offline
await CommonActions.goOffline(page);
await CommonActions.goOnline(page);

// Export PDF
const download = await CommonActions.exportToPDF(page, invoiceId);
```

### Assertions personnalisées

```typescript
import { CustomAssertions } from '../utils/assertions';

// Vérifier montants cohérents
await CustomAssertions.assertInvoiceAmounts(page, 1000.5);

// Vérifier message toast
await CustomAssertions.assertToastMessage(page, 'Facture créée');

// Vérifier localStorage
await CustomAssertions.assertLocalStorageValue(page, 'theme', 'dark');

// Vérifier les données IndexedDB
await CustomAssertions.assertIndexedDBEncrypted(page, 'MicroGestionDB', 'invoices');
```

---

## Best Practices

### ✅ À faire

```typescript
// ✅ Tests indépendants (pas d'ordre d'exécution)
test('chaque test est autonome', async ({ page }) => {
  // Ce test réinitialise tout
  await page.context().clearCookies();
  localStorage.clear();
});

// ✅ Noms descriptifs
test('crée une facture et calcule correctement la TVA', async ({ page }) => {
  // Clair et spécifique
});

// ✅ Timeouts explicites
await page.waitForTimeout(500);
await element.waitFor({ timeout: 5000 });

// ✅ Try-catch pour les conditions optionnelles
const isVisible = await element.isVisible().catch(() => false);

// ✅ Données réalistes avec generateTestData
const invoice = generateTestData.invoice();

// ✅ Screenshots/videos en cas d'erreur (auto via config)
// Pas besoin d'ajouter de code, c'est configuré
```

### ❌ À éviter

```typescript
// ❌ Tests dépendants les uns des autres
test('crée une facture', async ({ page }) => {
  // puis le test suivant suppose qu'elle existe
});

// ❌ Attentes trop vagues
expect(page).toHaveURL(/.*/);

// ❌ Hardcoding de valeurs
await page.locator('input').fill('12345678901234');

// ❌ Timeouts trop courts
await page.waitForTimeout(100); // Trop court!

// ❌ Tests trop longs (> 30s)
// Splitter en plusieurs petits tests

// ❌ Dépendre de l'ordre d'exécution
// Chaque test doit être autonome
```

---

## Troubleshooting

### Le test ne trouve pas l'élément

```typescript
// Ajouter un explicit wait
await page.locator('[data-testid="form"]').waitFor({ timeout: 10000 });

// Vérifier le sélecteur avec page.pause()
await page.pause(); // Pause le test pour debug

// Prendre un screenshot
await page.screenshot({ path: 'debug.png' });
```

### Le test dépend du timing

```typescript
// ❌ MAUVAIS: sleep fixe
await page.waitForTimeout(2000);

// ✅ BON: attendre l'élément
await page.locator('[data-testid="success"]').waitFor();

// ✅ BON: attendre une condition
await page.waitForFunction(() => document.querySelectorAll('[data-testid="item"]').length > 5);
```

### Erreurs de déconnexion du serveur

```bash
# S'assurer que le serveur Vite tourne (ou CI build):
npm run dev  # dans un autre terminal
```

### Flakiness (tests instables)

```typescript
// Utiliser retry configurable
test.describe.configure({ retries: 2 });

// Ou par test
test(
  'flaky test',
  async ({ page }) => {
    // ...
  },
  { retries: 1 }
);
```

### Debugging avec Playwright Inspector

```bash
# Lance l'inspecteur UI
npm run test:e2e:debug

# Ou via CLI
PWDEBUG=1 npx playwright test
```

---

## 🎯 Métriques et Rapports

Le workflow GitHub Actions génère plusieurs rapports :

- **HTML Report**: `test-results/index.html`
- **JSON Results**: `test-results/results.json` (pour CI parsing)
- **JUnit XML**: `test-results/junit.xml` (pour intégration)
- **Videos**: `test-results/videos/` (en cas d'erreur)
- **Screenshots**: `test-results/**/*.png`

---

## 📚 Ressources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Assertions API](https://playwright.dev/docs/test-assertions)
- [Selectors](https://playwright.dev/docs/selectors)

---

## 🤝 Contribution

Avant de commit un test:

1. ✅ Exécute `npm run test:e2e`
2. ✅ Vérifie qu'il passe 2 fois consécutives
3. ✅ Documente le scénario testé
4. ✅ Ajoute `data-testid` aux éléments critiques si besoin
5. ✅ Force push du code limité et maintenable
