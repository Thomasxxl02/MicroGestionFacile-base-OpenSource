# 📖 Documentation API - Micro-Gestion Facile

> **Version**: 1.0  
> **Dernière mise à jour**: Février 2026  
> **API Proxy pour Gemini AI avec sécurité côté serveur**

## 🎯 Vue d'ensemble

Cette API fournit un **proxy sécurisé** pour les appels au service Google Gemini AI avec des fonctionnalités adaptées aux micro-entrepreneurs français :

- 🔒 **Clés API sécurisées** : Vos clés Gemini restent côté serveur
- ✅ **Validation stricte** : Toutes les requêtes sont validées avec Zod
- ⚡ **Rate limiting** : Protection contre les abus (optionnel)
- 📋 **Logging structuré** : Tous les appels sont journalisés
- 🛡️ **Gestion d'erreurs robuste** : Messages clairs et codes HTTP appropriés

---

## 🚀 Démarrage Rapide

### 1️⃣ Installation & Configuration

```bash
# Cloner le repo
git clone https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource.git
cd micro-gestion-facile-base

# Installer les dépendances
npm install

# Créer un fichier .env
cat > .env << 'EOF'
# API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
API_PORT=3001
ENABLE_RATE_LIMIT=false
MAX_REQUESTS_PER_MINUTE=60
CORS_ORIGIN=*
EOF
```

### 2️⃣ Démarrer le serveur

```bash
# Démarrer en développement
npm run api

# OU avec watch mode
npm run dev:with-api
```

**Output attendu :**

```
[2026-02-17T10:30:45.123Z] ✅ API Proxy démarré sur http://localhost:3001
📍 Routes disponibles:
  POST /api/ai/chat - Chat générique avec IA
  POST /api/ai/analyze-vat - Analyse VAT prédictive
  GET  /health - Healthcheck
```

### 3️⃣ Test basique

```bash
# Healthcheck
curl http://localhost:3001/health

# Chat simple
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Quels sont les seuils TVA 2026?"}'
```

---

## 🔑 Configuration

### Variables d'Environnement

