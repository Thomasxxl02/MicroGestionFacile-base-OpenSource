import http from 'http';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

/**
 * Serveur proxy pour les appels API Gemini
 * ============================================
 * Objectives:
 * - 🔒 Sécurise les clés API en les gardant côté serveur (JAMAIS exposées au client)
 * - ✅ Valide strictement les requêtes avec Zod
 * - 📋 Logging structuré de tous les appels
 * - ⚡ Rate limiting optionnel pour prévenir les abus
 * - 🛡️ Gestion robuste des erreurs avec messages appropriés
 *
 * @see https://ai.google.dev/gemini-api/docs
 */

// ====== CONFIGURATION ======
const API_KEY = process.env.GEMINI_API_KEY || '';
const PORT = parseInt(process.env.API_PORT || '3001', 10);
const ENABLE_RATE_LIMIT = process.env.ENABLE_RATE_LIMIT === 'true';
const MAX_REQUESTS_PER_MINUTE = parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '60', 10);

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY non configurée dans les variables d'environnement");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// ====== LOGGING STRUCTURÉ ======
/**
 * Logger structuré pour mise en debug et auditage
 */

const logger = {
  info: (msg: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`[${timestamp}] ✅ ${msg}`, data || '');
  },
  warn: (msg: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();

    console.warn(`[${timestamp}] ⚠️  ${msg}`, data || '');
  },
  error: (msg: string, error?: unknown) => {
    const timestamp = new Date().toISOString();
    const errorMsg = error instanceof Error ? error.message : String(error);

    console.error(`[${timestamp}] ❌ ${msg}:`, errorMsg);
  },
};

// ====== RATE LIMITING ======
/**
 * Store simple pour rate limiting en mémoire
 * En production, utiliser Redis ou similar
 */
class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs = 60000; // 1 minute
  private maxRequests: number;

  constructor(maxRequests: number) {
    this.maxRequests = maxRequests;
  }

  isAllowed(clientId: string): boolean {
    if (!ENABLE_RATE_LIMIT) return true;

    const now = Date.now();
    const times = this.requests.get(clientId) || [];

    // Nettoyer les anciennes requêtes
    const recentTimes = times.filter((t) => now - t < this.windowMs);

    if (recentTimes.length >= this.maxRequests) {
      return false;
    }

    recentTimes.push(now);
    this.requests.set(clientId, recentTimes);
    return true;
  }

  getRemainingRequests(clientId: string): number {
    if (!ENABLE_RATE_LIMIT) return -1; // Illimité

    const now = Date.now();
    const times = this.requests.get(clientId) || [];
    const recentTimes = times.filter((t) => now - t < this.windowMs);
    return Math.max(0, this.maxRequests - recentTimes.length);
  }
}

const rateLimiter = new SimpleRateLimiter(MAX_REQUESTS_PER_MINUTE);

// ====== VALIDATION SCHEMAS (ZOD) ======

/**
 * Schema pour le endpoint /api/ai/chat
 */
