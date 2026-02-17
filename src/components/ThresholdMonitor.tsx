import React from 'react';
import { Euro, AlertTriangle, Info } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';

interface ThresholdItemProps {
  label: string;
  current: number;
  threshold: number;
  limit?: number; // Some thresholds have a 'base' and a 'limit' (like VAT in France)
  unit?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';
  icon?: React.ElementType;
}

const ThresholdItem: React.FC<ThresholdItemProps> = ({
  label,
  current,
  threshold,
  limit,
  unit = '€',
  color = 'blue',
  icon: Icon,
}) => {
  const percentage = Math.min((current / threshold) * 100, 100);
  const isNearThreshold = percentage > 80;
  const isOverThreshold = current > threshold;
  const isOverLimit = limit ? current > limit : isOverThreshold;

  const getStatusColor = () => {
    if (isOverLimit) return 'bg-destructive';
    if (isOverThreshold) return 'bg-amber-500';
    if (isNearThreshold) return 'bg-amber-400';

    // Map color prop to tailwind classes
    const colorMap = {
      blue: 'bg-primary',
      emerald: 'bg-emerald-500',
      amber: 'bg-amber-500',
      rose: 'bg-rose-500',
      violet: 'bg-violet-500',
    };
    return colorMap[color] || 'bg-primary';
  };

  const getBarColor = () => {
    if (isOverLimit) return 'text-destructive';
    if (isOverThreshold) return 'text-amber-600';
    if (isNearThreshold) return 'text-amber-500';

    const colorMap = {
      blue: 'text-primary',
      emerald: 'text-emerald-600',
      amber: 'text-amber-600',
      rose: 'text-rose-600',
      violet: 'text-violet-600',
    };
    return colorMap[color] || 'text-primary';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
          {Icon && (
            <div className={`p-2 rounded-xl bg-muted/50 ${getBarColor()}`}>
              <Icon size={18} />
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">
                {current.toLocaleString('fr-FR')} {unit}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                / {threshold.toLocaleString('fr-FR')} {unit}
              </span>
            </div>
          </div>
        </div>

        {isOverLimit ? (
          <Badge variant="red" dot>
            Dépassement
          </Badge>
        ) : isOverThreshold ? (
          <Badge variant="warning" dot>
            Seuil atteint
          </Badge>
        ) : isNearThreshold ? (
          <Badge variant="warning" dot>
            Approche
          </Badge>
        ) : (
          <Badge variant="emerald" dot>
            Ok
          </Badge>
        )}
      </div>

      <div className="relative pt-2">
        <div className="h-3 w-full bg-muted/30 rounded-full overflow-hidden p-0.5 border border-border/50">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getStatusColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {limit && limit > threshold && (
          <div
            className="absolute top-0 h-full border-r-2 border-dashed border-destructive/50 z-10"
            style={{ left: `${(threshold / limit) * 100}%` }}
            title={`Seuil de tolérance: ${limit}€`}
          />
        )}
      </div>

      <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter opacity-60">
        <span>0 {unit}</span>
        {isOverThreshold ? (
          <span className="text-destructive">Attention : Seuil dépassé</span>
        ) : (
          <span>
            Il reste {(threshold - current).toLocaleString('fr-FR')} {unit}
          </span>
        )}
        <span>
          {threshold.toLocaleString('fr-FR')} {unit}
        </span>
      </div>
    </div>
  );
};

interface ThresholdStatusItem {
  amount: number;
  threshold: number;
  percent: number;
  isOverLimit: boolean;
  limit?: number;
  isOverThreshold?: boolean;
}

interface ThresholdMonitorProps {
  caStatus: {
    sales: ThresholdStatusItem;
    services: ThresholdStatusItem;
    isOverLimit: boolean;
  };
  vatStatus: {
    sales: ThresholdStatusItem;
    services: ThresholdStatusItem;
    shouldPayVat: boolean;
  };
  activityType: 'sales' | 'services' | 'mixed';
}

const ThresholdMonitor: React.FC<ThresholdMonitorProps> = ({
  caStatus,
  vatStatus,
  activityType,
}) => {
  return (
    <Card
      title="Surveillance des Seuils"
      subtitle="Plafonds annuels et franchises de TVA"
      className="h-full"
    >
      <div className="space-y-10">
        {/* Section CA Micro-Entrepreneur */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Euro size={16} className="text-primary" />
            <h4 className="text-sm font-black uppercase tracking-widest text-foreground/70">
              Chiffre d'Affaires
            </h4>
          </div>

          {(activityType === 'services' || activityType === 'mixed') && (
            <ThresholdItem
              label="Prestations de Services"
              current={caStatus.services.amount}
              threshold={caStatus.services.threshold}
              color="blue"
              icon={Euro}
            />
          )}

          {(activityType === 'sales' || activityType === 'mixed') && (
            <ThresholdItem
              label="Achat / Revente"
              current={caStatus.sales.amount}
              threshold={caStatus.sales.threshold}
              color="emerald"
              icon={Euro}
            />
          )}

          {activityType === 'mixed' && (
            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-3 items-start">
              <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-900/60 dark:text-blue-200/60 leading-relaxed">
                En activité mixte, votre CA global ne doit pas dépasser 188 700 € et la partie
                services est limitée à 77 700 €.
              </p>
            </div>
          )}
        </section>

        <hr className="border-border/50" />

        {/* Section TVA */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-violet-500" />
            <h4 className="text-sm font-black uppercase tracking-widest text-foreground/70">
              Franchise de TVA
            </h4>
          </div>

          {(activityType === 'services' || activityType === 'mixed') && (
            <ThresholdItem
              label="Seuil Services"
              current={vatStatus.services.amount}
              threshold={vatStatus.services.threshold}
              limit={vatStatus.services.limit}
              color="violet"
              icon={AlertTriangle}
            />
          )}

          {(activityType === 'sales' || activityType === 'mixed') && (
            <ThresholdItem
              label="Seuil Ventes"
              current={vatStatus.sales.amount}
              threshold={vatStatus.sales.threshold}
              limit={vatStatus.sales.limit}
              color="violet"
              icon={AlertTriangle}
            />
          )}
        </section>
      </div>
    </Card>
  );
};

export default ThresholdMonitor;