| Variable                  | Type    | Défaut     | Description                                   |
| ------------------------- | ------- | ---------- | --------------------------------------------- |
| `GEMINI_API_KEY`          | string  | **requis** | Clé API Gemini (https://ai.google.dev)        |
| `API_PORT`                | number  | `3001`     | Port d'écoute du serveur                      |
| `ENABLE_RATE_LIMIT`       | boolean | `false`    | Activer le rate limiting                      |
| `MAX_REQUESTS_PER_MINUTE` | number  | `60`       | Limite requêtes/minute (si rate limit activé) |
| `CORS_ORIGIN`             | string  | `*`        | Origines CORS autorisées                      |

### Obtenir une clé Gemini API

1. Aller sur [Google AI Studio](https://ai.google.dev)
2. Cliquer "Get API Key"
3. Créer une nouvelle clé pour Gemini 1.5 Flash ou Pro
4. Copier la clé dans votre `.env` : `GEMINI_API_KEY=sk-...`

---

## 🔐 Sécurité

### Principes Fondamentaux

✅ **À faire :**

- Garder `GEMINI_API_KEY` **côté serveur uniquement**
- Valider toutes les entrées avec Zod
- Utiliser HTTPS en production
- Implémenter rate limiting si public
- Logger les erreurs pour audit
- Restreindre CORS à vos domaines

❌ **À éviter :**

- Exposer la clé API au client (HTML/JS)
- Accepter les requêtes malformées
- Permettre des requêtes arbitrairement longues
- Désactiver la validation des réponses JSON

### Headers de Sécurité

Toutes les réponses incluent :

```
Access-Control-Allow-Origin: * (configurable)
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-API-Key
X-API-Version: 1.0
```

---

## 📡 Endpoints

### 1. POST `/api/ai/chat`

**Chat générique avec Gemini AI**

Endpoint flexible pour :

- Questions/réponses sur URSSAF
- Rédaction d'emails professionnels
- Analyse budgétaire
- Conseils fiscaux
- Brainstorming

#### Requête

```javascript
POST /api/ai/chat
Content-Type: application/json

{
  "query": "string (requis)",           // Votre question
  "context": "string (optionnel)",      // Contexte utilisateur
  "model": "string (optionnel)",        // Model Gemini
  "responseMimeType": "string (optionnel)" // Format réponse
}
```

#### Parameters

| Champ              | Type   | Requis | Limite   | Description                                                             |
| ------------------ | ------ | ------ | -------- | ----------------------------------------------------------------------- |
| `query`            | string | ✅     | 4000 car | Votre question/prompt                                                   |
| `context`          | string | ❌     | 2000 car | Contexte utilisateur (CA, statut...)                                    |
| `model`            | enum   | ❌     | -        | `gemini-3-flash-preview` (défaut), `gemini-1.5-flash`, `gemini-1.5-pro` |
| `responseMimeType` | enum   | ❌     | -        | `text/plain` (défaut) ou `application/json`                             |

#### Réponse (200 OK)

```json
{
  "success": true,
  "data": "Réponse texte ou JSON selon responseMimeType",
  "meta": {
    "model": "gemini-3-flash-preview",
    "requestSize": 156,
    "responseSize": 2340
  }
}
```

#### Exemples

##### Exemple 1: Question simple

```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Quels sont les seuils TVA et CA pour micro-entrepreneurs en 2026?",
    "model": "gemini-3-flash-preview"
  }'
```

**Réponse :**

```json
{
  "success": true,
  "data": "En 2026, pour les micro-entrepreneurs en France:\n\n**Seuils TVA (franchise de base):**\n...",
  "meta": {
    "model": "gemini-3-flash-preview",
    "requestSize": 105,
    "responseSize": 1240
  }
}
```

##### Exemple 2: Avec contexte utilisateur

```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Je suis en sauge de dépasser mon seuil TVA. Quelles sont mes options?",
    "context": "Type: Services, CA 2026: 35000€, ACCRE: non, VL: non",
    "model": "gemini-1.5-flash"
  }'
```

##### Exemple 3: Réponse JSON

```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Crée un tableau JSON avec les cotisations URSSAF ligne 2026 pour: CA Services=5000€, CA Ventes=10000€",
    "responseMimeType": "application/json"
  }'
```

**Réponse :**

```json
{
  "success": true,
  "data": {
    "services": {
      "ca": 5000,
      "rate": 0.212,
      "cotisations": 1060,
      "cfp": 10
    },
    "sales": {
      "ca": 10000,
      "rate": 0.123,
      "cotisations": 1230,
      "cfp": 10
    },
    "total": 2310
  },
  "meta": { ... }
}
```

---

### 2. POST `/api/ai/analyze-vat`

**Analyse prédictive des seuils TVA avec IA**

Aide à prédire si vous allez dépasser votre seuil TVA avant fin d'année.

#### Requête

```javascript
POST /api/ai/analyze-vat
Content-Type: application/json

{
  "currentCA": number,           // CA cumulé année en cours (€)
  "monthlyHistory": [            // Historique mensuel
    { "month": "Jan", "amount": 2500 },
    { "month": "Fév", "amount": 3200 }
  ],
  "activityType": "services"     // "sales" | "services" | "mixed"
}
```

#### Parameters

| Champ            | Type   | Requis | Limite     | Description                                         |
| ---------------- | ------ | ------ | ---------- | --------------------------------------------------- |
| `currentCA`      | number | ✅     | 0-1000000€ | CA cumulé depuis janvier                            |
| `monthlyHistory` | array  | ✅     | -          | Historique CA par mois                              |
| `activityType`   | enum   | ✅     | -          | `sales` (ventes), `services` (prestations), `mixed` |

#### Réponse (200 OK)

```json
{
  "success": true,
  "data": {
    "isLikelyToExceed": boolean,          // Vais-je dépasser?
    "monthsBeforeExceeding": number|null, // Nb de mois avant seuil
    "projectedCA": number,                // CA projeté fin 2026
    "recommendation": "string"            // Conseil (régime réel, optimisations...)
  },
  "meta": {
    "analysisDate": "2026-02-17T10:35:22.123Z",
    "threshold": 36800,
    "activityType": "services"
  }
}
```

#### Exemple

```bash
curl -X POST http://localhost:3001/api/ai/analyze-vat \
  -H "Content-Type: application/json" \
  -d '{
    "currentCA": 28000,
    "monthlyHistory": [
      {"month": "Jan", "amount": 3500},
      {"month": "Fév", "amount": 4200},
      {"month": "Mar", "amount": 3800},
      {"month": "Avr", "amount": 4100},
      {"month": "Mai", "amount": 3900},
      {"month": "Juin", "amount": 4500}
    ],
    "activityType": "services"
  }'
```

**Réponse :**

```json
{
  "success": true,
  "data": {
    "isLikelyToExceed": true,
    "monthsBeforeExceeding": 4,
    "projectedCA": 42000,
    "recommendation": "Vous allez dépasser 36800€ vers octobre. Préparez le passage au régime réel pour septembre."
  },
  "meta": {
    "analysisDate": "2026-02-17T10:35:22.123Z",
    "threshold": 36800,
    "activityType": "services"
  }
}
```

---

### 3. GET `/health`

**Healthcheck et monitoring**

Vérifie que le serveur est operationnel et la configuration valide.

#### Requête

```bash
GET /health
```

#### Réponse (200 OK)

```json
{
  "status": "healthy",
  "timestamp": "2026-02-17T10:40:15.456Z",
  "apiKey": "configured",
  "rateLimitEnabled": false
}
```

#### Exemple

```bash
curl http://localhost:3001/health
```

---

## ⚠️ Gestion des Erreurs

### Code HTTP & Messages

| Code    | Description       | Exemple                             |
| ------- | ----------------- | ----------------------------------- |
| **200** | Succès            | Requête traitée OK                  |
| **400** | Bad Request       | JSON invalide, validation échouée   |
| **404** | Not Found         | Route inexistante                   |
| **429** | Too Many Requests | Rate limit atteint                  |
| **500** | Server Error      | Erreur API Gemini, problème serveur |

### Format d'Erreur Standard

```json
{
  "error": "Description courte",
  "message": "Message détaillé (optionnel)",
  "details": "...détails si validation échouée..."
}
```

### Exemples d'Erreurs

#### Validation échouée (400)

```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"query": ""}'  # Query vide = invalide
```

```json
{
  "error": "Validation échouée",
  "details": [
    {
      "code": "too_small",
      "message": "Query ne peut pas être vide",
      "path": ["query"]
    }
  ]
}
```

#### Rate Limit atteint (429)

```bash
# Après 60 requêtes/minute
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "..."}'
```

```json
{
  "error": "Trop de requêtes. Veuillez réessayer dans une minute.",
  "remaining": 0
}
```

#### Réponse JSON invalide (400)

```json
{
  "error": "Réponse JSON invalide de l'API",
  "raw": "Texte mal formé retourné par Gemini..."
}
```

---

## 🚦 Rate Limiting

### Configuration

Le rate limiting est **désactivé par défaut**. Pour l'activer :

```bash
# .env
ENABLE_RATE_LIMIT=true
MAX_REQUESTS_PER_MINUTE=60
```

### Fonctionnement

- Basé sur l'IP client (`X-Forwarded-For` ou `req.socket.remoteAddress`)
- Fenêtre glissante de 1 minute
- Stockage en mémoire (Redis recommandé pour production)
- Réponse `429` si seuil atteint
- Champ `remaining` indique les requêtes disponibles

### Exemple

```bash
# Requête 61e quand max=60
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "..."}'

# Réponse:
# HTTP/1.1 429 Too Many Requests
{
  "error": "Trop de requêtes. Veuillez réessayer dans une minute.",
  "remaining": 0
}
```

---

## 🛠️ Exemples Clients

### JavaScript / Fetch API

```typescript
interface ChatRequest {
  query: string;
  context?: string;
  model?: string;
  responseMimeType?: string;
}

async function askAI(request: ChatRequest) {
  const response = await fetch('http://localhost:3001/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  return data.data;
}

// Utilisation
const answer = await askAI({
  query: 'Comment calculer mes cotisations URSSAF?',
  context: 'CA 2026: 50000€, Services, Sans ACCRE',
});

console.log(answer);
```

### React Hook

```typescript
import { useAsync } from '@/hooks/useAsync';

export function useAIChat() {
  const { execute, isLoading } = useAsync<string>({
    retryCount: 2,
    retryDelay: 1000,
  });

  const ask = async (query: string, context?: string) => {
    return execute(
      () =>
        fetch('http://localhost:3001/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, context }),
        })
          .then((r) => r.json())
          .then((d) => d.data),
      'AI Chat'
    );
  };

  return { ask, isLoading };
}
```

### Python

```python
import requests
import json

API_URL = "http://localhost:3001"

def ask_ai(query: str, context: str = None):
    """Appelle l'endpoint /api/ai/chat"""
    response = requests.post(
        f"{API_URL}/api/ai/chat",
        json={
            "query": query,
            "context": context,
            "model": "gemini-3-flash-preview",
        },
        headers={"Content-Type": "application/json"},
    )

    result = response.json()
    if response.status_code == 200:
        return result["data"]
    else:
        raise Exception(result.get("error", "Unknown error"))

# Utilisation
answer = ask_ai(
    "Je suis freelancer. Dois-je m'inscrire à la CFE?",
    context="CA 2026: 12000€, Services"
)
print(answer)
```

### cURL Avancé

```bash
#!/bin/bash

API_URL="http://localhost:3001"

# Chat avec contexte complet
curl -X POST "$API_URL/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "query": "Je dois créer une facture pour un client. Quelle mention obligatoire?",
  "context": "Régime: Micro-entrepreneur, Services, CA: 45000€, Franchise TVA",
  "model": "gemini-1.5-flash"
}
EOF

# VAT Analysis
curl -X POST "$API_URL/api/ai/analyze-vat" \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "currentCA": 20000,
  "monthlyHistory": [
    {"month": "Jan", "amount": 3000},
    {"month": "Fév", "amount": 3500},
    {"month": "Mar", "amount": 3200}
  ],
  "activityType": "services"
}
EOF
```

---

## 🌐 Déploiement

### Déploiement Local

```bash
npm run api
# Serveur écoute http://localhost:3001
```

### Déploiement Production

#### Option 1: Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY server/ ./server/

ENV GEMINI_API_KEY=your_key
ENV API_PORT=3001

EXPOSE 3001
CMD ["node", "--loader", "ts-node/esm", "server/api.ts"]
```

```bash
docker build -t micro-api .
docker run -e GEMINI_API_KEY=xxx -p 3001:3001 micro-api
```

#### Option 2: Vercel / Netlify Functions

```typescript
// api/chat.ts (Vercel)
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  try {
    const { query } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
    });

    return res.status(200).json({ success: true, data: response.text });
  } catch (error) {
    return res.status(500).json({
      error: 'API Error',
      message: error.message,
    });
  }
}
```

#### Option 3: Cloud Run (Google Cloud)

```bash
# 1. Créer Dockerfile
# 2. Pusher vers Cloud Run
gcloud run deploy micro-api \
  --source . \
  --runtime nodejs20 \
  --set-env-vars GEMINI_API_KEY=xxx
