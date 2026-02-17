import { GoogleGenAI } from '@google/genai';

// Initialize with a helper to support dynamic keys from user settings
const getAIInstance = (customKey?: string) => {
  const apiKey = customKey || process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export const generateAssistantResponse = async (
  query: string,
  context?: string,
  userKey?: string
): Promise<string> => {
  try {
    const ai = getAIInstance(userKey);
    const model = 'gemini-3-flash-preview';

    const systemPrompt = `Tu es un assistant expert pour les auto-entrepreneurs en France.
    Tu connais les règles de l'URSSAF, les seuils de TVA (Franchise en base), les plafonds de Chiffre d'Affaires, et les obligations de facturation.
    Réponds de manière concise, professionnelle et utile.
    Si on te demande de rédiger un email ou un texte, fais-le avec un ton courtois.
    Contexte actuel de l'utilisateur (si pertinent) : ${context || 'Aucun contexte spécifique'}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster simple Q&A
      },
    });

    return response.text || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error: unknown) {
    console.error('Erreur Gemini:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('API_KEY_INVALID')) {
      return 'Clé API invalide. Veuillez vérifier vos réglages.';
    }
    return "Une erreur est survenue lors de la consultation de l'assistant IA.";
  }
};

export interface VatPrediction {
  isLikelyToExceed: boolean;
  monthsBeforeExceeding: number | null;
  recommendation: string;
  projectedCA: number;
}

export const analyzePredictiveVat = async (
  currentCA: number,
  monthlyHistory: { month: string; amount: number }[],
  activityType: 'sales' | 'services' | 'mixed',
  userKey?: string
): Promise<VatPrediction> => {
  try {
    const ai = getAIInstance(userKey);
    const threshold = activityType === 'sales' ? 91900 : 36800;

    const prompt = `Analyse les données de Chiffre d'Affaires suivantes pour un micro-entrepreneur en France (${activityType === 'sales' ? 'Vente de marchandises' : 'Prestation de services'}) :
    CA actuel cumulé cette année : ${currentCA}€
    Historique mensuel : ${JSON.stringify(monthlyHistory)}
    Seuil de franchise de TVA : ${threshold}€

    Prédit si l'utilisateur va dépasser le seuil d'ici la fin de l'année. 
    Réponds uniquement au format JSON avec ces clés : 
    "isLikelyToExceed" (boolean), 
    "monthsBeforeExceeding" (number ou null s'il ne dépasse pas), 
    "projectedCA" (number pour la fin d'année),
    "recommendation" (string courte sur le passage au régime réel).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const data = JSON.parse(response.text || '{}');
    return {
      isLikelyToExceed: data.isLikelyToExceed || false,
      monthsBeforeExceeding: data.monthsBeforeExceeding ?? null,
      projectedCA: data.projectedCA || currentCA,
      recommendation: data.recommendation || 'Continuez à suivre votre CA régulièrement.',
    };
  } catch (error) {
    console.error('Erreur Analyse TVA:', error);
    return {
      isLikelyToExceed: false,
      monthsBeforeExceeding: null,
      projectedCA: currentCA,
      recommendation: "Impossible de générer l'analyse pour le moment.",
    };
  }
};

export const ocrExpense = async (
  imageBase64: string,
  userKey?: string
): Promise<{
  description: string;
  amount: number;
  vatAmount: number;
  category: string;
  date: string;
  supplierName?: string;
} | null> => {
  try {
    const ai = getAIInstance(userKey);

    // Clean base64 string if it contains data prefix
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const prompt = `Analyse cette image de ticket de caisse ou facture d'achat.
    Extrais les informations suivantes au format JSON :
    - description (nom du marchand ou brièvement l'objet)
    - amount (montant TOTAL TTC en nombre)
    - vatAmount (montant de la TVA total en nombre)
    - category (choisis parmi : Achats, Restaurant, Transport, Fournitures, Services, Autre)
    - date (au format YYYY-MM-DD)
    - supplierName (le nom propre du fournisseur/marchand, ex: "Amazon", "Total", "Leroy Merlin")`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg',
          },
        },
        { text: prompt },
      ],
    });

    // Use a regex to extract JSON from text if it's wrapped in markers
    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);
    return {
      description: data.description || 'Dépense OCR',
      amount: Number(data.amount) || 0,
      vatAmount: Number(data.vatAmount) || 0,
      category: data.category || 'Achats',
      date: data.date || new Date().toISOString().split('T')[0],
      supplierName: data.supplierName,
    };
  } catch (error) {
    console.error('Erreur OCR Gemini:', error);
    return null;
  }
};

export const suggestInvoiceDescription = async (
  clientName: string,
  serviceType: string,
  userKey?: string
): Promise<string> => {
  try {
    const ai = getAIInstance(userKey);
    const prompt = `Génère une description professionnelle courte pour une ligne de facture destinée au client "${clientName}" pour un service de type : "${serviceType}". 
     La description doit être claire et formelle. Ne donne que la description, pas de guillemets.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || serviceType;
  } catch (error) {
    console.error('Erreur Gemini:', error);
    return serviceType;
  }
};
