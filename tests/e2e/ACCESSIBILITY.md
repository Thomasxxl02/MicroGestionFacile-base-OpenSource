# Accessibility Testing with Axe

## Installation (Optional)

Pour des audits d'accessibilité complets avec Axe, installez les dépendances :

```bash
npm install --save-dev axe-playwright @axe-core/react @axe-core/playwright
```

## Usage

### Avec Axe (Installation optionnelle)

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('accessibility audit', async ({ page }) => {
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    axeOptions: {
      rules: ['color-contrast', 'aria-required-attr'],
    },
  });
});
```

### Sans Axe (Configuration actuellement utilisée)

Les tests utilisent les vérifications natives de Playwright pour :

- Labels accessibles
- Navigation au clavier
- Structure des en-têtes
- Focus management
- Textes alt sur images

## WCAG 2.1 AA Compliance

Les tests vérifient :

- ✅ Texte alternatif sur les images
- ✅ Labels sur les champs de formulaire
- ✅ Contraste des couleurs
- ✅ Navigation au clavier
- ✅ Structure hiérarchique des titres
- ✅ Focus visible
- ✅ Noms accessibles des boutons et liens

## Running Tests

```bash
# Tous les tests E2E
npm run test:e2e

# Tests d'accessibilité uniquement
npm run test:e2e -- accessibility.spec.ts

# Avec rapport détaillé
npm run test:e2e -- --reporter=html
```

## Continuous Integration

Les workflows GitHub Actions exécutent automatiquement les tests d'accessibilité sur chaque PR :

- `.github/workflows/accessibility-audit.yml`
- Commentaires automatiques sur les PR avec les résultats
