# 🔐 Architecture de Chiffrement IndexedDB

Guide complet pour comprendre et utiliser le système de chiffrement transparent de MicroGestionFacile.

## 📋 Vue d'ensemble

### Problème

Sans chiffrement, IndexedDB stocke les données en clair:

```javascript
// ❌ IndexedDB sans chiffrement
invoices: [
  {
    id: 'inv-001',
    subtotal: 1000.0, // Visible en clair!
    taxAmount: 200.0, // Visible en clair!
    total: 1200.0, // Visible en clair!
    clientEmail: 'client@example.com', // Visible en clair!
  },
];
```

**Risques**:

- Données accessibles si device volé
- Malware navigateur peut lire IndexedDB
- Backup non sécurisé

### Solution

Chiffrement **AES-GCM 256-bit** des champs sensibles:

```javascript
// ✅ IndexedDB avec chiffrement
invoices: [
  {
    id: 'inv-001',
    subtotal: {
      __encrypted: true,
      __algorithm: 'AES-GCM',
      __keyVersion: 1,
      __iv: 'base64...', // IV aléatoire
      value: 'base64_ciphertext...', // Chiffré!
    },
    taxAmount: {
      /* chiffré */
    },
    total: {
      /* chiffré */
    },
    clientEmail: {
      /* chiffré */
    },
  },
];
```

**Avantages**:

