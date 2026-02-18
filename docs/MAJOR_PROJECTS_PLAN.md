# 🏗️ Plan D'Action - Projets Majeurs (1-2 semaines)

## 📋 Vue d'ensemble

Trois projets interconnectés pour améliorer la robustesse et la sécurité de MicroGestionFacile :

| Projet                        | Durée     | Priorité | Dépendances                 |
| ----------------------------- | --------- | -------- | --------------------------- |
| **Tests E2E**                 | 4-5 jours | Haute    | -                           |
| **Chiffrement IndexedDB**     | 3-4 jours | Critique | Tests E2E (pour validation) |
| **Refactor Context Provider** | 2-3 jours | Moyenne  | -                           |

---

## 🧪 Projet 1: Tests E2E Complets (4-5 jours)

### 📊 État Actuel

- ✅ Vitest + Testing Library pour les tests unitaires
- ❌ Aucun framework E2E (Playwright/Cypress)
- ❌ Aucun test d'intégration navigateur
- ✅ Service Worker et PWA configués

### 🎯 Objectifs

1. **Setup Playwright** (framework E2E moderne, sans serveur dédié)
2. **Automate workflows critiques**:
   - Setup initial (création profil)
   - Gestion factures (CRUD)
   - Calculs TVA et prorata
   - Export PDF
   - Mode offline
3. **CI/CD GitHub Actions**
4. **Coverage report** pour les scénarios clés

### 💡 Stack Proposée

```
Playwright + TypeScript
- Léger et rapide
- Headless par défaut
- Screenshots/traces automatiques
- Responsive testing (mobile/tablet)
- Native service worker support
```

### 📍 Étapes d'Implémentation

#### Phase 1: Configuration (1 jour)

- [x] Installer `@playwright/test`
- [x] Configurer `playwright.config.ts`
- [x] Setup fixtures et helpers
- [x] Configure webServer pour Vite (dev mode)

#### Phase 2: Test Suites (2 jours)

1. **Auth & Setup** (`tests/e2e/setup.spec.ts`)
   - First-time user wizard
   - Profile creation
   - Data persistence check

2. **Invoice Management** (`tests/e2e/invoices.spec.ts`)
   - Create/Read/Update/Delete
   - Invoice numbering (continuous)
   - PDF generation & download
   - Status workflow

3. **Clients & Suppliers** (`tests/e2e/entities.spec.ts`)
   - CRUD operations
   - Duplicate detection
   - List filtering & search

4. **Calculations** (`tests/e2e/calculations.spec.ts`)
   - VAT threshold (36,800€ / 91,900€)
   - Proration calculations
   - Social contributions (URSSAF)
   - Multi-currency handling

5. **PWA Features** (`tests/e2e/offline.spec.ts`)
   - Service worker install
   - Offline functionality
   - Data sync after reconnection
   - Cache invalidation

6. **PDF/Export** (`tests/e2e/exports.spec.ts`)
   - PDF generation
   - Factur-X compliance
   - FEC export format

#### Phase 3: CI/CD (1 jour)

- [x] GitHub Actions workflow
- [x] Run on PR & main branch
- [x] Upload artifacts (videos, traces)
- [x] Performance monitoring

### 📁 Structure

```
tests/
├── e2e/
│   ├── setup.spec.ts
│   ├── invoices.spec.ts
│   ├── entities.spec.ts
│   ├── calculations.spec.ts
│   ├── offline.spec.ts
│   ├── exports.spec.ts
│   └── performance.spec.ts
├── fixtures/
│   ├── auth.ts (login/user helpers)
│   ├── data.ts (test data generators)
│   └── ui.ts (selectors & common actions)
├── utils/
│   ├── assertions.ts (custom matchers)
│   └── helpers.ts
└── playwright.config.ts
```

---

## 🔐 Projet 2: Chiffrement IndexedDB Transparent (3-4 jours)

### 📊 État Actuel

- ✅ `encryptionService.ts` existe (AES-GCM)
- ✅ `migrationService.ts` existe
- ❌ Chiffrement **NON transparent** (nécessite appel manuel)
- ❌ **Aucune gestion de clé** robuste
- ❌ Pas de **rotation de clé**

### 🎯 Objectifs

1. **Transparence totale**: Toutes les données sensibles chiffrées auto à l'écriture
2. **Gestion robuste des clés**:
   - Génération sécurisée
   - Stockage sûr (IndexedDB chiffré OU local storage)
   - Rotation mensuelle
