# 📚 Guide d'Intégration des Services d'Amélioration

Ce guide explique comment intégrer et utiliser les nouveaux services de stabilité, sécurité et conformité.

## 🚀 Démarrage Rapide (5 minutes)

### 1. Initialisation App.tsx (Déjà Fait ✅)

**L'ErrorBoundary et les services sont maintenant initialisés automatiquement :**

```tsx
// ✅ Déjà intégré
import { ErrorBoundary } from './components/ErrorBoundary';
import { logger } from './services/loggerService';
import { encryptionService } from './services/encryptionService';

// ✅ App.tsx initialise:
// - Logger (centralisé)
// - Encryption (chiffrement auto)
// - Backup (sauvegardes auto)
```

### 2. Disponibilité Immédiate

**Les services sont maintenant disponibles partout :**

```tsx
// Dans n'importe quel composant/service
import { logger } from '../services/loggerService';
import { cacheService } from '../services/cacheService';
import { auditService } from '../services/auditService';

// Utilisation directe
logger.info('Mon message');
cacheService.invalidate('some-key');
auditService.logAction(...);
```

---

## 📋 Usage par Service

### **1. Logger Service (Logging Centralisé)**

#### Configuration

```tsx
// ✅ Déjà initialisé dans App.tsx
// Aucune configuration supplémentaire nécessaire
```

#### Utilisation

```tsx
import { logger } from '../services/loggerService';

// Logs de différents niveaux
logger.info('Application started');
logger.warn('Battery low', { battery: 15 });
logger.error('Failed to save', error, { invoiceId: 'inv-123' });
logger.debug('Cache hit', { key: 'invoices' });

// Exporter les logs pour support
const logsJson = logger.exportLogs();
const blob = new Blob([logsJson], { type: 'application/json' });
// → Envoyer à support ou sauvegarder localement
```

#### Avantages

- ✅ Historique centralisé (500 derniers logs)
- ✅ Logs en production (pas de console.log)
- ✅ Export pour debugging
- ✅ Contexte structuré

### **2. Error Boundary**

#### Intégration (Déjà Fait ✅)

```tsx
// ✅ Déjà enveloppe App.tsx
<ErrorBoundary>{/* Application */}</ErrorBoundary>
```

#### Que Attrape

- ✅ Erreurs de rendu React
- ✅ Erreurs dans les lifecycles
- ✅ Erreurs dans les event handlers
- ❌ N'attrape PAS les erreurs async (voir useAsync)

#### Logs Automatiques

```tsx
// Chaque erreur non capturée est loggée
// → Voir les logs avec logger.getLogs()
```

---

### **3. Async Hook (Gestion des Promesses)**

#### Installation dans un Composant

```tsx
import { useAsync } from '../hooks/useAsync';

const MyComponent = () => {
  const { data, isLoading, error, execute } = useAsync({
    retryCount: 2,
    retryDelay: 1000,
    showToast: true, // Affiche succès/erreur
    onSuccess: (data) => console.log('Success!', data),
    onError: (error) => console.error('Failed', error),
  });

  const loadData = async () => {
    await execute(() => db.invoices.toArray(), 'Chargement factures');
  };

  return (
    <button onClick={loadData} disabled={isLoading}>
      {isLoading ? 'Chargement...' : 'Charger'}
    </button>
  );
};
```

#### Avantages

- ✅ Retry automatique (configurable)
- ✅ Toast feedback UI
- ✅ Gestion d'erreurs centralisée
- ✅ État loading/error/data

---

### **4. Cache Service (Optimisation Performance)**

#### Utilisation Simple

```tsx
import { cacheService } from '../services/cacheService';

// Cache 5 minutes par défaut
const invoices = await cacheService.getOrFetch('invoices', () => db.invoices.toArray());

// Cache personnalisé (10 min)
const clients = await cacheService.getOrFetch('clients', () => db.clients.toArray(), {
  ttl: 10 * 60 * 1000,
});

// Forcer refresh
const freshData = await cacheService.getOrFetch('invoices', () => db.invoices.toArray(), {
  forceRefresh: true,
});
```

#### Débouncing (Formulaires)

```tsx
const handleSaveInvoice = async (invoice: Invoice) => {
  // Attendre 500ms après la dernière modification
  // Puis sauvegarder une seule fois
  await cacheService.debountOperationAsync('invoice-save', () => db.invoices.put(invoice), 500);
};
```

#### Invalidation (Important)

```tsx
// Quand les données changent, invalider le cache
await db.invoices.add(newInvoice);
cacheService.invalidate(['invoices', 'dashboard']); // Invalider plusieurs clés

// Ou tout le cache
cacheService.clear();
```