```

---

## 📊 Monitoring & Logging

### Logs Structurés

Tous les appels incluent des timestamps et contexte :

```
[2026-02-17T10:45:30.123Z] ✅ Chat request recevée
{
  "model": "gemini-3-flash-preview",
  "queryLength": 156
}

[2026-02-17T10:45:32.456Z] ✅ Chat processed successfully
{
  "model": "gemini-3-flash-preview",
  "responseSize": 2340
}
```

### Healthcheck pour Monitoring

```bash
# Vérifier que l'API est opérationnelle
curl http://localhost:3001/health

# Intégration Prometheus / Grafana
# GET /health peut être utilisé comme readiness probe
```

---

## 🔄 Limitations & Quotas

| Aspect            | Limite                         | Notes                  |
| ----------------- | ------------------------------ | ---------------------- |
| Taille requête    | 4000 car (query)               | Ajustable dans le code |
| Taille réponse    | Pas de limite                  | Dépend de Gemini       |
| Rate limit        | 60/min (optionnel)             | Configurable           |
| Temps timeout     | 30s par défaut                 | Dépend de Node.js      |
| Modèles supportés | gemini-1.5-flash, pro, 3-flash | Ajoutables facilement  |

### Quotas Gemini API

Consulter [Google AI Studio Quotas](https://ai.google.dev/pricing)

---

## 🆘 Troubleshooting

### Erreur: "GEMINI_API_KEY non configurée"

```bash
# Solution: Configurer la clé
export GEMINI_API_KEY="your_api_key"
npm run api
```

### Erreur: "Port 3001 already in use"

```bash
# Solution: Utiliser un autre port
export API_PORT=3002
npm run api
```

### Réponse JSON invalide 400

```
Error: Réponse JSON invalide de l'API
```

**Cause**: Gemini retourne du texte au lieu de JSON  
**Solution**: Vérifier votre prompt, réduire la complexité du request JSON

### Rate limit atteint

```
Error: Trop de requêtes.
```

**Solution**: Espacer vos requêtes, implémenter un circuit-breaker côté client

---

## 📚 Ressources

- [Google AI Studio](https://ai.google.dev)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Types d'activité URSSAF](https://www.urssaf.fr)
- [Seuils TVA France 2026](https://www.service-public.fr)

---

## 📝 Changelog

### v1.0 (Février 2026)

✅ Validaton Zod pour toutes requêtes  
✅ Logging structuré avec timestamps  
✅ Rate limiting en mémoire (optionnel)  
✅ Endpoints `/api/ai/chat` et `/api/ai/analyze-vat`  
✅ Healthcheck `/health`  
✅ Gestion robuste des erreurs  
✅ Documentation complète

---

## 🤝 Support & Questions

- 📬 Issues: [GitHub Issues](https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource)
- 💬 Discussions: [GitHub Discussions](https://github.com/Thomasxxl02/MicroGestionFacile-base-OpenSource/discussions)
- 📧 Email: support@micro-gestion-facile.fr

---

**Made with ❤️ for French micro-entrepreneurs**
