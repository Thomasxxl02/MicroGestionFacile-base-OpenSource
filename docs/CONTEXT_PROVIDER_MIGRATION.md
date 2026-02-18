# 🏗️ Architecture Refactorée - Context Provider

Guide complet de la refonte de l'injection de dépendances avec Context API.

## 📋 Vue d'ensemble

### Problème Avant (Legacy)

```typescript
// ❌ Anti-pattern: Imports directs partout
import { logger } from '../services/loggerService';
import { encryptionService } from '../services/encryptionService';
import { auditService } from '../services/auditService';

function Dashboard() {
  logger.info('Dashboard loaded'); // Couplage fort!

  useEffect(() => {
    encryptionService.test();
  }, []);

  return <div>Dashboard</div>;
}
```

**Problèmes**:

- ❌ Couplage fort aux services
- ❌ Impossible tester sans services réels
- ❌ Prop drilling si on veut passer les services
- ❌ Services globaux = singleton pattern (difficient pour PWA)

### Solution(New Pattern)

```typescript
// ✅ Injection via Context
import { useAppContext } from '../context/AppContext';

function Dashboard() {
  const { logger, encryption, audit } = useAppContext();

  logger.info('Dashboard loaded'); // Injecté!

  useEffect(() => {
    encryption.test();
  }, [encryption]);

  return <div>Dashboard</div>;
}
```

**Avantages**:

- ✅ Injection dépendances (DI)
- ✅ Facile à tester (mock le contexte)
- ✅ Pas de prop drilling
- ✅ Cycle de vie contrôlé
- ✅ TypeSafe avec TypeScript

---

## 🏗️ Architecture

### Structure des Répertoires

```
src/
├── context/
│   ├── AppContext.tsx            # Définition du contexte + provider
│   ├── AppContext.test.tsx       # Tests du provider
│   ├── usageExamples.tsx         # Patterns & exemples
│   └── __tests__/                # Tests additionnels
├── services/
│   ├── loggerService.ts
│   ├── encryptionService.ts
│   ├── keyManagementService.ts
│   ├── auditService.ts
│   ├── businessService.ts
│   ├── validationService.ts
│   └── cacheService.ts
├── components/
│   ├── App.tsx                   # ✅ WRAPPED IN AppProvider
│   ├── Dashboard.tsx             # ✅ Utilise useAppContext
│   ├── InvoiceManager.tsx        # ✅ Utilise useAppContext
│   └── ...
├── hooks/
│   └── useInvoiceCalculations.ts # ✅ Utilise useAppContext si besoin
└── types/
    ├── encryption.ts
    └── ...
```

### Flux d'Initialisation

```
App.tsx
  ↓
<AppProvider userPassphrase={passphrase}>
  ↓
  1. Initialize KeyManagementService
  ↓
  2. Initialize EncryptionService
  ↓
  3. Initialize Other Services
  ↓
  isInitialized = true
  ↓
  Children rendered with context available
  ↓
<Dashboard /> → useAppContext() → les services sont là!
```

### Dépendances Entre Services

```
AppProvider
├── LoggerService (fondation)
├── KeyManagementService
│   └── EncryptionService
│       └── Dexie Hooks (transparent)
├── AuditService
├── BusinessService
├── ValidationService
└── CacheService
```

---

## 🚀 Migration Guide (Étape par Étape)

### Étape 1: Wraper App.tsx

**AVANT**:

```typescript
// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <Sidebar />
          <MainContent />
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
```

**APRÈS**:

```typescript
// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { AppProvider } from './context/AppContext';

export default function App() {
  const [userPassphrase, setUserPassphrase] = useState<string | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider userPassphrase={userPassphrase}>
        <ErrorBoundary>
          {!userPassphrase && <SetupWizard onComplete={setUserPassphrase} />}
          {userPassphrase && (
            <Router>
              <Sidebar />
              <MainContent />
            </Router>
          )}
        </ErrorBoundary>
      </AppProvider>
    </QueryClientProvider>
  );
}
```

### Étape 2: Migrer les Composants

#### Composant Exemple: Dashboard

**AVANT** (Legacy avec imports):

