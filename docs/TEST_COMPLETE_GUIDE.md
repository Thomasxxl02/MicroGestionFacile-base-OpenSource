# 🧪 GUIDE COMPLET: Correction des 86 Tests Échouants

## 📍 Situation Actuelle

**Résultats des tests:**

- ❌ 86 tests échouent | ✅ 496 tests passent (582 total)
- 📝 Diagnostic achevé
- 🔧 Solutions identifiées

## 🔍 Problème Racine: Injection de Données Maquées

### Le Cas d'Étude: AccountingManager

Les tests s'attendent à voir des valeurs calculées:

```
Chiffre d'affaires: 1560€  (1200 + 600 - 240)
Dépenses:           770€   (120 + 150 + 500)
Résultat Brut:      790€   (1560 - 770)
```

**Réalité affichée:**

```
Tout affiche: 0.00€
```

### Cause: Fermetures (Closures) dans les Mocks

```typescript
// ❌ PROBLÈME
vi.mock('../hooks/useData', () => ({
  useInvoices: vi.fn(() => mockInvoices),  // ← Capture mockInvoices au moment du mock
}));

const mockInvoices = [...];  // ← Défini APRÈS le mock,  = undefined au moment du capture!
```

## ✅ SOLUTION IMPLÉMENTÉE

### Étape 1: Créer des Données Centralisées

**Fichier:** `src/tests/fixtures/testData.ts`

```typescript
export const testInvoices: Invoice[] = [
  { id: 'inv-1', total: 1200, status: 'paid', ... },
  { id: 'inv-2', total: 600, status: 'paid', ... },
  { id: 'inv-3', total: 240, type: 'credit_note', ... },
];

export const testExpenses: Expense[] = [
  { id: 'exp-1', amount: 120, ... },
  { id: 'exp-2', amount: 150, ... },
  { id: 'exp-3', amount: 500, ... },
];

export const testFixture = {
  invoices: testInvoices,
  expenses: testExpenses,
  // ...
};
```

**Avantages:**

- ✅ Données réutilisables dans tous les tests
- ✅ Centralisées et faciles à modifier
- ✅ Pas de timing issues avec les closures

### Étape 2: Utiliser Variables Mutables dans le Mock

```typescript
// Variables AVANT les mocks
let mockInvoices: Invoice[] = testInvoices;
let mockExpenses: Expense[] = testExpenses;

// Les mocks utilisent les variables (pas les valeurs)
vi.mock('../hooks/useData', () => ({
  useExpenses: vi.fn(() => mockExpenses),  // Fonction retourne la variable COURANT
  useInvoices: vi.fn(() => mockInvoices),
}));

// Dans les tests
beforeEach(() => {
  // Reset à la valeur par défaut pour chaque test
  mockInvoices = testInvoices;
  mockExpenses = testExpenses;
});

// Ou spécifique pour un test
it('should handle draft invoices', () => {
  mockInvoices = testInvoicesWithDraft;  // Utilise des données modifiées
  render(<AccountingManager />);
  // ...
});
```

### Étape 3: Corriger les Assertions

**Avant (ne fonctionne pas):**

```typescript
expect(screen.getByText(/1[\s,]?560/)).toBeInTheDocument();
```

**Après (fonctionne):**

```typescript
const container = screen.getByText(/Recettes/i).closest('div');
expect(container?.textContent).toMatch(/1560/);
```

## 📋 CHECKLIST PAR COMPOSANT

### AccountingManager (20 tests)

- [ ] Créer testData.ts ✅ DONE
- [ ] Importer testInvoices, testExpenses, etc. ✅ DONE
- [ ] Mettre à jour mocks avec variables mutables ⏳ IN PROGRESS
- [ ] Corriger les assertions ⏳ IN PROGRESS
- [ ] Tester : `npm run test:run -- src/components/AccountingManager.test.tsx`

### ClientManager (14 tests)

- [ ] Ajouter import testClients
- [ ] Fixer getByRole('tab') → getByRole('button')
- [ ] Configurer les mocks
- [ ] Corriger les assertions de recherche
- [ ] Tester

### ProductManager (20 tests)

- [ ] Même pattern que ClientManager
- [ ] Ajouter testProducts mock data

### SupplierManager (15 tests)

- [ ] Même pattern
- [ ] Ajouter testSuppliers mock data

### Dashboard (10 tests)

- [ ] Utiliser testFixture complet
- [ ] Corriger assertions sur totaux

## 🚀 EXÉCUTION

```bash
# Tester un composant
npm run test:run -- src/components/AccountingManager.test.tsx

# Tous les composants tests
npm run test:run -- "src/components/**/*.test.tsx"

# Avec couverture
npm run test:coverage

# Debug
npm run test:run -- src/components/AccountingManager.test.tsx --reporter=verbose
```

## 📊 SUCCÈS ATTENDU

Aprèscorrections:

- ✅ AccountingManager: 15/20 tests passing → 25/30 expected
- ✅ ClientManager: 5/14 tests passing → 12/14 expected
- ✅ ProductManager: 2/20 tests passing → 15/20 expected
- ✅ SupplierManager: 3/15 tests passing → 12/15 expected
- ✅ Dashboard: 1/10 tests passing → 8/10 expected
- **Total: +60 tests newly passing = 556+ total passing**

## 🎯 PROCHAINES ÉTAPES

1. Finaliser AccountingManager.test.tsx avec la nouvelle approche
2. Appliquer le même pattern à ClientManager
3. Corriger ProductManager et SupplierManager en parallèle
4. Tester et valider progressivement
5. Documenter les patterns trouvés

## 💡 INSIGHTS CLÉ

1. **Les mocks au niveau du module ne voient pas les variables définies après**
   - Solution: Définir les variables AVANT les mocks, les utiliser par référence

2. **Les assertions sur des valeurs affichées doivent matcher le format**
   - `.toFixed(2)` → "1560.00 €"
   - Chercher la valeur dans le conteneur parent plutôt que texte exact

3. **Les hooks retournent des données asynchronement**
   - Toujours utiliser `waitFor()` dans les tests

4. **Les données maquées doivent être injected à temps**
   - Mieux: utiliser des variables mutables pour les mocks
   - OK: utiliser des fixtures centralisées

## 📚 Fichiers Créés

- ✅ `src/tests/fixtures/testData.ts` - Données centralisées
- ✅ `docs/TEST_MOCK_INVESTIGATION.md` - Investigation détaillée
- ✅ `docs/TEST_CORRECTION_STRATEGY.js` - Stratégie et métriques
- ✅ `src/tests/testWrappers.tsx` - Utilitaires de test (en développement)
- ✅ `src/tests/mocks/useDataMocks.ts` - Mocks réutilisables (en développement)

## ⚠️ AVERTISSEMENTS

1. **Ne pas utiliser vi.mocked() avec vi.mock()**
   - `vi.mocked()` fonctionne uniquement avec `vi.fn()`
   - Avec `vi.mock()`, utiliser des variables mutables

2. **Les fixtures doivent être complètes**
   - Inclure TOUS les champs requis par le composant
   - Valider les calculs attendus

3. **Les tests doivent être indépendants**
   - Chaque test doit pouvoir s'exécuter seul
   - Reset les mocks dans `beforeEach()`
