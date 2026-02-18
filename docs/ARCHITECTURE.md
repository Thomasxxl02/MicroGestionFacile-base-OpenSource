# Documentation Technique - Micro-Gestion Facile

Ce projet est une application de gestion pour micro-entrepreneurs, conçue pour être performante, sécurisée et conforme aux normes françaises (Factur-X, RGPD).

## Architecture

### Frontend (React 19 + Vite 6)

- **Base de données** : Dexie (IndexedDB) avec validation **Zod** à la lecture pour garantir l'intégrité des données locales.
- **Performance** : Utilisation de `React.lazy` et `Suspense` pour les modules lourds (Comptabilité, Paramètres).
- **Notifications** : Système `Sonner` pour un feedback utilisateur fluide.
- **Calculs** : Logique centralisée dans `useInvoiceCalculations.ts` gérant les seuils de franchise de TVA (36 800€ / 91 900€) et le prorata temporis.

### Backend (Node.js + Express)

Le serveur (`/server`) gère les opérations critiques ne pouvant être confiées au navigateur :

1. **Génération PDF Immuable** : Utilise `pdf-lib` pour intégrer un hash SHA-256 d'intégrité en bas de page.
2. **Factur-X** : Génération du profil "Basic-WL" (XML intégré) pour la facturation électronique 2026.
3. **Backup Chiffré** : Chaque facture générée est automatiquement :
   - Chiffrée en **AES-256-CBC** (clé côté serveur).
   - Envoyée vers un stockage **S3** souverain.

## Sécurité & Conformité

- **Intégrité** : Chaque facture possède une empreinte unique (SHA-256) stockée en base et imprimée sur le document.
- **Chiffrement** : Les sauvegardes externes sont illisibles sans la `ENCRYPTION_KEY` du serveur.
- **Social** : Calcul automatique des cotisations URSSAF selon le type d'activité (12.3% ou 21.2%).

## Installation & Lancement

### Frontend

```powershell
npm install
npm run dev
```

### Backend

```powershell
cd server
npm install
# Configurez le .env avec vos clés S3 et ENCRYPTION_KEY
npm run dev
```

## Variables d'Environnement (.env)

- `S3_ENDPOINT` : URL de votre stockage S3 (ex: Scaleway/OVH).
- `S3_ACCESS_KEY` / `S3_SECRET_KEY` : Vos identifiants.
- `S3_BUCKET` : Nom du bucket de sauvegarde.
- `ENCRYPTION_KEY` : Clé de 32 caractères pour le chiffrement AES.
