# 🔐 Politique de Sécurité

## 🎯 Modèle de Sécurité

**Micro-Gestion Facile** est une Progressive Web App (PWA) qui privilégie la **confidentialité locale** :

- ✅ Toutes les données sont stockées localement (IndexedDB)
- ✅ Aucune transmission de données vers des serveurs tiers
- ✅ Chiffrement des données sensibles (RIB, IBAN)
- ✅ Clés API configurables par l'utilisateur

## 🔒 Chiffrement des Données

### Données Sensibles

Les informations bancaires (RIB, IBAN) sont chiffrées avec **AES-256-GCM** via la Web Crypto API :

```typescript
// Chiffrement automatique dans securityService.ts
const encrypted = await securityService.encrypt(iban);
```

### Clé de Chiffrement

- ⚠️ La clé maître est stockée dans IndexedDB (non localStorage)
- 🔐 Généré automatiquement au premier lancement
- 💡 Pour plus de sécurité, l'utilisateur peut définir un mot de passe maître (dérivation PBKDF2)

### Recommandations

1. **Ne jamais commiter** de clés API ou données sensibles dans Git
2. **Utiliser `.env.local`** pour les secrets en développement (ignoré par Git)
3. **Activer le chiffrement de disque** du système d'exploitation
4. **Sauvegarder régulièrement** les données (export chiffré)

## 🔑 Gestion des Clés API

### Gemini AI (Optionnel)

La clé API Gemini est utilisée uniquement pour l'assistant IA.

**Configuration recommandée** :

1. Créer une clé avec **quotas limités** sur [Google AI Studio](https://ai.google.dev/)
2. La configurer dans l'application : **Paramètres > Assistant IA**
3. La clé est stockée chiffrée dans IndexedDB

**En développement** :

```env
# .env.local (pas commité)
GEMINI_API_KEY=votre_cle_dev_ici
```

**En production** :

- L'utilisateur configure sa propre clé via l'interface
- Pas de clé côté serveur (architecture serverless)

## 🛡️ Audit Trail

Tous les accès aux données sensibles sont journalisés :

```typescript
await securityService.decrypt(encryptedRIB, {
  resourceType: 'supplier',
  resourceId: supplier.id,
  action: 'view_banking_info',
});
```

Les logs sont **immuables** et stockés dans `db.auditLogs`.

## 🚨 Vulnérabilités Connues

### Limitations de la Sécurité Côté Client

⚠️ **Clé API dans le Bundle** : Bien que la clé soit configurable par l'utilisateur, une clé par défaut (dev) est présente dans le bundle. Cette clé doit avoir des **quotas très limités**.

**Mitigation** :

- Ne pas utiliser de clé de production par défaut
- Forcer l'utilisateur à configurer sa propre clé
- Implémenter un rate limiting côté serveur (future amélioration)

### Stockage Local

Les données sont en clair dans IndexedDB (sauf RIB/IBAN chiffrés). Un attaquant ayant un accès physique au poste peut :

- Extraire la base de données
- Accéder aux factures et clients

**Mitigation** :

- Chiffrer l'intégralité de la base (future amélioration)
- Utiliser un mot de passe maître (PBKDF2)
- Activer le chiffrement du disque système (BitLocker, FileVault)

## 📋 Bonnes Pratiques Utilisateurs

1. **Navigateur à jour** : Utiliser Chrome/Edge/Firefox récents
2. **HTTPS obligatoire** : Ne jamais accéder via HTTP en production
3. **Exports réguliers** : Sauvegarder vos données mensuellement
4. **Sécurité physique** : Verrouiller votre session quand vous vous absentez
5. **Clés API personnelles** : Ne jamais partager vos clés API

## 🐛 Signaler une Vulnérabilité

Si vous découvrez une faille de sécurité :

1. **Ne pas** créer d'issue publique
2. Contacter par email : [votre-email@example.com]
3. Fournir un maximum de détails :
   - Description de la vulnérabilité
   - Impact potentiel
   - Étapes de reproduction
   - Version de l'application

**Délai de réponse** : Sous 48h

## 🔄 Mises à Jour de Sécurité

| Date    | Version | Patch                                                                                    |
| ------- | ------- | ---------------------------------------------------------------------------------------- |
| 2026-02 | 0.0.0   | Version initiale                                                                         |
| 2026-02 | 0.0.1   | **Corrections qualité et accessibilité**: Variables inutilisées, aria-labels, conditions |

## 🔧 Corrections Récentes (18 février 2026)

### Améliorations de Qualité du Code

#### 1. **Variables Inutilisées - BACKUP_TEST_SCRIPT.js** ✅

- **Problème** : Variables `improvedBackupService`, `db`, `logger` déclarées avec portée limitée dans le bloc try
- **Impact** : CodeQL alerte, code incompréhensible, potentiel bogue de refactorisation
- **Solution** : Déclaration avec `let` en dehors du bloc try, assignation à l'intérieur
- **Fichier** : `BACKUP_TEST_SCRIPT.js` (lignes 17-30)

#### 2. **Accessibilité - Bouton sans Label - src/App.tsx** ✅

- **Problème** : Bouton menu mobile sans texte discernable
- **Impact** : Non-conformité WCAG, lecteurs d'écran ne peuvent pas identifier le bouton
- **Solution** : Ajout de `aria-label="Ouvrir le menu"` au bouton
- **Fichier** : `src/App.tsx` (ligne 167)
- **Standard** : axe rule `button-name`

#### 3. **Condition Triviale - tests/fixtures/auth.fixture.ts** ✅

- **Problème** : `.catch(() => false)` crée une ambiguïté pour l'analyseur statique
- **Impact** : CodeQL ne peut pas tracer le flux de contrôle correctement
- **Solution** : Remplacement par blocs `try-catch` explicites
- **Fichier** : `tests/fixtures/auth.fixture.ts` (lignes 64-84)

### Bénéfices

✅ **Qualité du code** : Élimination des smells qui peuvent masquer des bugs  
✅ **Accessibilité** : Conformité WCAG pour tous les utilisateurs  
✅ **Maintenabilité** : Code plus explicite et lisible pour les analyseurs et outils  
✅ **Analyse statique** : Réduction des fausses alertes CodeQL

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [RGPD - CNIL](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)

## ✅ Checklist Sécurité Déploiement

Avant de déployer en production :

- [ ] `.env` et `.env.local` dans `.gitignore`
- [ ] Pas de clé API de production dans le code
- [ ] HTTPS activé sur le domaine
- [ ] Service Worker configuré
- [ ] Headers de sécurité (CSP, HSTS) sur le serveur
- [ ] Audit npm (`npm audit`)
- [ ] Tests de sécurité passés
- [ ] Documentation utilisateur à jour

---

**Dernière mise à jour** : 18 février 2026