```typescript
import { logger } from '../services/loggerService';
import { encryptionService } from '../services/encryptionService';
import { businessService } from '../services/businessService';

export function Dashboard() {
  useEffect(() => {
    logger.info('Dashboard mounted');
    async function load() {
      const data = await businessService.getDashboardData();
      const testResult = await encryptionService.test();
      // ...
    }
    load();
  }, []); // ❌ Dependencies missing!

  return <div>Dashboard</div>;
}
```

**APRÈS** (Modern avec Context):

```typescript
import { useAppContext } from '../context/AppContext';

export function Dashboard() {
  const { logger, encryption, business } = useAppContext();

  useEffect(() => {
    logger.info('Dashboard mounted');

    async function load() {
      const data = await business.getDashboardData();
      const testResult = await encryption.test();
      // ...
    }

    load();
  }, [logger, encryption, business]); // ✅ Proper dependencies!

  return <div>Dashboard</div>;
}
```

#### Composant Exemple: InvoiceManager

**AVANT**:

```typescript
import { validationService } from '../services/validationService';
import { cacheService } from '../services/cacheService';
import { auditService } from '../services/auditService';

export function InvoiceManager() {
  const [invoice, setInvoice] = useState(null);

  const handleCreate = async () => {
    // Direct imports
    const valid = await validationService.validateInvoice(invoice);
    if (valid) {
      await cacheService.set('invoice', invoice);
      await auditService.log('invoices', 'create', { id: invoice.id });
    }
  };

  return <button onClick={handleCreate}>Create</button>;
}
```

**APRÈS**:

```typescript
import { useAppContext } from '../context/AppContext';

export function InvoiceManager() {
  const { validation, cache, audit, logger } = useAppContext();
  const [invoice, setInvoice] = useState(null);

  const handleCreate = async () => {
    try {
      // Services injectés
      const valid = await validation.validateInvoice(invoice);
      if (valid) {
        await cache.set('invoice', invoice);
        await audit.log('invoices', 'create', { id: invoice.id });
        logger.info('Invoice created:', invoice.id);
      }
    } catch (error) {
      logger.error('Failed to create invoice', error);
    }
  };

  return <button onClick={handleCreate}>Create</button>;
}
```

#### Hooks: useInvoiceCalculations

**AVANT**:

```typescript
import { logger } from '../services/loggerService';
import { businessService } from '../services/businessService';

export function useInvoiceCalculations(invoice: Invoice) {
  const [calculations, setCalculations] = useState(null);

  useEffect(() => {
    try {
      const result = businessService.calculateInvoice(invoice);
      setCalculations(result);
    } catch (error) {
      logger.error('Calculation failed', error); // ❌ Direct import
    }
  }, [invoice]);

  return calculations;
}
```

**APRÈS**:

```typescript
import { useAppContext } from '../context/AppContext';

export function useInvoiceCalculations(invoice: Invoice) {
  const { business, logger } = useAppContext();
  const [calculations, setCalculations] = useState(null);

  useEffect(() => {
    try {
      const result = business.calculateInvoice(invoice);
      setCalculations(result);
    } catch (error) {
      logger.error('Calculation failed', error); // ✅ Injected
    }
  }, [invoice, business, logger]); // ✅ Proper deps

  return calculations;
}
```

### Étape 3: Tester les Composants

**AVANT** (Difficile à tester):

```typescript
// ❌ Il faut mocker les modules entiers
vi.mock('../services/logger Service');
vi.mock('../services/businessService');

const { Dashboard } = await import('./Dashboard');

test('loads data', async () => {
  // Services réels/mockés globalement
});
```

**APRÈS** (Facile à tester):

```typescript
import { render } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import { Dashboard } from './Dashboard';

// ✅ Mock du contexte plutôt que des services
const mockContext = {
  logger: { info: vi.fn(), error: vi.fn() },
  business: { getDashboardData: vi.fn().mockResolvedValue({}) },
  encryption: { test: vi.fn() },
  audit: { log: vi.fn() },
  // ...
};

// ✅ Wrapper helper
function TestWrapper({ children }) {
  return <AppProvider>{children}</AppProvider>;
}

test('loads data', async () => {
  render(
    <TestWrapper>
      <Dashboard />
    </TestWrapper>
  );

  // Test...
});
```

