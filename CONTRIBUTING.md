# 🤝 Contribution - Micro-Gestion Facile

Merci de votre intérêt pour ce projet ! Voici comment contribuer efficacement.

## 📋 Code de Conduite

Ce projet adhère au [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). En participant, vous acceptez de respecter ce code.

## 🔄 Workflow de Contribution

### 1. Fork et Clone

```bash
git clone https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource.git
cd micro-gestion-facile-base
git checkout -b feature/ma-fonctionnalite
```

### 2. Configuration Locale

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
npm run format:fix
npm run lint:fix
npm run type-check
```

### 5. Tests

```bash
npm run test:run          # Tests une seule fois
npm test                  # Mode watch
npm run test:coverage     # Générer un rapport
```

## 📝 Commits

Utilisez un format conventionnel ::

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

Exemple :

```
feat(invoices): ajouter la génération Factur-X

- Intégrer la norme Factur-X Basic-WL
- Ajouter validation de conformité
- Mettre à jour les tests
```

## 🚀 Pull Requests

1. **Branche** : Créez depuis `develop` pour les features, `main` pour les hotfixes
2. **Titre** : Clair et décriptif
3. **Description** : Utilisez le template automatique
4. **Checklist** : Cochez tous les points applicables
5. **Tests** : Tous les tests doivent passer (`npm run test:run`)
6. **Build** : `npm run build` doit réussir

### Exemple de PR

```markdown
## Description

Ajoute une validation des plafonds TVA pour 2026

Fermé par : #45

## Type

- [x] New feature

## Checklist

- [x] npm run validate ✓
- [x] npm run test:run ✓
- [x] Tests ajoutés
- [x] Documentation mise à jour
```

## 🐛 Signaler un Bug

1. **Vérifiez** que le bug n'est pas déjà signalé
2. **Décrivez** le comportement attendu vs. actuel
3. **Reproduisez** avec les étapes précises
4. **Attachez** captures d'écran et logs
5. **Environnement** : OS, navigateur, version

Utilisez le template [bug_report.md](.github/ISSUE_TEMPLATE/bug_report.md).

## ✨ Proposer Une Fonctionnalité

1. **Vérifiez** qu'elle n'existe pas déjà
2. **Décrivez** le problème qu'elle résout
3. **Proposez** une solution
4. **Envisagez** les alternatives

Utilisez le template [feature_request.md](.github/ISSUE_TEMPLATE/feature_request.md).

## 🔒 Sécurité

⚠️ **N'exposez jamais** :

- Clés API (même en exemple)
- Tokens d'authentification
- Identifiants de base de données
- Fichiers `.env`

Pour les failles de sécurité, consultez [SECURITY.md](SECURITY.md).

## 🏗️ Architecture

Avant de contribuer, lisez :

- [ARCHITECTURE.md](ARCHITECTURE.md) - Structure technique
- [SECURITY.md](SECURITY.md) - Politiques de sécurité
- [IMPROVEMENTS.md](IMPROVEMENTS.md) - Roadmap

## 📚 Stack Technique

- **React 19** + **TypeScript**
- **Vite 6** pour le build
- **Zustand** + **React Query** pour l'état
- **Dexie** pour IndexedDB
- **Tailwind CSS** pour l'UI
- **Vitest** pour les tests
- **ESLint** + **Prettier** pour la qualité

## 🎓 Ressources

- [Git & GitHub Guide](https://guides.github.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Fiscalité URSSAF 2026](https://www.urssaf.fr)

## 📞 Questions ?

- Ouvrez une [discussion](https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource/discussions)
- Posez votre question sur l'issue
- Contactez le mainteneur

---

**Merci de votre contribution ! 🙏**
