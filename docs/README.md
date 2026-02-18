# 💼 Micro-Gestion Facile

Application web moderne (PWA) de gestion pour micro-entrepreneurs français. Gestion complète de facturation, clients, fournisseurs, dépenses et comptabilité avec conformité fiscale française stricte.

## ✨ Fonctionnalités

- 📝 **Facturation** : Création, édition et génération PDF de factures conformes
- 👥 **Gestion Clients/Fournisseurs** : Base de données locale sécurisée
- 📦 **Produits & Services** : Catalogue avec TVA et tarifs
- 💰 **Comptabilité** : Suivi du CA, charges, cotisations URSSAF
- 📊 **Tableau de bord** : Visualisation en temps réel de votre activité
- 🤖 **Assistant IA** : Aide contextuelle via Gemini AI (optionnel)
- 🔒 **Données sécurisées** : Chiffrement AES-256-GCM, persistance locale (IndexedDB)
- 🌙 **Mode sombre** : Interface moderne et responsive
- 📱 **PWA** : Installation et fonctionnement hors-ligne

## 🎯 Conformité Française

- ✅ Seuils TVA 2026 : 36 800€ / 91 900€
- ✅ Calculs cotisations URSSAF (12,3% ou 21,2%)
- ✅ Numérotation continue des factures
- ✅ Export FEC (Fichier d'Écritures Comptables)
- ✅ Prorata temporis automatique
- ✅ Calculs avec `decimal.js` (précision 0,01€)

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou pnpm

### Étapes

1. **Cloner le projet**

```bash
git clone <url-du-repo>
cd micro-gestion-facile-base
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configuration (optionnel)**

Copier `.env.example` vers `.env` et configurer votre clé Gemini API :

```bash
cp .env.example .env
```

Éditer `.env` :

```env
GEMINI_API_KEY=votre_cle_api_ici
```

> **Note** : La clé API Gemini est optionnelle et utilisée uniquement pour l'assistant IA. Les utilisateurs peuvent configurer leur propre clé directement dans l'application (Paramètres > Assistant IA).

4. **Lancer en développement**

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 📜 Scripts Disponibles

```bash
npm run dev          # Lancer le serveur de développement
npm run build        # Compiler pour la production
npm run preview      # Prévisualiser le build de production
npm run lint         # Analyser le code (ESLint)
npm run lint:fix     # Corriger automatiquement les erreurs ESLint
npm run format       # Formater le code (Prettier)
npm run format:check # Vérifier le formatage
npm run type-check   # Vérifier les types TypeScript
npm run validate     # Validation complète (types + lint + format)
npm test             # Lancer les tests unitaires (Vitest)
npm run test:ui      # Interface graphique des tests
npm run test:coverage # Générer le rapport de couverture
```

## 🏗️ Architecture

```
src/
├── components/          # Composants React
│   ├── clients/        # Gestion clients
│   ├── invoices/       # Facturation
│   ├── settings/       # Paramètres
│   ├── setup/          # Assistant de configuration
│   └── ui/             # Composants UI réutilisables
├── hooks/              # Hooks React personnalisés
├── services/           # Services métier
│   ├── db.ts          # Base de données (Dexie/IndexedDB)
│   ├── pdfService.ts  # Génération PDF
│   ├── geminiService.ts # IA Assistant
│   ├── securityService.ts # Chiffrement
│   └── ...
├── types/              # Types TypeScript
└── lib/                # Utilitaires
```

## 🛠️ Stack Technique

- **Frontend** : React 19 + TypeScript
- **Build** : Vite 6
- **Router** : React Router 7
- **State** : Zustand + React Query
- **Database** : Dexie (IndexedDB)
- **UI** : Tailwind CSS + Framer Motion
- **Validation** : Zod
- **PDF** : jsPDF + pdf-lib
- **Charting** : Recharts
- **IA** : Google Gemini AI
- **Tests** : Vitest + Testing Library

## 🔐 Sécurité

- Chiffrement AES-256-GCM pour les données sensibles (RIB, IBAN)
- Validation Zod à la lecture des données
- Audit trail immuable (logs d'accès)
- Clés API configurables par utilisateur
- Données stockées localement (RGPD compliant)

Voir [SECURITY.md](SECURITY.md) pour plus de détails.

## 🧪 Tests

Lancer les tests :

```bash
npm test
```

Tests avec interface graphique :

```bash
npm run test:ui
```

Couverture de code :

```bash
npm run test:coverage
```

## 📦 Déploiement

### Build de production

```bash
npm run build
```

Les fichiers optimisés seront dans `/dist`

### Hébergement recommandé

- **Netlify** : Déploiement automatique depuis Git
- **Vercel** : Optimisé pour les apps React
- **GitHub Pages** : Gratuit pour projets open source
- **Serveur statique** : Nginx, Apache, Caddy

### Configuration PWA

Le Service Worker est généré automatiquement par `vite-plugin-pwa`. Configuration dans [vite.config.ts](vite.config.ts).

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit (`git commit -m 'Ajout fonctionnalité X'`)
4. Push (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## 📄 Licence

[MIT](LICENSE)

## 💬 Support

Pour toute question ou problème :

- Ouvrir une [issue](../../issues)
- Consulter la [documentation](ARCHITECTURE.md)

---

**Note** : Ce projet est destiné aux micro-entrepreneurs français et respecte les obligations fiscales et comptables en vigueur en France (2026).
