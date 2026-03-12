# Contribution Guide - Merci de votre intérêt pour ce projet !

## 📋 Code de Conduite

Ce projet adhère au [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). En participant, vous acceptez de respecter ce code.

## 🔄 Flux de travail de contribution

### 1. Fork et Clone

```bash
git clone https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource.git
cd micro-gestion-facile-base
git checkout -b feature/ma-fonctionnalite
```

### 2. Configuration de l'environnement

```bash
npm install
npm run dev
```

### 3. Développement

- Gardez votre branche à jour avec `main` ou `develop`
- Faites des commits atomiques avec des messages clairs
- Testez vos changements : `npm run validate`
- Écrivez des tests pour les nouvelles fonctionnalités

### 4. Format et Linting

```bash
npm run format
npm run lint:fix
npm run type-check
```

### 5. Tests

```bash
npm run test:run          # Tests une seule fois
npm test                  # Mode watch
npm run test:coverage     # Générer un rapport
```

## 📝 Convention de Commits

Utilisez un format conventionnel :

```
feat: ajouter une nouvelle fonctionnalité
fix: corriger un bug
docs: documenter un changement
style: formatage ou refactoring sans logique
test: ajouter ou modifier les tests
chore: dépendances, configuration
perf: amélioration de performance
security: correction de sécurité
```

### Exemple complet :

```
feat(invoices): ajouter la génération Factur-X

- Intégrer la norme Factur-X Basic-WL
- Ajouter validation de conformité
- Mettre à jour les tests
```

## 🚀 Demandes de Fusion (Pull Requests)

### Préparation

- **Branche** : Créer depuis `develop` pour les fonctionnalités, `main` pour les correctifs
- **Titre** : Clair et descriptif
- **Description** : Utiliser le template automatique
- **Check-list** : Cochez tous les points applicables

### Critères de validation

- ✅ Tous les tests doivent passer : `npm run test:run`
- ✅ Build doit réussir : `npm run build`
- ✅ Linting et formatting : `npm run validate`
- ✅ Couverture de code pour les nouvelles fonctionnalités
- ✅ Documentation mise à jour

## 🔐 Sécurité

Si vous découvrez une faille de sécurité, veuillez **ne pas** ouvrir d'issue publique. Contactez plutôt les mainteneurs directement via security issue.

## 📚 Ressources utiles

- [Documentation Architecture](docs/ARCHITECTURE.md)
- [Guide de Test](docs/TEST_COMPLETE_GUIDE.md)
- [Documentation API](docs/API.md)

## Questions ?

Ouvrez une discussion ou une issue pour poser des questions sur les contributions.

**Merci de contribuer à Micro Gestion Facile ! 🙌**