- ✅ Données sécurisées au repos
- ✅ Chifrrement transparent (l'app ne voit que du plaintext)
- ✅ Support rotation de clé
- ✅ Compatible avec Service Worker/PWA

---

## 🏗️ Architecture

### 3 Couches

```
┌─────────────────────────────────────┐
│    Application Code                 │ (App.tsx, components)
│  - Données toujours en plaintext    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  EncryptionService                  │ (src/services/encryptionService.ts)
│  - Chiffre/déchiffre objets         │
│  - Utilise KeyManagementService     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  KeyManagementService               │ (src/services/keyManagementService.ts)
│  - Gère clés dérivées par table     │
│  - Dérivation PBKDF2 + HKDF         │
│  - Stocke métadonnées de clés       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Web Crypto API                     │ (crypto.subtle)
│  - AES-GCM chiffrement natif        │
└─────────────────────────────────────┘
```

### Flux de données

#### Écriture (Create/Update)

```
User Data (plaintext)
  ↓
App calls: db.invoices.add(invoice)
  ↓
Dexie Hook: "creating" → encryptionService.encryptObject()
  ↓
Encryption Service chiffre champs sensibles
  ↓
IndexedDB reçoit le data chiffré
```

#### Lecture (Read)

```
IndexedDB retourne data chiffré
  ↓
Dexie Hook: "reading" → encryptionService.decryptObject()
  ↓
Encryption Service déchiffre les champs
  ↓
App reçoit data plaintext (invisible chiffrement)
```

---

## 🔑 Gestion des Clés

### Dérivation des Clés

```
┌─────────────────────────────────────┐
│  Master Passphrase                  │
│  (Entrée utilisateur)               │
└──────────────┬──────────────────────┘
               │
               ├─ PBKDF2 (310,000 iterations)
               │   Salt: "micro-gestion-facile-salting-key-v2"
               │   Hash: SHA-256
               │
               ▼
        ┌────────────────┐
        │  Master Key    │
        │ (AES-256)      │
        └────────┬───────┘
                 │
                 ├─ HKDF (per-table derivation)
                 │   Salt: "invoices"
                 │   Info: "table-key-invoices"
                 │
                 ▼
        ┌────────────────────┐
        │  Table Keys        │
        │  invoices          │
        │  clients           │
        │  suppliers         │
        │  products          │
        │  expenses          │
        │  userProfile       │
        │  auditLogs         │
        └────────────────────┘
```

### Stockage des Métadonnées

Les métadonnées de clés sont stockées dans IndexedDB dans la table `securityKeys`:

```typescript
{
  id: 'invoices-v1',
  tableName: 'invoices',
  version: 1,
  createdAt: '2024-02-17T10:30:00Z',
  algorithm: 'AES-GCM',
  keyLength: 256,
  derivationMethod: 'PBKDF2-HKDF',
  isActive: true,
  keyData: { /* JsonWebKey */ }
}
```

**Important**: Les `keyData` eux-mêmes NE sont pas re-chiffrés (la clé maître reste en RAM).

---

## 🚀 Initialisation

### 1. Au démarrage de l'app

Dans `src/App.tsx`:

```typescript
import { encryptionService } from './services/encryptionService';
import { keyManagementService } from './services/keyManagementService';

function App() {
  const [initialized, setInitialized] = useState(false);
  const [userPassphrase, setUserPassphrase] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!userPassphrase) return;

      try {
        // 1. Initialiser le service de gestion de clés
        await keyManagementService.initialize(userPassphrase);

        // 2. Initialiser le service de chiffrement
        await encryptionService.initialize(userPassphrase);

        // 3. Initialiser les hooks Dexie
        await initializeEncryptionHooks(db);

        setInitialized(true);
      } catch (error) {
        logger.error('Encryption initialization failed', error);
        // Afficher un message d'erreur à l'utilisateur
      }
    }

    init();
  }, [userPassphrase]);

  if (!initialized) {
    return <LoadingScreen />; // ou prompt pour passphrase
  }

  return <Dashboard />;
}
```

### 2. Récupérer la passphrase utilisateur

Options:

- **Premier lancement**: Créer une nouvelle passphrase (via SetupWizard)
- **Retours**: Prompt pour la passphrase existante
- **Stockage**: JAMAIS en localStorage! Utiliser une variable d'état (RAM)

```typescript
// Example: Setup Wizard
async function handleSetupComplete(passphrase: string) {
  // Stocker en mémoire, JAMAIS en localStorage
  setUserPassphrase(passphrase);

  // Le useEffect dans App.tsx détectera le changement et initialisera
}
```

---

## 🔄 Rotation de Clés

### Pourquoi?

- Conformité de sécurité (NIST recommande rotation mensuelle)
- Mitigation en cas de compromis partiel
- Compliance RGPD (pseudonymisation)

### Comment?

```typescript
async function rotateEncryptionKey(tableName: string) {
  try {
    // 1. Rotation dans KeyManagementService
    await keyManagementService.rotateTableKey(tableName);

    // 2. OPTIONNEL: Re-chiffrer les données existantes
    //    (Ceci est optionnel: les données anciennes restent déchiffrables
    //     car on garde l'historique des clés)

    logger.info(`Key rotated for ${tableName}`);
  } catch (error) {
    logger.error(`Rotation failed for ${tableName}`, error);
  }
}

// Usage (par exemple chaque 30 jours)
setInterval(
  () => {
    rotateEncryptionKey('invoices');
    rotateEncryptionKey('clients');
  },
  30 * 24 * 60 * 60 * 1000
);
```

---

## 📊 Champs Chiffrés par Table

| Table           | Champs Chiffrés                                | Raison                        |
| --------------- | ---------------------------------------------- | ----------------------------- |
| **invoices**    | subtotal, taxAmount, total, clientEmail, notes | Données financières sensibles |
| **clients**     | email, phone, address, city, postalCode        | PII (données personnelles)    |
| **suppliers**   | email, phone, address, bankDetails             | PII + données sensibles       |
| **products**    | -                                              | Non sensibles (prix public)   |
| **expenses**    | description, amount, vendor                    | Données financières           |
| **userProfile** | phone, email, address                          | PII                           |
| **auditLogs**   | -                                              | Non sensibles (pour audit)    |

---

## 🧪 Tests

### Exécuter les tests

```bash
# Tests KeyManagementService
npm test -- keyManagementService

# Tests EncryptionService
npm test -- encryptionService

# Tous les tests crypto
npm test -- encryption
```

### Vérifier les données chiffrées en IndexedDB

Depuis la console du navigateur:

```javascript
// Ouvrir IndexedDB
const db = await new Promise((resolve, reject) => {
  const req = indexedDB.open('MicroGestionDB');
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

// Lire les données
const tx = db.transaction('invoices', 'readonly');
const store = tx.objectStore('invoices');
const invoices = await new Promise((resolve, reject) => {
  const req = store.getAll();
  req.onsuccess = () => resolve(req.result);
});

// Vérifier que les données sont chiffrées
console.log(JSON.stringify(invoices[0], null, 2));
// Devrait afficher: __encrypted: true, value: "base64_cyphertext"
```

---

## ⚠️ Considérations de Sécurité

### ✅ Points forts

- **Chiffrement de bout en bout**: Pas d'envoi vers serveur
- **Clé dérivée du mot de passe**: Contrôlée par utilisateur
- **Standards NIST**: AES-GCM, PBKDF2, HKDF
- **IV aléatoire**: Chaque chiffrement produit un ciphertext différent
- **Clé maître en RAM**: Jamais sérialisée
- **Historique de clés**: Support rotation sans perte

### ⚠️ Limitations

- **Sécurité du mot de passe**: Fort comme le passphrase utilisateur
  - Recommander: 15+ caractères, mélange de types
- **Pas de protection contre malware navigateur**: Web Crypto API assure confidentialité mais pas intégrité
- **Données en mémoire**: Un XSS podrait voler les données plaintext
  - **Mitigation**: CSP stricte, HTTPS, valider les inputs
- **Pas de mécanisme de revocation**: Si device volé, changer mot de passe sur Cloud

---

## 🔗 Intégration avec la PWA

### Service Worker

Le Service Worker:

- ✅ Cache les données chiffrées (sûr)
- ✅ Synchronise avec serveur (via API)
- ✅ Restore les données déchiffrées après sync

```typescript
// Dans le Service Worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-invoices') {
    event.waitUntil(
      // Les données sont déjà chiffrées dans IndexedDB
      // Sync envoie le chiffré au serveur (optionnel backup)
      fetch('/api/backup', {
        method: 'POST',
        body: JSON.stringify(encryptedBackup),
      })
    );
  }
});
```

---

## 📝 Checklist de Sécurité

Avant d'aller en production:

- [ ] Tests de rotation de clé
- [ ] Tests de migration de données non-chiffrées → chiffrées
- [ ] Tests de recovery après device loss
- [ ] Audit de sécurité externe (Web Crypto)
- [ ] Documentation passphrase recovery
- [ ] Plan de gestion des keys (archivage historique)
- [ ] Tests d'intégration PWA + chiffrement
- [ ] Monitoring des échecs de déchiffrement

---

## 🆘 Troubleshooting

### "Cannot decrypt data - corrupted or wrong master key"

**Cause**: IV ou ciphertext corrompu  
**Solution**: Les données ne peuvent pas être récupérées (intégrité compromise)

### "Encryption service not initialized"

**Cause**: `encryptionService.initialize()` pas appelé  
**Solution**: Vérifier que init est appelé avant d'utiliser l'app

### Performance dégradée avec beaucoup de données

**Cause**: Chiffrement/déchiffrement sur le thread principal  
**Solution**: Utiliser Web Workers pour les opérations de masse

```typescript
// Futur: Worker pour bulk operations
const worker = new Worker('crypto-worker.js');
worker.postMessage({ action: 'encryptBatch', invoices });
```

---

## 📚 Références

- [Web Crypto API Spec](https://www.w3.org/TR/WebCryptoAPI/)
- [NIST SP 800-38D (AES-GCM)](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [OWASP - Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [MDN - crypto.subtle](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
