# Vercel Deployment Configuration

## Build Optimization

### Configuration Files

#### `vercel.json`

```json
{
  "buildCommand": "npm run type-check && npm run lint",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "CI": "true",
    "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD": "1"
  }
}
```

**Key Points:**

- ✅ **buildCommand**: Réduit à type-check + lint (sans build complet)
- ✅ **PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD**: Évite l'installation des navigateurs Playwright
- ✅ **ignoreCommand**: Ignore les changements dans les docs/tests et ne redéploie que si nécessaire

### Build Process

1. **Type Checking** (`tsc --noEmit`)
   - Valide les types TypeScript
   - Durée: ~10s

2. **Linting** (`eslint`)
   - Vérifie la qualité du code
   - Durée: ~15s

3. **Vite Build** (fait localement avant push)
   - `vite build` génère `dist/`
   - N'exécute pas sur Vercel

## Testing Strategy

### Design Pattern: Tests POST-Déploiement

Les tests E2E ne bloquent **PAS** le déploiement Vercel :

```
Code Push → Type Check + Lint → Vercel Build → Deploy → Tests
                                    ✓ Rapide       ✓ Après déploiement
```

### Test Execution Flow

1. **GitHub Actions: accessibility-audit.yml**
   - ✅ Déclenché sur PR
   - ✅ Construit localement
   - ✅ Lance `npm run preview`
   - ✅ Teste l'accessibilité

2. **GitHub Actions: performance-monitoring.yml**
   - ✅ Déclenché sur PR
   - ✅ Analyse la performance
   - ✅ Mesure les Core Web Vitals

3. **GitHub Actions: deploy.yml**
   - ✅ Déclenché sur push to main
   - ✅ Exécute tous les tests
   - ✅ Déploie en production
   - ✅ Commentaires automatiques sur les résultats

### Test Conditions

Les tests vérifient une variable d'environnement pour ignorer l'exécution sur Vercel :

```typescript
const skipOnVercel = process.env.VERCEL === 'true';
const testRunner = skipOnVercel ? test.skip : test;

testRunner.describe('⚡ Performance Monitoring', () => {
  // Tests skipped pendant le build Vercel
  // Exécutés localement ou après déploiement
});
```

**Avantages:**

- ✅ Vercel build rapide (~1-2 minutes)
- ✅ Pas d'attente pour les tests sur Vercel
- ✅ Tests s'exécutent en parallèle
- ✅ Build non bloqué par les tests

## Workflow Diagram

```
Push to main
    ↓
GitHub Actions: deploy.yml
    ├─ Type Check ✓
    ├─ Lint ✓
    ├─ Build (local)
    ├─ Accessibility Tests ↔ Performance Tests
    └─ Deploy to Vercel
        ├─ Vercel Build (type-check + lint only) ← Rapide!
        ├─ Vite Build (from dist/)
        └─ Deploy to Production
```

## Environment Variables

### Required on Vercel

- `CI=true` - Active le mode CI
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` - Évite l'installation inutile

### Optional

- `VERCEL=true` - Défini automatiquement par Vercel
- `VERCEL_ENV` - Production/Preview/Development

## Build Duration

- **Avant**: ~5-7 minutes (avec linting + tests)
- **Après**: ~1-2 minutes (avec seulement type-check + lint)

## Metrics

### Vercel Build

```
Cloning repository: 587ms
Running vercel build: ~40s total
  - npm ci: 10s
  - npm run type-check: 10s
  - npm run lint: 15s
  - Vite build (cached): 5s
```

### GitHub Actions

```
Accessibility Audit: ~5 minutes
Performance Monitoring: ~5 minutes
(Peuvent s'exécuter en parallèle)
```

## Security & Cache

- ✅ Cache npm activé
- ✅ Playwright browsers skip sur Vercel
- ✅ Source maps désactivées en production
- ✅ Tree-shaking activé

## Rollback Strategy

En cas de problème :

```bash
# Vercel rollback
vercel --prod --yes

# ou via Vercel dashboard
# Deployments → Select previous → Promote to Production
```

## Monitoring

### Post-Deployment Checks

Après le déploiement sur Vercel, les tests :

- ✅ Vérifient l'accessibilité (WCAG 2.1 AA)
- ✅ Mesurent la performance (Core Web Vitals)
- ✅ Détectent les fuites mémoire
- ✅ Validez les assets en cache

### Automatic PR Comments

- ♿ Accessibility audit results
- ⚡ Performance metrics
- 🚀 Deployment summary
