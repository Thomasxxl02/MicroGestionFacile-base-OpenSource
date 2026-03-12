# Vercel Troubleshooting Guide - Guide de Dépannage

Guide complet pour résoudre les problèmes courants rencontrés lors du déploiement sur Vercel.

## 🔴 Erreurs Courantes

### 1. Unmatched Function Pattern - Modèle de fonction non apparié

**Erreur:**

```
Error: The pattern "api/**/*.ts" defined in `functions` doesn't match
any Serverless Functions inside the `api` directory.
```

**Cause:** La configuration `vercel.json` définit un pattern pour des fonctions serverless qui n'existent pas.

**Solution:**

Votre projet est une **SPA React/Vite**, pas une application Next.js avec fonctions serverless. Vérifiez votre `vercel.json` :

❌ **Interdit** (pattern sans répertoire `api/`)

```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

✅ **Solution** : Supprimez la section `functions` si non utilisée

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

✅ **Alternative** (Next.js avec fonctions serverless)

```json
{
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### 2. Unable to Load Project Settings - Impossible de charger les paramètres du projet

**Erreur:**

```
Error: Unable to load project settings
```

**Cause:**

- Le répertoire `.vercel` appartient à une équipe dont vous n'êtes pas membre
- Vous êtes connecté au mauvais compte Vercel
- Problème d'authentification à deux facteurs

**Solution:**

Supprimez le répertoire `.vercel` et relions le projet :

```bash
# Sur macOS et Linux
rm -rf .vercel
vercel link

# Sur Windows
rmdir /s /q .vercel
vercel link
```

Puis redéployez :

```bash
vercel deploy --prod
```

### 3. Project Name Validation Error - Erreur de validation du nom du projet

**Erreur:**

```
Error: Invalid project name
```

**Règles pour les noms de projet:**

- ✅ Alphanumériques minuscules maximum **100 caractères**
- ✅ Les traits d'union sont autorisés entre les mots
- ❌ Ne peuvent jamais commencer ou finir par un trait d'union

**Valides:**

- `micro-gestion-facile` ✅
- `my-project-123` ✅

**Invalides:**

- `-micro-gestion-facile` ❌
- `my-project-` ❌
- `MyProject` (majuscules) ❌

**Solution:** Renommez votre projet pour respecter ces règles.

### 4. Repository Connection Limit - Limite de connexion au dépôt

**Erreur:**

```
Error: Project limit reached for this repository
```

**Cause:** Vous avez trop de projets Vercel connectés au même dépôt Git.

**Solution:**

1. Vérifiez les projets existants sur Vercel
2. Déconnectez un projet inutilisé depuis le dashboard Vercel
3. Reconnectez le nouveau projet

Pour augmenter la limite, **contactez l'équipe commerciale de Vercel**.

### 5. Domain Verification Issues - Problèmes de vérification de domaine

**Erreur:**

```
Verification failed for domain example.com
```

**Solutions:**

**Option 1 : Vérifier via CLI**

```bash
vercel domains inspect <domain>
```

Exemple:

```bash
vercel domains inspect example.com
```

**Option 2 : Configuration DNS**

Pointez votre domaine vers Vercel en :

- Utilisant les **serveurs de noms Vercel** (recommandé)
- Ajoutant un **enregistrement CNAME** ou **A**

**Option 3 : Dashboard**

Si le domaine est déjà ajouté à un projet, consultez la section "Custom Domains" dans les paramètres du projet.

---

## 🟡 Avertissements Courants

### Environment Variable Issues - Problèmes de variables d'environnement

**Symptôme:** Les secrets ne sont pas disponibles lors du build.

**Solution:**

Assurez-vous que les variables sont définies dans les bons **scopes** :

1. **Variables de Build** : Nécessaires du type `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`

   ```json
   {
     "env": {
       "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD": "1"
     }
   }
   ```

2. **Variables de Production** : Ajoutez via le dashboard Vercel ou CLI

   ```bash
   vercel env add GEMINI_API_KEY
   ```

3. **Vérifiez le `.env.local`** : Ne commit jamais les secrets

### Build Timeout - Timeout du build

**Cause:** Le build prend trop longtemps.

**Solutions:**

- 🔄 Optimisez le `buildCommand` (évitez les tests lourds)
- 📦 Vérifiez les dépendances inutiles
- ⚙️ Augmentez `maxDuration` dans `vercel.json` (plan Pro+)

```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

---

## ✅ Checklist de Dépannage

Avant de contacter le support Vercel :

- [ ] Vérifiez `vercel.json` n'a pas d'erreurs de syntaxe
- [ ] Supprimez `.vercel` et reliens avec `vercel link`
- [ ] Vérifiez que vous êtes connecté au bon compte (`vercel whoami`)
- [ ] Vérifiez les variables d'environnement nécessaires
- [ ] Testez localement : `npm run build` passe sans erreur
- [ ] Vérifiez que `.gitignore` n'exclut pas les fichiers essentiels
- [ ] Consultez les logs détaillés du build sur le dashboard Vercel

---

## 🔗 Ressources Utiles

- [Documentation Vercel](https://vercel.com/docs)
- [Vercel Edge Functions](https://vercel.com/docs/edge-functions)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- [Troubleshooting Guide Officiel](https://vercel.com/docs/platform/frequently-asked-questions)

---

## 📞 Obtenir de l'aide

1. **Vérifiez les logs Vercel** : Dashboard → Deployments → Logs
2. **Consultez ce guide**
3. **Ouvrez une issue** sur le [dépôt GitHub](https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource/issues)
4. **Contactez Vercel Support** : https://vercel.com/support
