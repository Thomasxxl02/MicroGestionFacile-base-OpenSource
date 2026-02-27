import React from 'react';
import { BrainCircuit } from 'lucide-react';
import Badge from '../ui/Badge';
import { VatPrediction } from '../../services/geminiService';

interface DashboardVatAlertProps {
  vatPrediction: VatPrediction | null;
}

const DashboardVatAlert: React.FC<DashboardVatAlertProps> = ({ vatPrediction }) => {
  if (!vatPrediction?.isLikelyToExceed || (vatPrediction.monthsBeforeExceeding ?? 99) > 3) {
    return null;
  }

  return (
    <div className="relative group overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-4xl p-8 flex items-start gap-6 shadow-premium transition-all hover:shadow-2xl">
      <div className="bg-amber-500 p-4 rounded-3xl shadow-lg shadow-amber-500/30 text-white animate-pulse">
        <BrainCircuit className="w-8 h-8" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 uppercase tracking-tight">
            Analyse Prédictive : TVA
          </h3>
          <Badge variant="warning" dot>
            IA Gemini
          </Badge>
        </div>
        <p className="text-amber-800/80 dark:text-amber-200/80 text-sm mb-4 leading-relaxed max-w-3xl">
          Votre croissance actuelle indique un passage probable au régime de TVA dans environ{' '}
          <span className="font-black text-amber-600 dark:text-amber-400">
            {vatPrediction.monthsBeforeExceeding} mois
          </span>
          . Projection de fin d&apos;année :{' '}
          <span className="font-black">{vatPrediction.projectedCA.toLocaleString('fr-FR')} €</span>.
        </p>
        <div className="bg-white/40 dark:bg-amber-900/20 border border-amber-500/10 p-4 rounded-2xl text-xs font-medium text-amber-800 dark:text-amber-200">
          <span className="font-black uppercase tracking-widest mr-2 opacity-60">Conseil :</span>
          {vatPrediction.recommendation}
        </div>
      </div>
    </div>
  );
};

export default DashboardVatAlert;