const ChatRequestSchema = z.object({
  query: z
    .string()
    .min(1, 'Query ne peut pas être vide')
    .max(4000, 'Query trop long (max 4000 caractères)'),
  context: z.string().max(2000, 'Context trop long (max 2000 caractères)').optional(),
  model: z
    .enum(['gemini-3-flash-preview', 'gemini-1.5-flash', 'gemini-1.5-pro'])
    .default('gemini-3-flash-preview'),
  responseMimeType: z.enum(['text/plain', 'application/json']).default('text/plain'),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Inféré de ChatRequestSchema pour type-safety
type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Schema pour le endpoint /api/ai/analyze-vat
 */
const VatAnalysisSchema = z.object({
  currentCA: z.number().min(0, 'CA doit être >= 0').max(1000000, 'CA invalide'),
  monthlyHistory: z.array(
    z.object({
      month: z.string(),
      amount: z.number().min(0),
    })
  ),
  activityType: z.enum(['sales', 'services', 'mixed']),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Inféré de VatAnalysisSchema pour type-safety
type VatAnalysisRequest = z.infer<typeof VatAnalysisSchema>;

/**
 * Schema pour la réponse VAT Analysis
 */
const VatAnalysisResponseSchema = z.object({
  isLikelyToExceed: z.boolean(),
  monthsBeforeExceeding: z.number().nullable(),
  projectedCA: z.number(),
  recommendation: z.string(),
});

// ====== UTILITAIRES ======

/**
 * Valide et parse du JSON, retourne null si invalide
 */
const validateJSON = (text: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/**
 * Extrait l'IP ou l'identifiant du client pour rate limiting
 */
const getClientId = (req: http.IncomingMessage): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
};

/**
 * Lit le corps de la requête en entier
 */
const readBody = (req: http.IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 1e7) {
        // 10MB limit
        reject(new Error('Body trop grand'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
};

// ====== HANDLERS ======

/**
 * POST /api/ai/chat
 * Endpoint générique pour les conversations avec IA
 */
async function handleChat(req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    const clientId = getClientId(req);

    // Rate limiting
    if (!rateLimiter.isAllowed(clientId)) {
      logger.warn('Rate limit exceeded', { clientId });
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Trop de requêtes. Veuillez réessayer dans une minute.',
          remaining: rateLimiter.getRemainingRequests(clientId),
        })
      );
      return;
    }

    const body = await readBody(req);
    let payload: unknown;

    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'JSON invalide' }));
      return;
    }

    // Validation avec Zod
    const parseResult = ChatRequestSchema.safeParse(payload);
    if (!parseResult.success) {
      logger.warn('Invalid chat request', { errors: parseResult.error.errors });
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Validation échouée',
          details: parseResult.error.errors,
        })
      );
      return;
    }

    const { query, context, model, responseMimeType } = parseResult.data;

    const systemPrompt = `Tu es un assistant expert pour les auto-entrepreneurs en France.
Tu maîtrise:
- Les règles URSSAF et cotisations sociales
- Les seuils de TVA (Franchise en base 2026)
- Les plafonds de Chiffre d'Affaires micro-entrepreneur
- Les obligations comptables et de facturation
- Les déductions possibles

Réponds de manière concise, professionnelle et utile.
Utilise des exemples concrets quand pertinent.
${context ? `Contexte utilisateur: ${context}` : ''}`;

    logger.info('Chat request recevée', { model, queryLength: query.length });

    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: responseMimeType || 'text/plain',
      },
    });

    const responseText = response.text || "Désolé, je n'ai pas pu générer de réponse.";

    // Validation JSON si nécessaire
    if (responseMimeType === 'application/json') {
      const parsedJSON = validateJSON(responseText);
      if (!parsedJSON) {
        logger.warn('Invalid JSON response from Gemini');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: "Réponse JSON invalide de l'API",
            raw: responseText.substring(0, 500),
          })
        );
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          data: parsedJSON,
          meta: {
            model,
            requestSize: query.length,
            responseSize: responseText.length,
          },
        })
      );
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        data: responseText,
        meta: {
          model,
          requestSize: query.length,
          responseSize: responseText.length,
        },
      })
    );

    logger.info('Chat processed successfully', { model, responseSize: responseText.length });
  } catch (error) {
    logger.error('Chat handler error', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Erreur serveur',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    );
  }
}

/**
 * POST /api/ai/analyze-vat
 * Analyse prédictive des seuils TVA avec IA
 */
