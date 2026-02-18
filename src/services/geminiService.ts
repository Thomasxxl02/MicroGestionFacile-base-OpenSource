import { logger } from './loggerService';

// Configuration du proxy API
const API_PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001';

interface AIProxyResponse {
  success: boolean;
  data?: string;
  error?: string;
  message?: string;
}

export const generateAssistantResponse = async (
  query: string,
  context?: string,
  _userKey?: string // Ignoré - utiliser le proxy serveur
): Promise<string> => {
  try {
    const response = await fetch(`${API_PROXY_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        context,
        model: 'gemini-3-flash-preview',
        responseMimeType: 'text/plain',
      }),
    });

    if (!response.ok) {
      const error = (await response.json()) as AIProxyResponse;
      logger.error('Erreur API Proxy', new Error(error.message || 'Erreur inconnue'));
      return "Une erreur est survenue lors de la consultation de l'assistant IA.";
    }

    const result = (await response.json()) as AIProxyResponse;
    return result.data || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Erreur Gemini Service', errorObj);
    return "Une erreur est survenue lors de la consultation de l'assistant IA.";
  }
};

export interface VatPrediction {
  isLikelyToExceed: boolean;
  monthsBeforeExceeding: number | null;
  recommendation: string;
  projectedCA: number;
}

const isValidVatPrediction = (data: unknown): data is VatPrediction => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.isLikelyToExceed === 'boolean' &&
    (obj.monthsBeforeExceeding === null || typeof obj.monthsBeforeExceeding === 'number') &&
    typeof obj.recommendation === 'string' &&
    typeof obj.projectedCA === 'number'
  );
};

export const analyzePredictiveVat = async (
  currentCA: number,
  monthlyHistory: Array<{ month: string; amount: number }>,
  activityType: 'sales' | 'services' | 'mixed',
  _userKey?: string // Ignoré - utiliser le proxy serveur
): Promise<VatPrediction> => {
  try {
    const response = await fetch(`${API_PROXY_URL}/api/ai/analyze-vat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentCA,
        monthlyHistory,
        activityType,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = (await response.json()) as { success: boolean; data: unknown };

    // Validation stricte du JSON retourné
    if (!result.success || !isValidVatPrediction(result.data)) {
      logger.error('Validation échouée pour VatPrediction', new Error('Format invalide'));
      return {
        isLikelyToExceed: false,
        monthsBeforeExceeding: null,
        projectedCA: currentCA,
        recommendation: "Impossible de générer l'analyse pour le moment.",
      };
    }

    return result.data as VatPrediction;
  } catch (error) {
    logger.error('Erreur Analyse TVA', error instanceof Error ? error : new Error(String(error)));
    return {
      isLikelyToExceed: false,
      monthsBeforeExceeding: null,
      projectedCA: currentCA,
      recommendation: "Impossible de générer l'analyse pour le moment.",
    };
  }
};

export const ocrExpense = async (
  _imageBase64: string,
  _userKey?: string // Ignoré - utiliser le proxy serveur
): Promise<{
  description: string;
  amount: number;
  vatAmount: number;
  category: string;
  date: string;
  supplierName?: string;
} | null> => {
  // Note: OCR via le proxy n'est pas encore implémenté
  // Cette fonction reste côté client pour l'instant ou doit être migrée au serveur proxy
  logger.warn('OCR Gemini non disponible - utiliser le serveur proxy Gemini Vision');
  return null;
};

export const suggestInvoiceDescription = async (
  clientName: string,
  serviceType: string,
  _userKey?: string // Ignoré - utiliser le proxy serveur
): Promise<string> => {
  try {
    const response = await fetch(`${API_PROXY_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `Génère une description professionnelle courte pour une ligne de facture destinée au client "${clientName}" pour un service de type : "${serviceType}". La description doit être claire et formelle. Ne donne que la description, pas de guillemets.`,
        model: 'gemini-3-flash-preview',
        responseMimeType: 'text/plain',
      }),
    });

    if (!response.ok) {
      return serviceType;
    }

    const result = (await response.json()) as AIProxyResponse;
    return result.data?.trim() || serviceType;
  } catch (error) {
    logger.error(
      'Erreur génération description',
      error instanceof Error ? error : new Error(String(error))
    );
    return serviceType;
  }
};
