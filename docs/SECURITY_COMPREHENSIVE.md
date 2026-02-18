# 🔒 SECURITY & COMPLIANCE GUIDE

## 📋 Table des Matières

1. [Menaces Identifiées & Mitigations](#🎯-menaces-identifiées)
2. [Données Sensibles](#📦-données-sensibles)
3. [Authentification & Autorisation](#🔐-authentification)
4. [Chiffrement & Cryptographie](#🔑-chiffrement)
5. [Conformité RGPD & Fiscale](#📜-conformité)
6. [Procédures de Sécurité](#⚡-procédures)

---

## 🎯 Menaces Identifiées & Mitigations

### 1. **Injection XSS (Cross-Site Scripting)**

| Risque                                | Mitigation                              | Implémentation         |
| ------------------------------------- | --------------------------------------- | ---------------------- |
| Code malveillant dans les formulaires | Validation/sanitization Zod             | `validationService.ts` |
| Injection dans le DOM                 | Pas de `innerHTML`                      | React empêche natif    |
| Template injection                    | Utiliser `dangerouslySetInnerHTML` rare | À auditer cas par cas  |

**Checklist**:

- ✅ Tout input utilisateur passe par `<input>` React
- ✅ Validation Zod sur tous les champs
- ✅ Pas de `eval()` ou `new Function()`
- ❌ À vérifier: PDFs générés (jsPDF)

### 2. **Accès Non Autorisé aux Données IndexedDB**

| Risque                            | Mitigation               | Implémentation                   |
| --------------------------------- | ------------------------ | -------------------------------- |
| Accès direct IndexedDB en console | Chiffrement au repos     | `encryptionService.ts`           |
| Vol via Service Worker            | Chiffrement des données  | Web Crypto API                   |
| Dump du navigateur                | Pas de stockage en clair | localStorage → IndexedDB chiffré |

**Checklist**:

- ✅ Données sensibles chiffrées (AES-256-GCM)
- ✅ Local Storage ne contient plus de données
- ✅ IndexedDB validé au chargement (Zod)
- ⚠️ À tester: Devtools access par attaquant

### 3. **Corruption de Données Lors de la Migration**

| Risque                         | Mitigation             | Implémentation         |
| ------------------------------ | ---------------------- | ---------------------- |
| Perte d'historique de factures | Backup avant migration | `migrationService.ts`  |
| Schéma corrompu                | Validation stricte     | `validationService.ts` |
| Données orphelines             | Transactions sûres     | Dexie transactions     |

**Checklist**:

- ✅ `Migration.down()` pour rollback
- ✅ Tests de migration en QA
- ✅ Backup auto avant update schema
- ⚠️ À documenter: Version upgrade path

### 4. **Fuite d'API Keys**

| Risque                           | Mitigation             | Implémentation               |
| -------------------------------- | ---------------------- | ---------------------------- |
| Clé Gemini en clair dans le code | Env variables          | `VITE_GEMINI_API_KEY`        |
| Clé exposée dans git             | Gitignore `.env.local` | `.gitignore` ✅              |
| Clé dans les logs                | Masquer les clés       | `logger.ts` - redact secrets |
| Clé interceptée en transit       | HTTPS/TLS              | Production only              |

**Checklist**:

- ✅ Clés en `.env.local` (gitignored)
- ✅ Pas de secrets dans le code source
- ✅ Logs ne contiennent pas les clés
- ✅ Rotation tous les 6 mois
- ⚠️ À implémenter: Token masking dans logs

### 5. **Attaque par Force Brute (Hors scope PWA)**

| Risque                   | Mitigation                | Notes                        |
| ------------------------ | ------------------------- | ---------------------------- |
| Aucune auth actuellement | Application offline-first | Pas d'API d'authentification |
| Futur SI backend         | Rate limiting + CAPTCHA   | À implémenter ultérieurement |

---

## 📦 Données Sensibles

### Classification

```
CONFIDENTIALITÉ: TRÈS HAUT (Données Métier)
├── Factures (CA, clients, montants)
├── Clients (noms, contacts, données commerce)
├── Dépenses (détails financiers)
├── Produits & Tarifs
└── Configuration utilisateur

CONFIDENTIALITÉ: CRITIQUE (Tokens & Clés)
├── API Keys (Gemini)
├── Encryption Master Key
├── S3 Credentials
└── Tokens d'authentification

CONFORMITÉ: IMPORTANT (Audit & Traces)
├── Audit logs (crée, modifié, supprimé)
├── Migration history
└── Backup metadata
```

### Stockage

```
IndexedDB (Chiffré):
- Invoices
- Clients
- Suppliers
- Expenses
- Products
- User Profile

IndexedDB (Clé chiffré AES-256):
- Security Keys (API keys)
- Encryption Seeds

LocalStorage (Clé uniquement):
- User Preferences
- Theme (dark/light)

PAS de localStorage:
❌ API Keys
❌ User Tokens
❌ Financial Data
```

---

## 🔐 Authentification

### Modèle Actuel (Offline-First)

```
┌─────────────────────┐
│  Utilisateur Local  │
│  (Offline PWA)      │
└────────┬────────────┘
         │
         ├─→ IndexedDB (chiffré)
         ├─→ Audit Logs
         └─→ Backups Locaux

Pas de Backend = Pas d'auth centralisée
Données = 100% locales (RGPD ✅)
```

### Modèle Futur (Si Backend Ajouté)

```
Recommandations:
1. OAuth 2.0 / OpenID Connect
2. JWT tokens (short-lived)
3. Refresh tokens (long-lived, httpOnly)
4. PKCE pour mobile
5. Rate limiting (5 req/min par IP)
6. Logging de tous les accès
```

---

## 🔑 Chiffrement & Cryptographie

### Web Crypto API (Natif)

```typescript
✅ UTILISER:
- AES-GCM (chiffrement symétrique)
- PBKDF2 (dérivation clé)
- SHA-256 (hashing intégrité)
- crypto.getRandomValues() (IV aléatoire)

❌ ÉVITER:
- Base64 pour sécurité ← Encodage seulement
- Clés = strings ← CryptoKey objects
- IV fixe ← Aléatoire pour chaque opération
```

### Implémentation Actuelle

**Voir**: `encryptionService.ts`

```typescript
// ✅ Correct
const encrypted = await encryptionService.encrypt(sensitiveData);
// → Utilise AES-GCM + IV aléatoire

// ✅ Correct
const decrypted = await encryptionService.decrypt(encrypted);
// → Valide le IV + déchiffre

// ❌ Mauvais
const key = 'my-secret-123'; // String brut

// ✅ Bon
const key = await crypto.subtle.importKey(...);
```

### Cycle de Vie de la Clé

```
Création:
  ↓
PBKDF2 (100k iterations, salt)
  ↓
AES-256-GCM Key
  ↓
Stockée en RAM uniquement
(Jamais persistée en clair)
  ↓
Dérivée à chaque session depuis User ID
```

---

## 📜 Conformité RGPD & Fiscale

### RGPD

#### Droit d'Accès

```typescript
// Export toutes les données utilisateur
const userData = await improvedBackupService.exportBackupFile();
// → Envoyer à l'utilisateur dans les 30 jours
```

#### Droit à l'Oubli

```typescript
// Suppression complète
await db.invoices.clear();
await db.clients.clear();
await db.suppliers.clear();
await db.expenses.clear();
await db.userProfile.clear();

// Les logs d'audit restent (preuve légale)
// Une fois ans de rétention = purger
```

#### Droit à la Portabilité

```typescript
// Export en JSON standard
const backup = await improvedBackupService.exportBackupFile();
// → Format compressé, checksummed
```

#### Privacy by Design

- ✅ Données locales (0 upload)
- ✅ Chiffrement optionnel des clés API
- ✅ Pas de tracking utilisateur
- ✅ Audit logs pour traces
- ❌ Pas de cookies tiers

### Fiscalité Française

#### Obligations Comptables

```
Seuils TVA 2026:
- Micro-entrepreneur: 36.800€ CA annuel
- Real regime: 91.900€ CA annuel
  → Dépassement = passage obligatoire

Facturation:
- Numérotation continue (obligatoire)
- Horodatage préservé ← Date facture immuable
- Metadata: Client, montant, TVA

Export FEC (Fichier d'Écritures Comptables):
- Voir: accountingService.ts
- Format XML/CSV
- Accepté par administration
```

#### Conformité Checksums

```typescript
// Chaque facture PDF a un hash d'intégrité
const backup = await improvedBackupService.createBackup();
console.log(backup.metadata.checksumSHA256);
// → Stocké en base pour audit
```

---

## ⚡ Procédures

### Incident de Sécurité

#### 1. Suspicion de Fuite API Key

```bash
# IMMEDIATE:
1. Roter la clé sur aistudio.google.com
2. Mettre à jour .env avec nouvelle clé
3. Déployer app update

# LOGGING:
logger.warn('API Key rotation initiated', {
  reason: 'Security incident',
  timestamp: new Date().toISOString(),
});

await auditService.logAction(
  AuditAction.API_KEY_CHANGE,
  'Security',
  undefined,
  { incidentType: 'key rotation' }
);

# MONITORING:
- Vérifier les logs S3 (access logs)
- Vérifier Sentry pour requestsanormales
- Alerter l'utilisateur (toast)
```

#### 2. Données Corrompues Détectées

```bash
# ISOLATION:
// Données invalides identifiées via Zod
// → Afficher alerte utilisateur
// → Consulter les logs d'audit

# RECOVERY:
1. Proposer restore depuis backup
2. Invalider le cache
3. Logger l'incident: auditService.logAction(...)
4. Notifier support

# VERIFICATION:
await improvedBackupService.restoreBackup(
  backupData,
  metadata
);
// → Valide checksum automatiquement
```

### Rotation des Secrets

#### Planning

```
Tous les secrets:
□ Trimestre 1: S3 Credentials (90j)
□ Trimestre 2: Gemini API Key (180j)
□ Trimestre 3: Master Encryption (180j)
□ Trimestre 4: Sentry DSN (review)

Post-rotation:
1. Ajouter la nouvelle clé
2. Tester intégration
3. Déployer en staging
4. Déployer en prod
5. Vérifier les logs
6. Supprimer l'ancienne clé
```

### Backup & Restore Testing

#### Mensuel

```bash
# 1. Créer un backup
npm run backup

# 2. Simuler une corruption
# (optionnel: modifier les données)

# 3. Tester la restauration
npm run test:restore

# 4.Logger le test
await auditService.logAction(
  AuditAction.BACKUP,
  'backup',
  undefined,
  { type: 'monthly test', success: true }
);
```

---

## 🛡️ Checklist Sécurité Pré-Déploiement

### Code Review

- [ ] Aucune clé API en clair dans le code
- [ ] Aucun `console.log()` de données sensibles
- [ ] Validation Zod sur tous les inputs
- [ ] Pas d'accès direct SQL/BD (n/a - offline)
- [ ] Error handling complèt (ErrorBoundary + try/catch)
- [ ] Encryption testée et validée

### Tests de Sécurité

- [ ] npm run test:coverage (>80%)
- [ ] npm run lint (0 errors)
- [ ] npm run type-check (strict mode)
- [ ] npm audit (0 vulnerabilities)
- [ ] Test backup/restore complet
- [ ] Test de la corruption de données

### Configuration

- [ ] .env.local gitignored
- [ ] Tous les secrets en variables d'env
- [ ] HTTPS/TLS en production
- [ ] CSP headers configurés (si backend)
- [ ] CORS configuré (si API)
- [ ] Sentry alerts activées

### Monitoring

- [ ] Logs centralisés (Sentry ou ELK)
- [ ] Error tracking en place
- [ ] Performance monitoring (Web Vitals)
- [ ] Alertes configurées
- [ ] On-call rotation établie

---

## 📚 Ressources

### Documentation

- [MDN: Security Best Practices](https://developer.mozilla.org/en-US/docs/Glossary/OWASP)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [RGPD & Privacy](https://ec.europa.eu/info/law/law-topic/data-protection_en)

### Fichiers Projet

- `encryptionService.ts` - Cryptography
- `validationService.ts` - Input validation
- `auditService.ts` - Compliance logging
- `loggerService.ts` - Security logging

---

## ✅ Signature de Conformité

Document validé le: **17 février 2026**  
Version: **1.0**  
Responsable: **Architecture Security**

---

**Questions de sécurité?**  
Créer un issue privé sur le repo ou contacter: security@micro-gestion.fr
