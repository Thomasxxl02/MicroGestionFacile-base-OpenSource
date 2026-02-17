# 🔧 Configuration GitHub - Guide Complet

Ce guide vous explique comment configurer votre dépôt GitHub pour une meilleure gouvernance et sécurité.

## 📋 Table des Matières

1. [Protections de Branches](#protections-de-branches)
2. [Dependabot](#dependabot)
3. [CodeQL](#codeql)
4. [Variables d'Environnement](#variables-denvironnement)

---

## 🛡️ Protections de Branches

Les protections de branches empêchent les changements non validés. Voici comment les configurer :

### Pour la branche `main` (production)

1. **Accédez à** : https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource/settings/branches
2. **Cliquez sur** "Add rule" → Entrez `main`
3. **Activez les options** :

   ✅ **Require a pull request before merging**
   - Nombre de revues : **1** (vous pouvez ajuster)
   - Dismiss stale pull request approvals : ✅
   - Require code review from code owners : ✅ (optionnel)

   ✅ **Require status checks to pass before merging**
   - Recherchez et sélectionnez :
     - `ci / lint-and-test` (ou votre workflow CI)
     - `ci / build`
   - Require branches to be up to date : ✅

   ✅ **Require conversation resolution before merging**
   - Résout les commentaires de review

   ✅ **Include administrators** (optionnel)
   - S'applique même à vous

4. **Cliquez** "Create" → Fait ! 🎉

### Pour la branche `develop` (développement)

1. **Même URL**, cliquez "Add rule" → Entrez `develop`
2. **Activez seulement** :

   ✅ **Require status checks to pass before merging**
   - Sélectionnez les mêmes workflows CI
   - Require branches to be up to date : ✅

   (Les PR obligatoires ne sont pas nécessaires en develop si votre équipe est petite)

3. **Cliquez** "Create"

---

## 🤖 Dependabot

Dependabot met automatiquement à jour vos dépendances. C'est déjà configuré dans `.github/dependabot.yml`, mais vous devez l'activer sur GitHub.

### Activation

1. **Accédez à** : https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource/settings/security_and_analysis
2. **Sous "Dependabot"** :
   - ✅ Enable Dependabot alerts
   - ✅ Enable Dependabot security updates
   - ✅ Enable Dependabot version updates (géré par .github/dependabot.yml)

### Configuration Personnalisée

Notre configuration`.github/dependabot.yml` :
- Crée des PR **tous les lundi à 3h UTC**
- Limite à **5 PR ouvertes** simultanées
- Labels automatiques : `dependencies`
- Reviewers : `Thomasxxl02`

Pour modifier, éditez [.github/dependabot.yml](.github/dependabot.yml) :

```yaml
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"        # Changez le jour (monday, tuesday, etc.)
      time: "03:00"        # Changez l'heure (UTC)
    # ... autres options
```

---

## 🔍 CodeQL (Analyse de Sécurité)

CodeQL détecte les vulnérabilités et la mauvaise qualité de code.

### Activation

1. **Accédez à** : https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource/settings/security_and_analysis
2. **Sous "Code scanning"** :
   - ✅ Enable CodeQL

C'est activé automatiquement par `.github/workflows/codeql.yml` tous les dimanches + sur chaque push.

### Voir les Résultats

- **Dashboard** : https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource/security/code-scanning
- Les vulnérabilités s'affichent dans l'onglet **"Security"**

### Customiser CodeQL

Notre workflow `.github/workflows/codeql.yml` :
- Analyse en **JavaScript/TypeScript**
- Scan **hebdomadaire** (dimanche)
- Scan sur **chaque push** vers main/develop
- Utilise les requêtes **security-and-quality**

Pour modifier les requêtes, éditez [.github/workflows/codeql.yml](.github/workflows/codeql.yml) :

```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v2
  with:
    languages: ${{ matrix.language }}
    queries: security-and-quality  # Changez ici (security-only, etc.)
```

---

## 🔐 Variables d'Environnement

Pour les secrets sensibles (clés API, tokens), utilisez **Secrets GitHub** et non `.env` en clair.

### Ajouter un Secret

1. **Accédez à** : https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource/settings/secrets/actions
2. **Cliquez** "New repository secret"
3. **Entrez** :
   - Name: `GEMINI_API_KEY`
   - Value: `votre_clé_api_ici`
4. **Cliquez** "Add secret"

### Utiliser dans les Workflows

Dans `.github/workflows/ci.yml` ou autre :

```yaml
- name: Build
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: npm run build
```

### Secrets à Ajouter (Recommandés)

- `GEMINI_API_KEY` : Votre clé API Google Gemini
- `S3_ACCESS_KEY` : Clé d'accès AWS/Scaleway S3
- `S3_SECRET_KEY` : Clé secrète S3
- `ENCRYPTION_KEY` : Clé de chiffrement (32 chars)

> ⚠️ **JAMAIS commit une clé secrète**. Utilisez toujours les Secrets GitHub.

---

## ✅ Checklist de Configuration

- [ ] **Protections main** : PR + CI + Revues activées
- [ ] **Protections develop** : CI activée
- [ ] **Dependabot alerts** : Activé + version updates
- [ ] **Dependabot security updates** : Activé
- [ ] **CodeQL** : Activé
- [ ] **Secrets** : GEMINI_API_KEY ajouté
- [ ] **Branch default** : Vérifier que c'est `main` (ou `develop` si préféré)

---

## 🚀 Prochaines Étapes

1. **Rules de review** : Optionnel, configure CODEOWNERS si travail en équipe
2. **Milestones** : Pour tracker les versions
3. **Project Boards** : Pour gérer les tasks

---

**Configuration terminée ? Commencez à pousser votre code ! 🎉**

Pour plus d'info : https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository
