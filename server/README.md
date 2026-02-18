# 🔒 API Proxy Server - Gemini

Serveur Node.js proxy sécurisé pour les appels API Gemini. Ce serveur garde les clés API côté serveur et expose des endpoints sécurisés.

## 🚀 Démarrage

### Développement

```bash
# Terminal 1: Démarrer le serveur proxy
GEMINI_API_KEY=your_key API_PORT=3001 npm run api

# Terminal 2: Démarrer l'app Vite (con proxy configuré)
npm run dev
```

Ou en une seule commande :

```bash
GEMINI_API_KEY=your_key npm run dev:with-api
```

### Production

```bash
# Déployer ce serveur sur votre infrastructure
# Assurez-vous que GEMINI_API_KEY est configurée comme variable d'environnement sécurisée

npm install --production
GEMINI_API_KEY=your_key API_PORT=3001 node --loader ts-node/esm server/api.ts
```

## 📍 Routes Disponibles

### POST /api/ai/chat

Endpoint générique pour les appels de chat avec Gemini.

**Payload:**

```json
{
  "query": "Votre question ici",
  "context": "Contexte optionnel",
  "model": "gemini-3-flash-preview",
  "responseMimeType": "text/plain"
}
```

**Réponse:**

```json
{
  "success": true,
  "data": "Réponse du modèle"
}
```

### POST /api/ai/analyze-vat

Analyse prédictive de la TVA avec validation JSON stricte.

**Payload:**

```json
{
  "currentCA": 15000,
  "monthlyHistory": [
    { "month": "janvier", "amount": 5000 },
    { "month": "février", "amount": 5000 },
    { "month": "mars", "amount": 5000 }
  ],
  "activityType": "services"
}
```

**Réponse validée:**

```json
{
  "success": true,
  "data": {
    "isLikelyToExceed": false,
    "monthsBeforeExceeding": null,
    "projectedCA": 20000,
    "recommendation": "Continuez à suivre..."
  }
}
```

## 🔒 Sécurité

- ✅ Clés API gardées côté serveur
- ✅ Validation JSON stricte des réponses
- ✅ CORS configuré pour développement (à adapter en production)
- ✅ Erreurs gracieuses sans exposition de détails sensibles

## 🛠️ Technologies

- Node.js HTTP Server (intégré)
- @google/genai SDK
- Validation JSON custom

## 📝 Notes d'Architecture

1. **Client (Vite/React)** → appelle `/api/ai/*` via proxy
2. **Proxy Vite (dev)** → forward vers `http://localhost:3001`
3. **Serveur API** → utilise `GEMINI_API_KEY` en variable d'env
4. **Réponses** → validées avant retour au client

## ⚠️ À Faire

- [ ] Implémenter OCR Gemini Vision côté serveur
- [ ] Ajouter rate-limiting
- [ ] Ajouter authentification Bearer token
- [ ] Déployer sur service cloud (Railway, Render, Heroku, etc.)
