import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Zap, ExternalLink, Check, Lock } from 'lucide-react';
import { UserProfile } from '../../types';

interface AIProvider {
  id: 'gemini' | 'chatgpt' | 'claude' | 'mistral';
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  apiKeyField: keyof UserProfile;
  apiUrl: string;
  documentation: string;
  description: string;
  features: string[];
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✨',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    apiKeyField: 'geminiKey',
    apiUrl: 'https://aistudio.google.com/app/apikey',
    documentation: 'https://cloud.google.com/docs/gemini/quickstart',
    description: 'IA multimodale performante et rapide',
    features: ['Analyse en temps réel', "Traitement d'images", 'API gratuite disponible'],
  },
  {
    id: 'chatgpt',
    name: 'OpenAI ChatGPT',
    icon: '🤖',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    apiKeyField: 'chatgptKey',
    apiUrl: 'https://platform.openai.com/api-keys',
    documentation: 'https://platform.openai.com/docs/guides/gpt',
    description: 'IA généraliste puissante et fiable',
    features: ['GPT-4 ultra-performant', 'Fine-tuning disponible', 'Stable et prédictible'],
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: '🧠',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    apiKeyField: 'claudeKey',
    apiUrl: 'https://console.anthropic.com/keys',
    documentation: 'https://docs.anthropic.com/en/docs/about-claude/models/latest',
    description: 'IA sûre avec excellente sensibilité contextuelle',
    features: ['Context window énorme', 'Excellente rédaction', 'Respecte les instructions'],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '⚡',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    apiKeyField: 'mistralKey',
    apiUrl: 'https://console.mistral.ai/api-keys/',
    documentation: 'https://docs.mistral.ai/getting-started/quickstart/',
    description: 'IA performante et économe, alternative européenne',
    features: ['Très rapide', 'Coûts réduits', 'Modèles innovants'],
  },
];

const AISettings: React.FC = () => {
  const { register, watch } = useFormContext<UserProfile>();

  const selectedAI = watch('defaultAI') || 'gemini';
  const currentProvider = AI_PROVIDERS.find((p) => p.id === selectedAI);

  const getApiKeyValue = watch(
    selectedAI === 'gemini'
      ? 'geminiKey'
      : selectedAI === 'chatgpt'
        ? 'chatgptKey'
        : selectedAI === 'claude'
          ? 'claudeKey'
          : 'mistralKey'
  );
  const isConfigured = Boolean(getApiKeyValue);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Sélecteur d'IA */}
      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500">
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-premium">
            <Zap size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Assistant IA
            </h2>
            <p className="text-slate-500 font-medium">Choisissez votre provider IA préféré</p>
          </div>
        </div>

        {/* Sélecteur d'IA */}
        <div className="space-y-4 mb-8">
          <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            Provider IA Principal
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AI_PROVIDERS.map((provider) => (
              <label
                key={provider.id}
                className={`relative group cursor-pointer p-5 rounded-2xl border-2 transition-all ${
                  selectedAI === provider.id
                    ? `${provider.bgColor} ${provider.borderColor} border-2`
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  {...register('defaultAI')}
                  value={provider.id}
                  className="hidden"
                />
                <div className="flex items-start gap-4">
                  <div className="text-3xl mt-1">{provider.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-black text-sm uppercase tracking-wider ${provider.color}`}
                      >
                        {provider.name}
                      </h3>
                      {isConfigured && selectedAI === provider.id && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full">
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-700">Configuré</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mb-2">
                      {provider.description}
                    </p>
                    <ul className="space-y-1">
                      {provider.features.map((feature) => (
                        <li key={feature} className="text-[10px] text-slate-500 font-medium">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {selectedAI === provider.id && (
                    <div
                      className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center border-2 ${provider.color}`}
                    >
                      <Check size={14} className={provider.color} />
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Clé API dynamique */}
        {currentProvider && (
          <div className="space-y-4 border-t-2 border-slate-100 pt-8">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Clé API {currentProvider.name}
              </label>
              <a
                href={currentProvider.apiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-bold uppercase tracking-widest"
              >
                Obtenir une clé
                <ExternalLink size={14} />
              </a>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                {...register(currentProvider.apiKeyField as never)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                placeholder={`Entrez votre clé API ${currentProvider.name}`}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium ml-1">
              {isConfigured ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check size={12} /> Clé API configurée et sécurisée
                </span>
              ) : (
                <>
                  Votre clé API est stockée localement et ne sera jamais transmise à nos serveurs.
                  <a
                    href={currentProvider.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-slate-600 hover:text-slate-900 underline font-bold"
                  >
                    Documentation complète →
                  </a>
                </>
              )}
            </p>
          </div>
        )}

        {/* Informations supplémentaires */}
        <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <h4 className="font-black text-sm text-blue-900 uppercase tracking-wide mb-2">
            💡 Info : Multiple IA
          </h4>
          <p className="text-sm text-blue-800 font-medium">
            Vous pouvez configurer plusieurs clés API. Le provider sélectionné ci-dessus sera
            utilisé par défaut pour l'assistant intelligent.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