3. **Zero-Knowledge**: Utilisateur = clé maître
4. **Tests de sécurité**: Validation du chiffrement réel

### 💡 Architecture Proposée

#### Couche 1: Gestion des Clés (`encryptionService.ts` refactor)

```typescript
interface KeyManagementService {
  // Génère clé maître depuis passphrase utilisateur
  generateMasterKey(passphrase: string): Promise<CryptoKey>;

  // Dérive clés par table (invoices, clients, etc.)
  deriveTableKey(tableName: string): Promise<CryptoKey>;

  // Rotation: dérive nouvelle clé
  rotateKey(tableName: string): Promise<void>;

  // Récupère historique des clés
  getKeyHistory(tableName: string): Promise<KeyMetadata[]>;
}
```

#### Couche 2: Transparence (`dexie-hooks.ts`)

```typescript
// Hook Dexie pour intercepter putting/getting
// - Avant saving → encrypt
// - Avant returning → decrypt
// Invisible à l'utilisateur
```

#### Couche 3: Isolation des Données Sensibles

Déterminer quels champs chiffrer:

```
TOUJOURS:
- Contenu factures (HT, TTC amounts)
- Données clients (Email, téléphone, adresse)
- Fournisseurs (infos bancaires si présentes)
- Notes/commentaires internes

OPTIONNEL (config utilisateur):
- Numéros de facture
- Dates
- Noms clients/fournisseurs
```

### 📍 Étapes d'Implémentation

#### Phase 1: Refactor Service (1 jour)

1. **`KeyManagementService`** (nouveau)
   - Génération PBKDF2 sécurisée
   - Dérivation par table via HKDF
   - Metadata storage (timestamps, versions)

2. **`EncryptionService`** (refactor)
   - Intégre KeyManagement
   - Expose `encryptField()` et `decryptField()`
   - Batch operations support

3. **Type System**
   ```typescript
   type EncryptedField = {
     __encrypted: true
     __algorithm: 'AES-GCM'
     __keyVersion: number
     __iv: string (base64)
     value: string (base64)
   }
   ```

#### Phase 2: Hooks & Transparence (1 jour)

1. **`dexie-hooks.ts`**

   ```typescript
   // Intercepte toutes les opérations Dexie
   db.on('creating', (primKey, obj) => {
     // Chiffre les champs sensibles
     obj.amount = await encrypt(obj.amount, 'invoices');
     obj.clientEmail = await encrypt(obj.clientEmail, 'invoices');
   });

   db.on('reading', (obj) => {
     // Déchiffre automatiquement
     obj.amount = await decrypt(obj.amount);
     obj.clientEmail = await decrypt(obj.clientEmail);
   });
   ```

2. **Initialisation**
   ```typescript
   // App.tsx au démarrage
   await initializeEncryption(userPassphrase);
   // Dès ce moment: transparence auto
   ```

#### Phase 3: Migration & Rotation (1 jour)

1. **Migration** pour données existantes (non chiffrées → chiffrées)

   ```typescript
   // migrationService.ts
   async migrateToEncryption(oldDbVersion: 4, newDbVersion: 5) {
     for (let invoice of db.invoices.toArray()) {
       invoice.amount = encrypt(invoice.amount)
       invoice.tvaAmount = encrypt(invoice.tvaAmount)
       await db.invoices.put(invoice)
     }
   }
   ```

2. **Rotation Plan**
   - Tracking: dernier timestamp de rotation
   - Trigger: rotation auto tous les 30j OU manuel utilisateur
   - Process: dérive nouvelle clé, re-encrypt tout, delete ancienne clé

#### Phase 4: Tests + Validation (1 jour)

1. **Unit Tests**
   - Chiffrement/déchiffrement
   - Derivation correcte
   - Failure modes (clé invalide, corruption)

2. **E2E Tests** (réutiliser tests projet 1)
   - Créer invoice → vérifier chiffrement en DB
   - Recharger app → données déchiffrées correctement
   - Mauvaise passphrase → erreur lisible

3. **Security Tests**
   ```typescript
   // Vérifier que données sensibles NE sont PAS en clair dans IndexedDB
   const raw = await getInspectedIndexedDB('MicroGestionDB');
   expect(raw.invoices[0].amount).not.toBe('100.50'); // chiffré
   expect(raw.invoices[0].amount).toMatch(/^[A-Za-z0-9+/=]+$/); // base64
   ```

### 📁 Structure