#### Stats

```tsx
const { cacheSize, activeTimers } = cacheService.getStats();
console.log(`Cache: ${cacheSize} entrées, ${activeTimers} timers actifs`);
```

---

### **5. Validation Service (Anti-Corruption)**

#### Valider une Donnée

```tsx
import { validationService } from '../services/validationService';
import { InvoiceSchema } from '../types';

// Au chargement
const result = await validationService.validateData(
  loadedData,
  InvoiceSchema,
  'invoice-123',
  'Invoice'
);

if (result.valid) {
  console.log('Data OK', result.data);
} else {
  logger.warn('Data corrupted', { errors: result.errors });
  // Isoler ou supprimer les données corrompues
}
```

#### Batch Validation

```tsx
const { valid, invalid } = await validationService.validateDataBatch(
  invoices,
  InvoiceSchema,
  'Invoice'
);

console.log(`Loaded ${valid.length}, ${invalid.length} corrupted`);
// Afficher les données corrupted à l'utilisateur
```

---

### **6. Encryption Service (Sécurité)**

#### Initialisation (Déjà Fait ✅)

```tsx
// ✅ Déjà dans App.tsx
await encryptionService.initialize(userId);
```

#### Chiffrer Données Sensibles

```tsx
import { encryptionService } from '../services/encryptionService';

// Chiffrer
const sensitiveData = { apiKey: 'sk-xxx', password: 'secret' };
const encrypted = await encryptionService.encrypt(sensitiveData);
// Le résultat est une string Base64 à stocker en IndexedDB

// Déchiffrer
const decrypted = await encryptionService.decrypt<typeof sensitiveData>(encrypted);
console.log(decrypted.apiKey); // sk-xxx
```

#### Storer les Clés API

```tsx
// ❌ Éviter
localStorage.setItem('gemini_key', 'sk-xxx');

// ✅ À faire
const encrypted = await encryptionService.encrypt({ key: 'sk-xxx' });
await db.securityKeys.add({
  id: 'gemini',
  keyData: encrypted,
  createdAt: new Date().toISOString(),
});

// Récupérer
const stored = await db.securityKeys.get('gemini');
const { key } = await encryptionService.decrypt(stored.keyData);
```

---

### **7. Audit Service (Conformité RGPD)**

#### Log une Action

```tsx
import { useAudit } from '../hooks/useAudit';
import { AuditAction } from '../services/auditService';

const MyComponent = () => {
  const { logCreate, logUpdate, logDelete } = useAudit();

  const handleCreateInvoice = async (invoice: Invoice) => {
    await db.invoices.add(invoice);
    logCreate('Invoice', invoice.id, { total: invoice.total });
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    await db.invoices.delete(invoiceId);
    logDelete('Invoice', invoiceId, { reason: 'User deletion' });
  };
};
```

#### Consulter les Logs

```tsx
import { auditService } from '../services/auditService';

// Tous les logs
const allLogs = await auditService.getAuditLogs();

// Filtrer par type
const invoiceChanges = await auditService.getAuditLogs({
  resourceType: 'Invoice',
  limit: 50,
});

// Par action et période
const deletions = await auditService.getAuditLogs({
  action: AuditAction.DELETE,
  startDate: '2025-02-01',
  endDate: '2025-02-28',
});
```

#### RGPD - Export Complet

```tsx
// Exporter tous les logs (droit à l'information)
const auditJson = await auditService.exportAuditLog();
const blob = new Blob([auditJson], { type: 'application/json' });
// Télécharger ou envoyer à l'utilisateur
```

---

### **8. Backup Service Amélioré**

#### Créer un Backup Complet

```tsx
import { improvedBackupService } from '../services/improvedBackupService';

const backup = await improvedBackupService.createBackup();
// backup.data → String Base64 compressée
// backup.metadata → Checksum SHA-256, item counts, etc.
```

#### Exporter en Fichier

```tsx
const blob = await improvedBackupService.exportBackupFile();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
a.click();
```

#### Restaurer depuis Fichier

```tsx
const handleImport = async (file: File) => {
  const result = await improvedBackupService.importBackupFile(file);

  if (result.success) {
    toast.success(`Importé: ${result.itemCounts.invoices} factures`);
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach((w) => toast.warning(w));
  }
};
```

---

### **9. Migration Service (Évolutivité)**

#### Créer une Migration

