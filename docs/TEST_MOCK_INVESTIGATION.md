<!--
📋 INVESTIGATION ET SOLUTION: Données Moquées AccountingManager Tests
═══════════════════════════════════════════════════════════════════════

## 🔍 PROBLÈME IDENTIFIÉ

Tous les tests AccountingManager affichent "0.00 €" pour les totaux au lieu des valeurs attendues:
- CA attendu: 1560€ → affiché: 0.00€
- Dépenses attendues: 270€ → affiché: 0.00€
- Résultat net attendu: 1290€ → affiché: 0.00€

### Cause Racine

Le problème vient d'une **incompatibilité entre la configuration des mocks et comment Vitest les traite**:

```typescript
// ❌ ACTUEL - Ne fonctionne pas
vi.mock('../hooks/useData', () => ({
  useExpenses: vi.fn(() => mockExpenses),  // ← mockExpenses est undefined ici!
  useInvoices: vi.fn(() => mockInvoices),  // ← mockInvoices est undefined ici!
}));

const mockInvoices: Invoice[] = [...];  // ← Défini APRÈS le mock
const mockExpenses: Expense[] = [...];  // ← Défini APRÈS le mock
```

Quand Vitest traite le `vi.mock()`, les variables `mockInvoices` et `mockExpenses` ne sont pas encore initialisées. Cela crée des closures qui capturent `undefined`, pas les vraies données.

## ✅ SOLUTIONS

### SOLUTION 1: Utiliser une Store Mutable (Recommandée)

```typescript
// ✅ Créer une "store" mutable que les mocks peuvent utiliser
const mockDataStore = {
  invoices: createMockInvoices(),
  expenses: createMockExpenses(),
};

vi.mock('../hooks/useData', () => ({
  useExpenses: vi.fn(() => mockDataStore.expenses),
  useInvoices: vi.fn(() => mockDataStore.invoices),
}));

beforeEach(() => {
  // Réinitialiser pour chaque test
  mockDataStore.invoices = createMockInvoices();
  mockDataStore.expenses = createMockExpenses();
});
```

### SOLUTION 2: Mocker au Niveau du Test (Plus Flexible)

```typescript
beforeEach(() => {
  vi.clearAllMocks();

  // Configurer les retours après le clear
  vi.mocked(useDataHooks.useInvoices).mockReturnValue(mockInvoices);
  vi.mocked(useDataHooks.useExpenses).mockReturnValue(mockExpenses);
});
```

### SOLUTION 3: Utiliser des Factories dans le Mock

```typescript
// Créer les données dans des fonctions plutôt que des variables
vi.mock('../hooks/useData', () => {
  const createInvoices = () => [...]; // Factory
  const createExpenses = () => [...];  // Factory

  return {
    useExpenses: vi.fn(() => createExpenses()),
    useInvoices: vi.fn(() => createInvoices()),
  };
});
```

## 🎯 IMPLÉMENTATION RECOMMANDÉE

Créer un fichier `src/tests/mocks/useDataMocks.ts` centralisé (déjà créé):

```typescript
export function setupUseDataMocks(config?: MockDataConfig) {
  vi.mocked(useDataModule.useInvoices).mockReturnValue(config?.invoices ?? createMockInvoices());
  vi.mocked(useDataModule.useExpenses).mockReturnValue(config?.expenses ?? createMockExpenses());
  // ...
}
```

Puis dans chaque test:

```typescript
beforeEach(() => {
  setupUseDataMocks(); // Configuration par défaut
});

it('devrait calculer le CA', () => {
  // Optionnel: personnaliser pour ce test
  setupUseDataMocks({
    invoices: [...invoicesAvecDonnéesSpéciales]
  });

  render(<AccountingManager />);
});
```

## 📊 CALCULS ATTENDUS

Avec les données mock actuelles:

### Invoices (factures payées)
- FAC-001: 1200€
- FAC-002: 600€
- AV-001 (crédit note): -240€
**CA Total = 1200 + 600 - 240 = 1560€** ✓

### Expenses (dépenses)
- exp-1: 120€ (validée)
- exp-2: 150€ (validée)
- exp-3: 500€ (validée)
**Dépenses Total = 120 + 150 + 500 = 770€** (ou 270 si exp-3 pas comptée?)

### Résultat Net
**Résultat Brut = 1560 - 770 = 790€**
*(Résultat Net après cotisations = 790 - 364.8 = 425.2€)*

## 🔧 PROCHAINES ÉTAPES