```
src/
├── services/
│   ├── encryptionService.ts (refactor)
│   ├── keyManagementService.ts (nouveau)
│   └── migrationService.ts (update)
├── lib/
│   ├── dexie-hooks.ts (nouveau)
│   └── encryption-utils.ts (helpers)
├── types/
│   └── encryption.ts (types)
└── tests/
    └── services/
        ├── encryptionService.test.ts
        ├── keyManagementService.test.ts
        └── e2e/ (réutiliser projet 1)
```

---

## 🏗️ Projet 3: Refactor Context Provider Injection (2-3 jours)

### 📊 État Actuel

- ✅ Zustand (useUIStore, useConfigStore) pour état global
- ✅ FormProvider (react-hook-form) pour formulaires
- ❌ Pas de **Context API centralisée**
- ❌ **Dépendances circulaires** potentielles
- ❌ **Prop drilling** en certains endroits
- ❌ **Pas de dépendances injectées** (Logger, Services)

### 🎯 Objectifs

1. **Créer Context centralisé** pour dépendances critiques
2. **Éliminer prop drilling** (Logger, Services, Auth)
3. **Simplifier tests** (injection facile de mocks)
4. **Améliorer DX** (typesafe injection)
5. **Documentation** des patterns utilisés

### 💡 Architecture Proposée

#### Pattern: Container + Context

```typescript
// 1. Créer un contexte pour chaque domaine
interface AppContextType {
  logger: LoggerService
  encryptionService: EncryptionService
  auditService: AuditService
  businessService: BusinessService
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// 2. Provider
export function AppProvider({ children }: { children: React.ReactNode }) {
  const logger = useMemo(() => new LoggerService(), [])
  const encryptionService = useMemo(() => new EncryptionService(), [])

  return (
    <AppContext.Provider value={{ logger, encryptionService, ... }}>
      {children}
    </AppContext.Provider>
  )
}

// 3. Hook pour utiliser
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be inside AppProvider')
  return context
}

// 4. Utilisation
function MyComponent() {
  const { logger, encryptionService } = useAppContext()
  // ...
}
```

#### Services à Centraliser & Tester

| Service             | Responsabilité              | État              |
| ------------------- | --------------------------- | ----------------- |
| `LoggerService`     | Logging centralisé          | À créer/améliorer |
| `EncryptionService` | Chiffrement (voir projet 2) | Partial           |
| `AuditService`      | Audit trail                 | Partial           |
| `BusinessService`   | Metier logic                | Partial           |
| `ValidationService` | Validation données          | Exists            |
| `CacheService`      | Caching                     | Exists            |
| `AuthService`       | Auth/Permissions            | À créer           |

### 📍 Étapes d'Implémentation

#### Phase 1: Audit & Design (0.5 jour)

1. **Audit des services existants**

   ```
   ✓ src/services/*.ts
   → Identifier responsabilités
   → Repérer dépendances croisées
   → Déterminer ordre d'injection
   ```

2. **Design du contexte**
   ```typescript
   // Document: CONTEXT_ARCHITECTURE.md
   - Quels services
   - Ordre d'initialisation
   - Lifecycle management
   - Error handling
   ```

#### Phase 2: Implémentation Core (1 jour)

1. **Créer `src/context/AppContext.tsx`**

   ```typescript
   export interface AppContextType {
     logger: LoggerService
     encryption: EncryptionService
     audit: AuditService
     business: BusinessService
     validation: ValidationService
     cache: CacheService
     // Futures: auth, notifications, etc.
   }

   export const AppProvider = ({ children }) => { ... }
   export const useAppContext = () => { ... }
   ```

2. **Créer middleware pour initialization**

   ```typescript
   // src/context/AppInitializer.tsx
   // Gère les sequencing des services
   // Ex: Encryption doit démarrer avant BusinessService
   ```

3. **Update `src/App.tsx`**
   ```typescript
   <AppProvider>
     <ErrorBoundary>
       <Router>
         <Sidebar />
         <MainContent />
       </Router>
     </ErrorBoundary>
   </AppProvider>
   ```

#### Phase 3: Refactor Consommateurs (1 jour)

1. **Audit des imports directs**

   ```bash
   grep -r "import.*Service from.*services" src/
   → Identifier tous les imports directs
   ```

2. **Refactor composants clés**
   - [ ] `Dashboard.tsx`
   - [ ] `InvoiceManager.tsx`
   - [ ] `AccountingManager.tsx`
   - [ ] Custom hooks (`useInvoiceCalculations.ts`, etc.)

   Pattern avant/après:

   ```typescript
   // AVANT
   import { loggerService } from '../services/loggerService';
   function Dashboard() {
     loggerService.info('Dashboard loaded');
   }

   // APRÈS
   import { useAppContext } from '../context/AppContext';
   function Dashboard() {
     const { logger } = useAppContext();
     logger.info('Dashboard loaded');
   }
   ```

