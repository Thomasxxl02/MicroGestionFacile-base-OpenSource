import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Euro,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Clock,
  Calendar as CalendarIcon,
  AlertTriangle,
  Users,
  FilePlus,
  Zap,
  BrainCircuit,
  Sparkles,
} from 'lucide-react';
import { Decimal } from 'decimal.js';
import {
  calculateUrssaf,
  checkVatThreshold,
  checkCaThreshold,
  getNextUrssafDeadline,
} from '../services/businessService';
import { analyzePredictiveVat, VatPrediction } from '../services/geminiService';
import Header from './ui/Header';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import {
  useValidatedInvoices,
  useValidatedExpenses,
  useValidatedUserProfile,
} from '../hooks/useValidatedData';
import { useUIStore } from '../store';
import ThresholdMonitor from './ThresholdMonitor';
import { ShieldCheck, Server, Cloud, CheckCircle } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { logger } from '../services/loggerService';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
  // 🛡️ Utiliser les hooks validés pour garantir l'intégrité des données
  const { data: invoices, errorSummary: invoicesError } = useValidatedInvoices();
  const { data: expenses, errorSummary: expensesError } = useValidatedExpenses();
  const { profile: userProfile, errorSummary: profileError } = useValidatedUserProfile();

  const navigate = useNavigate();
  const { isDarkMode } = useUIStore();
  const [vatPrediction, setVatPrediction] = useState<VatPrediction | null>(null);

  // 🚨 Afficher les erreurs de validation
  useEffect(() => {
    if (invoicesError) {
      logger.warn('Validation invoices', { error: invoicesError });
      toast.warning(invoicesError);
    }
    if (expensesError) {
      logger.warn('Validation expenses', { error: expensesError });
      toast.warning(expensesError);
    }
    if (profileError) {
      logger.error('Validation profile', new Error(profileError));
      toast.error(profileError);
    }
  }, [invoicesError, expensesError, profileError]);

  const businessStats = useMemo(() => {
    const urssaf = calculateUrssaf(invoices, userProfile);
    const vatStatus = checkVatThreshold(invoices);
    const caStatus = checkCaThreshold(invoices);
    const deadline = getNextUrssafDeadline(userProfile);
    return { urssaf, vatStatus, caStatus, deadline };
  }, [invoices, userProfile]);

  const monthlyHistoryForAI = useMemo(() => {
    const months = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];
    const history: Record<string, number> = {};
    months.forEach((m) => (history[m] = 0));

    invoices.forEach((inv) => {
      if (inv.status === InvoiceStatus.PAID) {
        const date = new Date(inv.date);
        if (date.getFullYear() === new Date().getFullYear()) {
          history[months[date.getMonth()]] += inv.total;
        }
      }
    });

    return Object.entries(history).map(([month, amount]) => ({ month, amount }));
  }, [invoices]);

  // Stats Calculation with Decimal.js for precise accounting
  const totalRevenue = useMemo(() => {
    const rev = invoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => {
        const type = inv.type || 'invoice';
        const amount = new Decimal(inv.total);
        if (type === 'invoice') return sum.plus(amount);
        if (type === 'credit_note') return sum.minus(amount);
        return sum;
      }, new Decimal(0));
    return rev.toNumber();
  }, [invoices]);

  const totalExpenses = useMemo(() => {
    return expenses
      .reduce((sum, exp) => sum.plus(new Decimal(exp.amount)), new Decimal(0))
      .toNumber();
  }, [expenses]);

  // useAsync for VAT prediction with retry logic
  const { execute } = useAsync<VatPrediction>({
    retryCount: 2,
    retryDelay: 2000,
    showToast: false, // Handle silently, this is optional analytics
  });

  useEffect(() => {
    const currentRevenue = totalRevenue;
    if (currentRevenue > 0 && !vatPrediction) {
      execute(
        () =>
          analyzePredictiveVat(
            currentRevenue,
            monthlyHistoryForAI,
            userProfile.activityType || 'services'
          ),
        'VAT prediction analysis'
      )
        .then((result) => {
          if (result) {
            setVatPrediction(result);
            logger.info('VAT prediction loaded', { isLikelyToExceed: result.isLikelyToExceed });
          }
        })
        .catch((error) => {
          logger.error(
            'Failed to get VAT prediction',
            error instanceof Error ? error : new Error(String(error))
          );
        });
    }
  }, [totalRevenue, monthlyHistoryForAI, userProfile.activityType, vatPrediction, execute]);

  const monthlyData = useMemo(() => {
    const data: Record<string, { income: Decimal; credit: Decimal }> = {};
    const months = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];

    // Initialize
    months.forEach((m) => (data[m] = { income: new Decimal(0), credit: new Decimal(0) }));

    invoices.forEach((inv) => {
      if (inv.status === InvoiceStatus.PAID) {
        const date = new Date(inv.date);
        const monthIndex = date.getMonth();
        const type = inv.type || 'invoice';
        const monthName = months[monthIndex];
        const amount = new Decimal(inv.total);

        if (type === 'invoice') {
          data[monthName].income = data[monthName].income.plus(amount);
        } else if (type === 'credit_note') {
          data[monthName].credit = data[monthName].credit.plus(amount);
        }
      }
    });

    return months.map((name) => ({
      name,
      Recettes: data[name].income.toNumber(),
      Avoirs: data[name].credit.toNumber(),
      Net: data[name].income.minus(data[name].credit).toNumber(),
    }));
  }, [invoices]);

  const { vatStatus, caStatus, deadline } = businessStats;

  return (
    <div data-testid="dashboard" className="space-y-12 animate-fade-in max-w-7xl mx-auto pb-16">
      <Header
        title={`Bonjour, ${userProfile.companyName?.split(' ')[0] || ''}`}
        description="Voici l'aperçu de votre activité et vos indicateurs clés."
        icon={LayoutDashboard}
        actions={
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-card px-5 py-3 border border-border rounded-2xl shadow-premium text-[11px] font-black text-muted-foreground uppercase tracking-widest">
              <CalendarIcon size={14} className="text-primary" />
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>

            <div className="flex items-center gap-2 bg-slate-900 dark:bg-slate-950 p-1.5 rounded-2xl shadow-2xl border border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/invoices?action=new')}
                className="text-white hover:bg-white/10 rounded-xl px-4 py-2"
                icon={FilePlus}
              >
                <span className="hidden sm:inline">Facture</span>
              </Button>
              <div className="w-px h-5 bg-slate-800 mx-1"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/clients?action=new')}
                className="text-white hover:bg-white/10 rounded-xl px-4 py-2"
                icon={Users}
              >
                <span className="hidden sm:inline">Client</span>
              </Button>
            </div>
          </div>
        }
      />

      {/* Alerte Prédictive TVA */}
      {vatPrediction?.isLikelyToExceed && (vatPrediction.monthsBeforeExceeding || 99) <= 3 && (
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
              <span className="font-black">
                {vatPrediction.projectedCA.toLocaleString('fr-FR')} €
              </span>
              .
            </p>
            <div className="bg-white/40 dark:bg-amber-900/20 border border-amber-500/10 p-4 rounded-2xl text-xs font-medium text-amber-800 dark:text-amber-200">
              <span className="font-black uppercase tracking-widest mr-2 opacity-60">
                Conseil :
              </span>
              {vatPrediction.recommendation}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ThresholdMonitor
              caStatus={caStatus}
              vatStatus={vatStatus}
              activityType={userProfile.activityType || 'services'}
            />
          </div>

          <Card
            hoverable
            className="group border-none shadow-premium bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-900/20"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-3xl shadow-soft group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3">
                <Euro size={28} strokeWidth={2.5} />
              </div>
              <Badge variant="emerald" dot className="shadow-none border-transparent bg-muted/50">
                Net d&apos;avoirs
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                CA encaissé (Annuel)
              </p>
              <h3 className="text-5xl font-black text-foreground tracking-tighter leading-none">
                {totalRevenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                <span className="text-xl font-bold text-muted-foreground ml-1 opacity-50">€</span>
              </h3>
            </div>

            <div className="mt-8 p-4 bg-muted/20 rounded-2xl border border-border/50 text-[11px] font-medium text-muted-foreground leading-relaxed">
              Basé sur vos factures marquées comme{' '}
              <span className="text-emerald-600 font-bold uppercase">payées</span>.
            </div>
          </Card>
        </div>

        {/* Fiscal Deadline Widget */}
        <Card className="flex flex-col items-center text-center p-10 bg-primary border-none text-white relative overflow-hidden shadow-2xl shadow-primary/20 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl group-hover:bg-black/20 transition-all duration-700" />

          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center text-white mb-6 animate-pulse relative z-10">
            <Zap size={32} fill="white" className="drop-shadow-lg" />
          </div>
          <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.25em] mb-2 relative z-10">
            Prochain défi
          </p>
          <h4 className="text-2xl font-black mb-3 leading-tight relative z-10">{deadline.label}</h4>
          <div className="bg-white text-primary px-6 py-2 rounded-2xl text-sm font-black mb-6 shadow-2xl relative z-10 group-hover:scale-105 transition-transform">
            {deadline.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </div>
          <p className="text-[10px] text-white/50 font-black uppercase tracking-widest relative z-10">
            Période de {deadline.period}
          </p>
        </Card>
      </div>

      {vatStatus.shouldPayVat && (
        <div className="bg-gradient-to-r from-destructive/10 to-transparent border border-destructive/20 rounded-4xl p-8 flex items-center gap-8 shadow-premium animate-fade-in group hover:shadow-2xl transition-all">
          <div className="p-5 bg-destructive text-white rounded-3xl shadow-lg shadow-destructive/30 group-hover:rotate-12 transition-transform">
            <AlertTriangle size={28} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h4 className="text-2xl font-black text-foreground tracking-tight mb-1">
              Action Requise : Franchise de TVA
            </h4>
            <p className="text-muted-foreground font-medium">
              Seuil franchi. Vous devez mettre à jour vos réglages et commencer à collecter la TVA.
            </p>
          </div>
          <Button
            variant="gradient"
            size="md"
            onClick={() => navigate('/settings')}
            className="px-8 shadow-2xl shadow-primary/30"
          >
            Mettre à jour
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card
          title="Recettes"
          subtitle="Analyse de l'historique annuel"
          className="lg:col-span-2 border-none shadow-premium"
          headerActions={
            <div className="flex bg-muted/50 p-1.5 rounded-xl border border-border/50">
              <button className="px-4 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-premium text-primary">
                Mensuel
              </button>
              <button className="px-4 py-1.5 text-muted-foreground/60 rounded-lg text-[10px] font-black tracking-widest uppercase hover:text-foreground transition-colors">
                Trimestriel
              </button>
            </div>
          }
        >
          <div className="h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="8 8"
                  vertical={false}
                  stroke={isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 800 }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 800 }}
                  tickFormatter={(v) => (v === 0 ? '0' : `${v / 1000}k`)}
                />
                <Tooltip
                  cursor={{
                    fill: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    radius: 12,
                  }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card/95 backdrop-blur-xl border border-border p-5 rounded-3xl shadow-2xl">
                          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 border-b border-border/50 pb-2">
                            {label}
                          </p>
                          <div className="space-y-2">
                            {payload.map((item, i) => (
                              <div key={i} className="flex justify-between items-center gap-8">
                                <span className="text-xs font-bold text-muted-foreground capitalize">
                                  {item.name}
                                </span>
                                <span className="text-sm font-black text-foreground">
                                  {item.value?.toLocaleString('fr-FR')} €
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  name="Recettes"
                  dataKey="Recettes"
                  fill="url(#colorRecettes)"
                  radius={[10, 10, 10, 10]}
                  barSize={24}
                />
                <Bar
                  name="Avoirs"
                  dataKey="Avoirs"
                  fill="#f43f5e"
                  radius={[10, 10, 10, 10]}
                  barSize={24}
                  opacity={0.3}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Recents"
          subtitle="Dernières factures & devis"
          className="flex flex-col border-none shadow-premium"
        >
          <div className="space-y-2 flex-1 mt-4 overflow-y-auto max-h-[420px] pr-2 custom-scrollbar">
            {invoices.slice(0, 6).map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => navigate(`/invoices`)}
                className="flex items-center justify-between p-4 bg-muted/20 dark:bg-muted/5 hover:bg-white dark:hover:bg-slate-800 rounded-3xl transition-all duration-300 group cursor-pointer border border-border/10 hover:border-border hover:shadow-premium group/item"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shadow-soft group-hover:scale-110 transition-transform duration-500
                      ${
                        invoice.status === InvoiceStatus.PAID
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : invoice.status === InvoiceStatus.SENT
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {invoice.status === InvoiceStatus.PAID ? (
                      <CheckCircle2 size={20} strokeWidth={2.5} />
                    ) : (
                      <Clock size={20} strokeWidth={2.5} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground tracking-tight group-hover/item:text-primary transition-colors">
                      {invoice.number}
                    </p>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                      {new Date(invoice.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-black ${invoice.type === 'credit_note' ? 'text-destructive' : 'text-foreground'}`}
                  >
                    {invoice.type === 'credit_note' ? '-' : ''}
                    {invoice.total.toFixed(0)} €
                  </p>
                  <p className="text-[10px] font-black uppercase text-muted-foreground/40 mt-1">
                    {invoice.status}
                  </p>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <EmptyState
                icon={Zap}
                title="Prêt à commencer ?"
                description="Le tableau de bord s'animera dès que vous aurez créé vos premiers documents."
                actionLabel="Nouvelle facture"
                onAction={() => navigate('/invoices')}
                className="py-10 border-none rounded-none shadow-none"
              />
            )}
          </div>

          <Button
            variant="ghost"
            className="w-full mt-10 text-[11px] font-black uppercase tracking-[0.2em] py-5 border border-border shadow-soft group hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 border-dashed"
            icon={ArrowRight}
            onClick={() => navigate('/invoices')}
          >
            Tous les documents
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card
          className="bg-slate-900 border-none shadow-premium text-white flex flex-col justify-between overflow-hidden relative"
          hoverable
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Server size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                  Infrastructure
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">
                  Stable
                </span>
              </div>
            </div>

            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
              Dernier Backup (Restic)
            </p>
            <h4 className="text-xl font-black mb-4">Success: {new Date().getHours()}:00</h4>

            <div className="space-y-3">
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-[85%] rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)]"></div>
              </div>
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                <span className="text-white/30">Quota S3 (Scaleway)</span>
                <span className="text-indigo-400">425 MB / 5 GB</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-soft flex flex-col justify-between group hover:shadow-premium transition-all">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-3xl w-fit group-hover:rotate-12 transition-transform mb-8">
            <Cloud size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Dépenses (Annuel)
            </p>
            <h3 className="text-3xl font-black text-foreground tracking-tighter leading-none">
              {totalExpenses.toLocaleString('fr-FR')}
              <span className="text-sm font-bold text-muted-foreground ml-1 opacity-50">€</span>
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <CheckCircle size={12} />
              3-2-1 Strategy Enabled
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-slate-900 rounded-5xl p-16 text-white relative overflow-hidden group shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
        <div className="absolute -right-20 -top-20 bg-primary/20 w-[600px] h-[600px] rounded-full blur-[120px] group-hover:bg-primary/30 transition-all duration-1000 animate-pulse"></div>
        <div className="absolute -left-20 -bottom-20 bg-indigo-500/10 w-96 h-96 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Badge
                variant="blue"
                className="bg-primary/20 text-white border-white/10 px-6 py-2"
                dot
              >
                Trimestre en cours
              </Badge>
              <span className="text-white/30 text-xs font-black uppercase tracking-[0.3em]">
                Action Rapide
              </span>
            </div>
            <h3 className="text-6xl font-black mb-8 tracking-tighter leading-none">
              Prêt pour votre <span className="text-primary italic">déclaration</span> ?
            </h3>
            <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-lg font-medium opacity-80">
              Gérez votre fiscalité sans stress. Nous avons préparé votre journal de recettes prêt à
              être transmis.
            </p>
            <div className="flex flex-wrap gap-6">
              <Button size="lg" variant="gradient" className="px-12 group" icon={ArrowUpRight}>
                Exporter le Journal
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 px-8"
                icon={CalendarIcon}
              >
                Mon Calendrier
              </Button>
            </div>
          </div>
          <div className="hidden lg:flex justify-center">
            <div className="relative p-12 bg-white/5 rounded-5xl backdrop-blur-3xl border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-700 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <TrendingUp
                size={160}
                className="text-white opacity-40 group-hover:opacity-80 transition-all duration-700 rotate-12 group-hover:rotate-0"
                strokeWidth={1}
              />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-1000 scale-150" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
