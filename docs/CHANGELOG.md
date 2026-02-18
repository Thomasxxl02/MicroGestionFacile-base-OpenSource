# Changelog

Tous les changements importants de ce projet sont documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/),
et ce projet suit [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-02-17

### ✨ Ajoutés

- Initialisation du dépôt open-source
- Workflows GitHub Actions (CI/CD, CodeQL)
- Dependabot pour la gestion des dépendances
- Templates GitHub (issues, PRs)
- Documentation complète (CONTRIBUTING, CODE_OF_CONDUCT)
- Pre-commit hooks avec Husky
- CHANGELOG.md

### 🔧 Amélioré

- `.gitignore` enrichi avec règles complètes
- Configuration ESLint et Prettier
- Tests avec Vitest et couverture
- Documentation README et ARCHITECTURE
- Sécurité (SECURITY.md existant)

### 🐛 Corrigé

- Fichiers de configuration manquants
- Structure des workflows GitHub

## [0.0.0] - 2026-02-17

### ✨ Initial

- Création du projet Micro-Gestion Facile
- Base PWA avec React 19 + TypeScript
- Gestion fiscale française (URSSAF, TVA)
- IndexedDB avec Dexie
- Facturation et PDF
- Tableau de bord et analytics

---

## Convention des Commits

Nous utilisons les [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation seulement
- `style:` Formatage sans changement logique
- `refactor:` Refactoring de code
- `perf:` Amélioration de performance
- `test:` Tests ajoutés ou modifiés
- `chore:` Dépendances, configuration
- `security:` Corrections de sécurité

Exemple :

```
feat(fiscalité): ajouter calcul automatique cotisations 2026

Ajoute le calcul des cotisations URSSAF pour 2026
avec seuils actualisés et régularisation automatique.

Fermé par #123
```

---

## Versioning

Nous suivons **Semantic Versioning** : MAJOR.MINOR.PATCH

- **MAJOR** : Changements incompatibles
- **MINOR** : Nouvelles fonctionnalités (compatibles)
- **PATCH** : Corrections de bugs

---

Rendez-vous sur [GitHub Releases](https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource/releases) pour plus de détails.