---

## 📊 Services à Migrer

| Service           | Impact      | Priorité | État       |
| ----------------- | ----------- | -------- | ---------- |
| Dashboard         | High impact | 1        | ⏳ Pending |
| InvoiceManager    | High impact | 1        | ⏳ Pending |
| ClientManager     | Medium      | 2        | ⏳ Pending |
| SupplierManager   | Low         | 3        | ⏳ Pending |
| ProductManager    | Low         | 3        | ⏳ Pending |
| AccountingManager | Medium      | 2        | ⏳ Pending |
| SettingsManager   | Low         | 3        | ⏳ Pending |
| AIAssistant       | Medium      | 2        | ⏳ Pending |

---

## 🧪 Testing Patterns

### Test Avec Mock Context

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppContext } from '../context/AppContext';
import { Invoice Manager } from './InvoiceManager';

const mockAppContext = {
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  encryption: {
    initialize: vi.fn(),
    test: vi.fn(),
    encryptField: vi.fn(),
    decryptField: vi.fn(),
  },
  keyManagement: {},
  audit: {
    log: vi.fn(),
    initialize: vi.fn(),
  },
  business: {
    validateInvoice: vi.fn().mockResolvedValue(true),
    createInvoice: vi.fn().mockResolvedValue({ id: 'inv-1' }),
  },
  validation: {},
  cache: {
    set: vi.fn(),
    get: vi.fn(),
  },
  isInitialized: true,
};

describe('InvoiceManager', () => {
  it('should create invoice with logger', async () => {
    const user = userEvent.setup();

    render(
      <AppContext.Provider value={mockAppContext}>
        <InvoiceManager />
      </AppContext.Provider>
    );

    await user.click(screen.getByText('Create'));

    expect(mockAppContext.logger.info).toHaveBeenCalled();
    expect(mockAppContext.audit.log).toHaveBeenCalledWith(
      'invoices',
      'create',
      expect.any(Object)
    );
  });
});
```

---

## ✅ Checklist de Migration

- [ ] AppProvider wrappé dans App.tsx
- [ ] Dashboard compilée avec useAppContext
- [ ] InvoiceManager compilée avec useAppContext
- [ ] ClientManager compilée
- [ ] SupplierManager compilée
- [ ] Tous les hooks migrés
- [ ] Tests mis à jour pour utiliser mock context
- [ ] Aucun import direct de service sauf dans AppContext
- [ ] Build réussit
- [ ] Tests passent
- [ ] E2E tests passent

---

## 🆘 Troubleshooting

### "useAppContext must be used within an <AppProvider>"

**Cause**: Le composant n'est pas wrapped par AppProvider  
**Solution**: Vérifier que App.tsx wraps tous les enfants avec `<AppProvider>`

### Services sous-initialisés

**Cause**: AppProvider n'a pas complété l'initialisation  
**Solution**: Utiliser `useAppInitialization()` pour attendre

```typescript
function SafeComponent() {
  const { isInitialized, error } = useAppInitialization();

  if (!isInitialized && !error) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <YourComponent />;
}
```

### Passphrase non disponible

**Cause**: AppProvider reçoit `undefined` pour `userPassphrase`  
**Solution**: Passer via state ou props:

```typescript
<AppProvider userPassphrase={userPassphrase || undefined}>
  {/* Les services sans passphrase = encryption non disponible */}
</AppProvider>
```

---

## 📈 Metriques de Succès

Après migration complète:

- ✅ 0 import directs de services (sauf dans AppContext)
- ✅ 100% des tests utilisent mock context
- ✅ Aucune prop drilling
- ✅ Rédaction DI explicit et clair
- ✅ Build size unchanged (ou réduit)
- ✅ Performance unchanged ou improving

---

## 📚 Ressources

- [React Context API](https://react.dev/reference/react/useContext)
- [Dependency Injection Pattern](https://en.wikipedia.org/wiki/Dependency_injection)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Testing Library](https://testing-library.com/)