3. **Update tests** pour injecter mocks

   ```typescript
   // OLD
   import * as services from '../services'
   vi.mocked(services.logger).info = vi.fn()

   // NEW
   const mockAppContext = createMockAppContext() // helper
   render((
     <AppProvider value={mockAppContext}>
       <Dashboard />
     </AppProvider>
   ))
   ```

#### Phase 4: Documentation & Testing (0.5 jour)

1. **Documentation**
   - `docs/CONTEXT_ARCHITECTURE.md`
   - Dependency graph
   - Usage examples

2. **Tests**
   - Context initialization
   - Services instantiation
   - Circular dependency detection

### 📁 Structure

```
src/
├── context/
│   ├── AppContext.tsx (définition + provider)
│   ├── AppInitializer.tsx (sequencing)
│   ├── usageExamples.tsx (patterns)
│   └── __tests__/ (tous les tests contexte)
├── services/
│   └── (unchanged - mais refactorés un par un)
├── App.tsx (updated)
└── docs/
    └── CONTEXT_ARCHITECTURE.md
```

---

## 📈 Dépendances Entre Projets

```
┌─────────────────┐
│  Tests E2E      │ ← Foundation (jour 1-4)
│  Framework      │   Permet valider les 2 autres
└────────┬────────┘
         │
    ┌────▼──────────────────┐
    │  Tests valident:      │
    │  • Chiffrement OK     │
    │  • Provider injection │
    └────────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │  Chiffrement IndexedDB        │ ← Jour 5-8
    │  Key Management               │   Utilise Context
    │  (Utilise Context pour inject)│   Validé par E2E
    └───────────┬────────────────────┘
                │
     ┌──────────▼──────────────┐
     │  Context Provider       │ ← Jour 9-11
     │  Refactor & DI          │   Fondation pour tous
     │  (Cleanup final)        │   Build propre structure
     └─────────────────────────┘
```

---

## 🚀 Roadmap Réaliste (10-11 jours)

### Semaine 1:

- **Jour 1**: Setup Playwright + Config
- **Jour 2**: Tests E2E Phase 1 (Setup, Invoices)
- **Jour 3**: Tests E2E Phase 2 (Entities, Calculations)
- **Jour 4**: Tests E2E Phase 3 (Offline, Exports, CI/CD)
- **Jour 5**: Chiffrement Phase 1 (KeyManagement refactor)

### Semaine 2:

- **Jour 6**: Chiffrement Phase 2 (Transparency, Dexie hooks)
- **Jour 7**: Chiffrement Phase 3-4 (Migration, Tests, Validation)
- **Jour 8**: Context Phase 1-2 (Audit, Core implementation)
- **Jour 9**: Context Phase 3 (Refactor consumers)
- **Jour 10-11**: Documentation, cleanup, final validation

---

## ✅ Critères de Succès

### Tests E2E

- [ ] ✅ 100+ test cases
- [ ] ✅ Coverage > 85% user flows
- [ ] ✅ CI/CD green on every PR
- [ ] ✅ Performance benchmarks (< 3s load)

### Chiffrement

- [ ] ✅ Zero plaintext sensitive data in IndexedDB
- [ ] ✅ Key rotation functional
- [ ] ✅ Migration successful (0 data loss)
- [ ] ✅ Security audit passed

### Context Provider

- [ ] ✅ Zero prop drilling in main components
- [ ] ✅ All tests use injected mocks
- [ ] ✅ Clear documentation
- [ ] ✅ DX improvements measurable

---

## 🛠️ Commandes Clés

```bash
# Tests E2E
npm run test:e2e              # Run all E2E tests
npm run test:e2e --headed     # Run with UI
npm run test:e2e:debug        # Debug mode

# Chiffrement
npm run test -- encryption    # Test chiffrement
npm test:security            # Security validation

# Context
npm run type-check           # Vérifier types injection
npm run lint                 # Check patterns

# Global
npm run validate             # Full validation
npm run test:coverage        # Coverage report
```

---

## 📚 Références & Standards

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [NIST Cryptography Standards](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [React Context Patterns](https://react.dev/reference/react/useContext)
- [Dexie.js Documentation](https://dexie.org/)
- [OWASP Security Guidelines](https://owasp.org/)