```tsx
import { migrationService, Migration } from '../services/migrationService';

const migrationV5: Migration = {
  version: 5,
  name: 'Add invoice notes field',
  up: async () => {
    const invoices = await db.invoices.toArray();
    await db.invoices.bulkPut(
      invoices.map((inv) => ({
        ...inv,
        notes: '', // Nouveau champ
      }))
    );
  },
  down: async () => {
    // Rollback si nécessaire
    const invoices = await db.invoices.toArray();
    await db.invoices.bulkPut(
      invoices.map(({ notes, ...rest }) => rest) // Supprimer notes
    );
  },
};

// Appliquer toutes les migrations au démarrage
const result = await migrationService.runMigrations([migrationV5]);
if (!result.success) {
  result.errors.forEach((err) => logger.error(err));
}
```

---

## 🔨 Patterns Recommandés

### **Pattern 1: Opération Complète (Async + Audit + Cache)**

```tsx
const handleCreateInvoice = async (invoice: Invoice) => {
  const { execute } = useAsync();
  const { logCreate } = useAudit();

  await execute(async () => {
    // Sauvegarder
    await db.invoices.add(invoice);

    // Logger l'action
    logCreate('Invoice', invoice.id, { total: invoice.total });

    // Invalider le cache
    cacheService.invalidate('invoices');

    // Logger pour monitoring
    logger.info('Invoice created', { invoiceId: invoice.id });
  }, 'Création facture');
};
```

### **Pattern 2: Affichage sécurisé**

```tsx
const InvoiceList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { valid, invalid } = await validationService.validateDataBatch(
        await db.invoices.toArray(),
        InvoiceSchema,
        'Invoice'
      );

      setInvoices(valid);
      setValidationErrors(invalid.map(i => `Item #${i.index}`));
    })();
  }, []);

  return (
    <>
      {validationErrors.length > 0 && (
        <Alert variant="warning">
          {validationErrors.length} enregistrements corrompus détectés
        </Alert>
      )}
      {/* Afficher les bonnes données */}
      {invoices.map(inv => (...))}
    </>
  );
};
```

---

## ✅ Checklist d'Implémentation

- [x] Logger Service intégré
- [x] Error Boundary ajouté
- [x] Encryption Service initialisé
- [x] App.tsx mis à jour
- [ ] Remplacer les `console.log()` par `logger.*`
- [ ] Ajouter validation Zod à la lecture des données
- [ ] Intégrer useAsync dans les composants avec API calls
- [ ] Ajouter audit logs aux actions importantes
- [ ] Tester la restauration de backups
- [ ] Faire un test du chiffrement
- [ ] Documenter les migrations futures

---

## 💡 Bonnes Pratiques

### Logging

```tsx
// ❌ Mauvais
console.log('Invoice saved');

// ✅ Bon
logger.info('Invoice saved successfully', { invoiceId, total });
```

### Erreurs Async

```tsx
// ❌ Sans gestion
const data = await db.invoices.toArray();

// ✅ Avec gestion
try {
  const data = await db.invoices.toArray();
} catch (error) {
  logger.error('Failed to load invoices', error);
  // Utiliser le toast ou ErrorBoundary
}
```

### Cache

```tsx
// ❌ Pas de cache
const clients = await db.clients.toArray();
const suppliers = await db.suppliers.toArray();

// ✅ Avec cache intelligent
const clients = await cacheService.getOrFetch('clients', () => db.clients.toArray());
const suppliers = await cacheService.getOrFetch('suppliers', () => db.suppliers.toArray());
```

---

## 🆘 Troubleshooting

### "Encryption service not initialized"

**Cause** : Service utilisé avant App.tsx initialization  
**Solution** : Attendre le useEffect dans App.tsx

```tsx
// ❌ Mauvais
useEffect(() => {
  encryptionService.encrypt(data); // Peut échouer
}, []);

// ✅ Bon
useEffect(() => {
  // Garder encryptionService en dernier dans App.tsx
}, []);
```

### "Cache miss after 5 minutes"

**Cause** : TTL par défaut = 5 min  
**Solution** : Augmenter ou invalider manuellement

```tsx
await cacheService.getOrFetch(
  'key',
  fn,
  { ttl: 30 * 60 * 1000 } // 30 min
);
```

---

## 📞 Questions?

Tous les services incluent du logging détaillé. Activer les devtools et vérifier la console pour debug.

```tsx
// Afficher les stats globales
console.log('Logs:', logger.getLogs());
console.log('Cache:', cacheService.getStats());
console.log('Migration:', migrationService.getLastApplied());
```

---

**Dernière mise à jour** : 17 février 2026  
**Version du Guide** : 1.0
