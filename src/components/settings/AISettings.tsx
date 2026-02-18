import React from 'react';
import { Zap, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * AISettings Component
 *
 * ARCHITECTU RE CHANGÉE:
 * - Clés API supprimées du profil utilisateur
 * - Proxy serveur implémenté pour les appels API
 * - Validation JSON stricte des réponses
 *
 * Cette interface est maintenant une documentation pour les administrateurs.
 */

const AISettings: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* En-tête */}
      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500">
        <div className="flex items-center gap-5 mb-6">
          <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-premium">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Assistant IA Sécurisé</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              Powered by Google Gemini via Proxy Serveur
            </p>
          </div>
        </div>
      </div>

      {/* Message sécurité */}
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-[2.5rem] p-10 space-y-4">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
          <div>
            <h4 className="font-black text-slate-900 mb-2">🔒 Clés API Sécurisées</h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              Les clés API ne sont plus stockées côté client. Elles sont gérées uniquement par le
              serveur backend via des variables d&apos;environnement sécurisées.
            </p>
          </div>
        </div>
      </div>

      {/* Information techniques */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-[2.5rem] p-10 space-y-6">
        <div className="flex items-start gap-4">
          <Lock className="text-blue-600 shrink-0 mt-1" size={24} />
          <div className="flex-1">
            <h4 className="font-black text-slate-900 mb-3">Architecture Proxy</h4>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>
                  Client envoie des requêtes à{' '}
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">/api/ai/*</code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Proxy Vite (dev) ou serveur reverse proxy (prod) forward les requêtes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>
                  Serveur backend utilise{' '}
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">
                    GEMINI_API_KEY
                  </code>{' '}
                  en variable d&apos;env
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>Réponses validées avant retour au client</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Configuration du serveur */}
        <div className="bg-white rounded-[1.5rem] p-6 border border-blue-200 mt-6">
          <h5 className="font-black text-slate-900 text-sm mb-3">Configuration Serveur</h5>
          <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">
            {`# .env (serveur backend)
GEMINI_API_KEY=sk-...
API_PORT=3001

# Lancement
GEMINI_API_KEY=sk-... npm run api`}
          </pre>
        </div>
      </div>

      {/* Endpoints disponibles */}
      <div className="bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] p-10">
        <h4 className="font-black text-slate-900 mb-6">Endpoints Disponibles</h4>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              POST /api/ai/chat
            </p>
            <p className="text-sm text-slate-700">Chat avec l&apos;assistant IA</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              POST /api/ai/analyze-vat
            </p>
            <p className="text-sm text-slate-700">Analyse prédictive TVA (JSON validé)</p>
          </div>
        </div>
      </div>

      {/* Avertissement */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-10 space-y-4">
        <div className="flex items-start gap-4">
          <AlertCircle className="text-amber-600 shrink-0 mt-1" size={24} />
          <div>
            <h4 className="font-black text-slate-900 mb-2">⚠️ Important: Déploiement</h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              Assurez-vous que votre serveur backend est sécurisé et que{' '}
              <code className="bg-amber-100 px-2 py-1 rounded text-xs font-mono">
                GEMINI_API_KEY
              </code>{' '}
              n&apos;est JAMAIS exposée publiquement. Utilisez un reverse proxy (Nginx, CloudFlare)
              et HTTPS en production.
            </p>
          </div>
        </div>
      </div>

      {/* Docs */}
      <div className="text-center">
        <p className="text-xs text-slate-600 mb-4">Voir le guide complet d&apos;implémentation</p>
        <a
          href="/docs/ARCHITECTURE.md"
          className="inline-block px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 transition-colors"
        >
          📖 Lire la Documentation
        </a>
      </div>
    </div>
  );
};

export default AISettings;