async function handleVatAnalysis(req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    const clientId = getClientId(req);

    // Rate limiting
    if (!rateLimiter.isAllowed(clientId)) {
      logger.warn('Rate limit exceeded on VAT analysis', { clientId });
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Trop de requêtes.',
          remaining: rateLimiter.getRemainingRequests(clientId),
        })
      );
      return;
    }

    const body = await readBody(req);
    let payload: unknown;

    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'JSON invalide' }));
      return;
    }

    // Validation
    const parseResult = VatAnalysisSchema.safeParse(payload);
    if (!parseResult.success) {
      logger.warn('Invalid VAT analysis request', { errors: parseResult.error.errors });
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Validation échouée',
          details: parseResult.error.errors,
        })
      );
      return;
    }

    const { currentCA, monthlyHistory, activityType } = parseResult.data;
    const threshold = activityType === 'sales' ? 91900 : 36800;

    logger.info('VAT analysis request', { activityType, currentCA, threshold });

    const prompt = `Analyse les données de CA suivantes pour micro-entrepreneur français:

Type d'activité: ${activityType === 'sales' ? 'Vente de marchandises' : 'Prestation de services'}
CA cumulé 2026: ${currentCA}€
Seuil TVA: ${threshold}€
Ratio utilisation: ${((currentCA / threshold) * 100).toFixed(1)}%

Historique CA par mois (2026):
${monthlyHistory.map((m) => `  ${m.month}: ${m.amount}€`).join('\n')}

Analyse et prédict:
1. Vais-je dépasser le seuil TVA avant fin 2026?
2. Si oui, dans combien de mois?
3. Quel est le CA projeté fin 2026?
4. Que faire pour optimiser? (rester franchise vs passer réel)

Réponds UNIQUEMENT en JSON structuré:
{
  "isLikelyToExceed": boolean,
  "monthsBeforeExceeding": number | null,
  "projectedCA": number,
  "recommendation": "string max 200 caractères"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawResponse = response.text || '{}';
    const parsedJSON = validateJSON(rawResponse);

    if (!parsedJSON) {
      logger.warn('Invalid JSON from VAT analysis API');
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Réponse JSON invalide',
          raw: rawResponse.substring(0, 300),
        })
      );
      return;
    }

    // Valider la réponse avec le schema
    const validateResponse = VatAnalysisResponseSchema.safeParse(parsedJSON);
    if (!validateResponse.success) {
      logger.warn('Invalid VAT response schema', { errors: validateResponse.error.errors });
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Réponse mal formée',
          details: validateResponse.error.errors,
        })
      );
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        data: validateResponse.data,
        meta: {
          analysisDate: new Date().toISOString(),
          threshold,
          activityType,
        },
      })
    );

    logger.info('VAT analysis completed', validateResponse.data);
  } catch (error) {
    logger.error('VAT analysis handler error', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Erreur serveur',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    );
  }
}

/**
 * GET /health
 * Healthcheck endpoint pour monitoring
 */
function handleHealth(_req: http.IncomingMessage, res: http.ServerResponse) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      apiKey: API_KEY ? 'configured' : 'missing',
      rateLimitEnabled: ENABLE_RATE_LIMIT,
    })
  );
}

// ====== SERVEUR HTTP ======

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  res.setHeader('X-API-Version', '1.0');

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Routing
  if (req.url === '/api/ai/chat' && req.method === 'POST') {
    await handleChat(req, res);
  } else if (req.url === '/api/ai/analyze-vat' && req.method === 'POST') {
    await handleVatAnalysis(req, res);
  } else if (req.url === '/health' && req.method === 'GET') {
    handleHealth(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Route not found',
        available: ['/api/ai/chat', '/api/ai/analyze-vat', '/health'],
      })
    );
  }
});

// ====== STARTUP ======

server.listen(PORT, () => {
  logger.info(`API Proxy démarré sur http://localhost:${PORT}`);
  logger.info('Configuration', {
    port: PORT,
    rateLimitEnabled: ENABLE_RATE_LIMIT,
    maxRequestsPerMinute: ENABLE_RATE_LIMIT ? MAX_REQUESTS_PER_MINUTE : 'unlimited',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  });
  logger.info('📍 Routes disponibles: POST /api/ai/chat, POST /api/ai/analyze-vat, GET /health');
  logger.info(
    "Variables d'environnement: GEMINI_API_KEY (requis), API_PORT, ENABLE_RATE_LIMIT, MAX_REQUESTS_PER_MINUTE, CORS_ORIGIN"
  );
});

server.on('error', (error) => {
  logger.error('Serveur error', error);
  process.exit(1);
});

export { server };