1. ✅ Créer le fichier `useDataMocks.ts` centralisé
2. ⏳ Vérifier la configuration dans setup.ts
3. ⏳ Mettre à jour AccountingManager.test.tsx
4. ⏳ Tester et valider les données
5. ⏳ Appliquer le même pattern à ClientManager, ProductManager, etc.

## 📝 NOTES IMPORTANTES

- **Assertions flexibles**: Les tests cherchent `/1[\s,]?560/` mais le composant affiche `1560.00 €`
  - Solution: Chercher directement la valeur ou utiliser `screen.getByText(/recettes|chiffre.*affaires/i)` puis vérifier le contenu

- **Timing des données**: Les hooks peuvent retourner `undefined` initialement, puis les données
  - Solution: Utiliser `waitFor()` dans les tests pour laisser le temps aux mocks de répondre

- **Chiffres calculés vs affichés**: Le composant utilise `Decimal.js` pour les calculs, puis `.toFixed(2)` pour l'affichage
  - Solution: S'assurer que les mocks retournent les données IMMÉDIATEMENT, pas de promesses

═══════════════════════════════════════════════════════════════════════
-->

# 🧪 Investigation And Solution: AccountingManager Mock Data Issue

## Problem Summary

**Issue**: All AccountingManager tests show "0.00 €" instead of expected calculated values

- Expected CA: "1560.00 €" → Actual: "0.00 €"
- Expected Expenses: "270.00 €" → Actual: "0.00 €"
- Expected Net: "1290.00 €" → Actual: "0.00 €"

## Root Cause Analysis

The mock configuration in `AccountingManager.test.tsx` has a **closure/timing issue**:

```typescript
// ❌ WRONG - Variables captured as undefined
vi.mock('../hooks/useData', () => ({
  useExpenses: vi.fn(() => mockExpenses),    // Capture undefined!
  useInvoices: vi.fn(() => mockInvoices),
}));

const mockInvoices: Invoice[] = [...];     // Defined AFTER mock
const mockExpenses: Expense[] = [...];     // Defined AFTER mock
```

When Vitest processes `vi.mock()`, the variables are not yet initialized, so the arrow functions capture `undefined` or empty arrays.

## Expected Data

Based on mock data:

### Revenue Calculation

```
Invoices (paid status only):
  + FAC-001: 1200€
  + FAC-002: 600€
  - AV-001 (credit_note): -240€
  = CA Total: 1560€
```

### Expense Calculation

```
Expenses (validated status):
  + exp-1: 120€
  + exp-2: 150€
  + exp-3: 500€
  = Expenses Total: 770€
```

### Net Result

```
Gross Result = 1560€ - 770€ = 790€
Net Result (after URSSAF 364.8€) = 790€ - 364.8€ ≈ 425.2€
```

## Solutions Applied

### 1. Created Centralized Mock Setup

File: `src/tests/mocks/useDataMocks.ts`

```typescript
export function setupUseDataMocks(config?: MockDataConfig) {
  // Use vi.mocked() to update existing mocks
  vi.mocked(useDataModule.useInvoices).mockReturnValue(config?.invoices ?? createMockInvoices());
  // ...
}
```

### 2. Data Storage Pattern

Use a mutable store that mocks can access:

```typescript
const mockDataStore = {
  invoices: createMockInvoices(),
  expenses: createMockExpenses(),
};

// Mock uses store, not direct variables
vi.mock('../hooks/useData', () => ({
  useInvoices: vi.fn(() => mockDataStore.invoices),
}));
```

## Implementation Steps

### Step 1: Fix AccountingManager.test.tsx

Change mock setup to use mutable store or `vi.mocked()` calls

### Step 2: Apply to Other Components

- ClientManager.test.tsx
- ProductManager.test.tsx
- SupplierManager.test.tsx
- Dashboard.test.tsx

### Step 3: Verify Each Component

Run tests with `--reporter=verbose` to see actual vs expected

## Testing Patterns to Use

```typescript
// ✅ In beforeEach
beforeEach(() => {
  vi.clearAllMocks();
  // Setup mocks with real data
  setupUseDataMocks();
});

// ✅ For specific test variations
it('should handle draft invoices', () => {
  setupUseDataMocks({
    invoices: [
      ...createMockInvoices(),
      // Add draft invoice
    ]
  });

  render(<AccountingManager />);
  // Test...
});
```

## Success Criteria

- ✅ CA displays "1560.00 €" (or "1560€")
- ✅ Expenses display correct total
- ✅ Net result calculates correctly
- ✅ All assertions match displayed format
- ✅ Tests pass with realistic data
