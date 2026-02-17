import React, { useState, useMemo, useRef } from 'react';
import {
  useExpenses,
  useInvoices,
  useSuppliers,
  useClients,
  useUserProfile,
} from '../hooks/useData';
import { Expense, InvoiceStatus } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  Download,
  Loader2,
  Sparkles,
  Calendar as CalendarIcon,
  Euro,
  Percent,
  Lightbulb,
  Search,
  ArrowRightLeft,
  CalendarDays,
  Gauge,
  Wand2,
} from 'lucide-react';
import Header from './ui/Header';
import Modal from './ui/Modal';
import ConfirmDialog from './ui/ConfirmDialog';
import { calculateUrssaf } from '../services/businessService';
import { downloadFEC } from '../services/fecService';
import { ocrExpense } from '../services/geminiService';
import { toast } from 'sonner';
import { Decimal } from 'decimal.js';
import { generateJournalEntries } from '../services/accountingService';
import { db } from '../services/db';

const AccountingManager: React.FC = () => {
  const expenses = useExpenses();
  const invoices = useInvoices();
  const suppliers = useSuppliers();
  const clients = useClients();
  const { profile: userProfile } = useUserProfile();
  const [activeTab, setActiveTab] = useState<'journal' | 'bilan' | 'rapprochement'>('bilan');
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('year');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const invDate = new Date(inv.date);
      if (period === 'all') return true;
      if (period === 'year') return invDate.getFullYear() === selectedDate.getFullYear();
      if (period === 'month') {
        return (
          invDate.getFullYear() === selectedDate.getFullYear() &&
          invDate.getMonth() === selectedDate.getMonth()
        );
      }
      if (period === 'quarter') {
        const currentQuarter = Math.floor(selectedDate.getMonth() / 3);
        const invQuarter = Math.floor(invDate.getMonth() / 3);
        return (
          invDate.getFullYear() === selectedDate.getFullYear() && invQuarter === currentQuarter
        );
      }
      return true;
    });
  }, [invoices, period, selectedDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      if (period === 'all') return true;
      if (period === 'year') return expDate.getFullYear() === selectedDate.getFullYear();
      if (period === 'month') {
        return (
          expDate.getFullYear() === selectedDate.getFullYear() &&
          expDate.getMonth() === selectedDate.getMonth()
        );
      }
      if (period === 'quarter') {
        const currentQuarter = Math.floor(selectedDate.getMonth() / 3);
        const expQuarter = Math.floor(expDate.getMonth() / 3);
        return (
          expDate.getFullYear() === selectedDate.getFullYear() && expQuarter === currentQuarter
        );
      }
      return true;
    });
  }, [expenses, period, selectedDate]);

  const journalEntries = useMemo(() => {
    return generateJournalEntries(
      filteredInvoices,
      filteredExpenses,
      userProfile,
      clients,
      suppliers
    );
  }, [filteredInvoices, filteredExpenses, userProfile, clients, suppliers]);

  // Form State
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    vatAmount: 0,
    category: 'Achats',
    supplierId: '',
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;

    const expense: Expense = {
      id: Date.now().toString(),
      date: newExpense.date!,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      vatAmount: Number(newExpense.vatAmount || 0),
      category: newExpense.category!,
      supplierId: newExpense.supplierId,
      status: 'validated',
      createdAt: new Date().toISOString(),
    };

    await db.expenses.add(expense);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      vatAmount: 0,
      category: 'Achats',
      supplierId: '',
    });
    setShowForm(false);
  };

  const handleOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const result = await ocrExpense(base64);
        if (result) {
          let foundSupplierId = '';

          if (result.supplierName) {
            const existingSupplier = suppliers.find(
              (s) => s.name.toLowerCase() === result.supplierName?.toLowerCase()
            );

            if (existingSupplier) {
              foundSupplierId = existingSupplier.id;
            } else {
              // Création d'un nouveau fournisseur automatiquement
              const newSupplierId = crypto.randomUUID();
              await db.suppliers.add({
                id: newSupplierId,
                name: result.supplierName,
                origin: 'FR',
                country: 'FR',
                currency: 'EUR',
                status: 'VALIDATED',
              });
              foundSupplierId = newSupplierId;
              toast.info(`Nouveau fournisseur détecté et créé : ${result.supplierName}`);
            }
          }

          setNewExpense({
            ...newExpense,
            description: result.description,
            amount: result.amount,
            vatAmount: result.vatAmount,
            category: result.category,
            date: result.date,
            supplierId: foundSupplierId,
          });
          toast.success("Ticket analysé avec succès par l'IA !");
        } else {
          toast.error("Échec de l'analyse du ticket.");
        }
      } catch {
        toast.error("Erreur lors de l'analyse du ticket.");
      } finally {
        setIsOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmCancel = async () => {
    if (deleteId) {
      const original = expenses.find((e) => e.id === deleteId);
      if (original) {
        const reversal: Expense = {
          id: `rev-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: `[ANNULATION] ${original.description}`,
          amount: -original.amount,
          vatAmount: original.vatAmount ? -original.vatAmount : 0,
          category: original.category,
          supplierId: original.supplierId,
          status: 'validated',
          reversalOf: original.id,
          createdAt: new Date().toISOString(),
        };

        // Immutability: We don't delete the original, we add the reversal
        await db.expenses.update(original.id, { status: 'cancelled' as const });
        await db.expenses.add(reversal);

        toast.success('Écriture de contre-passation enregistrée.');
      }
      setDeleteId(null);
    }
    setIsConfirmOpen(false);
  };

  // --- STATISTICS ---
  const stats = useMemo(() => {
    const revenue = filteredInvoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => {
        const amount = new Decimal(inv.total);
        return inv.type === 'credit_note' ? sum.minus(amount) : sum.plus(amount);
      }, new Decimal(0));

    const expensesTotal = filteredExpenses.reduce(
      (sum, exp) => sum.plus(new Decimal(exp.amount)),
      new Decimal(0)
    );

    const net = revenue.minus(expensesTotal);

    // Utilisation du service de calcul URSSAF précis
    const urssafData = calculateUrssaf(filteredInvoices, userProfile);
    const charges = new Decimal(urssafData.total);
    const result = net.minus(charges);

    // Calcul de la TVA
    const tvaCollectee = filteredInvoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum.plus(new Decimal(inv.taxAmount || 0)), new Decimal(0));

    const tvaDeductible = filteredExpenses.reduce(
      (sum, exp) => sum.plus(new Decimal(exp.vatAmount || 0)),
      new Decimal(0)
    );

    const tvaBalance = tvaCollectee.minus(tvaDeductible);

    return {
      revenue: revenue.toNumber(),
      expenses: expensesTotal.toNumber(),
      net: net.toNumber(),
      charges: charges.toNumber(),
      result: result.toNumber(),
      rate: revenue.isZero() ? 0 : charges.div(revenue).times(100).toNumber(),
      tvaCollectee: tvaCollectee.toNumber(),
      tvaDeductible: tvaDeductible.toNumber(),
      tvaBalance: tvaBalance.toNumber(),
    };
  }, [filteredInvoices, filteredExpenses, userProfile]);

  const {
    revenue: totalRevenue,
    expenses: totalExpenses,
    net: netResult,
    result: netAfterCharges,
    rate: currentRate,
    tvaCollectee,
    tvaDeductible,
    tvaBalance,
  } = stats;

  // Données pour le graphique mensuel (Revenus vs Dépenses)
  const monthlyComparison = useMemo(() => {
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
    const data: Record<string, { rev: Decimal; exp: Decimal }> = {};
    months.forEach((m) => (data[m] = { rev: new Decimal(0), exp: new Decimal(0) }));

    filteredInvoices.forEach((inv) => {
      if (inv.status === InvoiceStatus.PAID) {
        const d = new Date(inv.date);
        const m = months[d.getMonth()];
        const amt = new Decimal(inv.total);
        data[m].rev = inv.type === 'credit_note' ? data[m].rev.minus(amt) : data[m].rev.plus(amt);
      }
    });

    filteredExpenses.forEach((e) => {
      const d = new Date(e.date);
      const m = months[d.getMonth()];
      data[m].exp = data[m].exp.plus(new Decimal(e.amount));
    });

    return months
      .map((m) => ({
        name: m,
        Revenus: data[m].rev.toNumber(),
        Dépenses: data[m].exp.toNumber(),
        Solde: data[m].rev.minus(data[m].exp).toNumber(),
      }))
      .filter((d) => d.Revenus !== 0 || d.Dépenses !== 0 || period === 'year' || period === 'all');
  }, [filteredInvoices, filteredExpenses, period]);

  // Données pour le graphique camembert
  const expensesByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      const cat = exp.category || 'Autre';
      data[cat] = (data[cat] || 0) + exp.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20 px-4 md:px-0">
      <Header
        title="Comptabilité"
        description="Pilotez votre trésorerie et vos obligations fiscales en temps réel."
        icon={DollarSign}
        actions={
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() =>
                downloadFEC(filteredInvoices, userProfile, clients, filteredExpenses, suppliers)
              }
              className="flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:border-slate-900 transition-all duration-300 shadow-soft"
            >
              <Download size={18} strokeWidth={3} />
              Export FEC (.txt)
            </button>
            <div className="flex bg-slate-100/50 p-1.5 rounded-[1.5rem] border-2 border-slate-100 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('journal')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  activeTab === 'journal'
                    ? 'bg-slate-900 text-white shadow-premium scale-105'
                    : 'bg-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Journal
              </button>
              <button
                onClick={() => setActiveTab('rapprochement')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  activeTab === 'rapprochement'
                    ? 'bg-slate-900 text-white shadow-premium scale-105'
                    : 'bg-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Rapprochement
              </button>
              <button
                onClick={() => setActiveTab('bilan')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  activeTab === 'bilan'
                    ? 'bg-slate-900 text-white shadow-premium scale-105'
                    : 'bg-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Bilan
              </button>
            </div>
          </div>
        }
      />

      {/* Sélecteur de Période (Calendrier Fiscal) */}
      <div className="bg-white p-6 rounded-[2rem] shadow-soft border-2 border-slate-100 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <CalendarIcon size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Période d'analyse
            </h4>
            <p className="text-xs font-bold text-slate-400">
              {period === 'month' &&
                selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              {period === 'quarter' &&
                `Trimestre ${Math.floor(selectedDate.getMonth() / 3) + 1} ${selectedDate.getFullYear()}`}
              {period === 'year' && selectedDate.getFullYear()}
              {period === 'all' && "Tout l'historique"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          {(['month', 'quarter', 'year', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p
                  ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {p === 'month'
                ? 'Mois'
                : p === 'quarter'
                  ? 'Trimestre'
                  : p === 'year'
                    ? 'Année'
                    : 'Tout'}
            </button>
          ))}
        </div>

        {period !== 'all' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                if (period === 'month') d.setMonth(d.getMonth() - 1);
                else if (period === 'quarter') d.setMonth(d.getMonth() - 3);
                else if (period === 'year') d.setFullYear(d.getFullYear() - 1);
                setSelectedDate(d);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            >
              <TrendingDown size={16} className="rotate-90" />
            </button>
            <span className="text-sm font-black text-slate-900 tabular-nums">
              {period === 'year'
                ? selectedDate.getFullYear()
                : selectedDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                if (period === 'month') d.setMonth(d.getMonth() + 1);
                else if (period === 'quarter') d.setMonth(d.getMonth() + 3);
                else if (period === 'year') d.setFullYear(d.getFullYear() + 1);
                setSelectedDate(d);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            >
              <TrendingUp size={16} className="-rotate-90" />
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Ajouter une dépense"
        description="Enregistrez une nouvelle dépense pour votre comptabilité."
        footer={
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all duration-300"
              onClick={() => setShowForm(false)}
            >
              Annuler
            </button>
            <button
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black hover:shadow-premium transition-all duration-300"
              onClick={handleAddExpense}
            >
              Enregistrer
            </button>
          </div>
        }
      >
        <div className="mb-8">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleOcr}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isOcrLoading}
            className="w-full flex items-center gap-6 p-6 border-2 border-dashed border-indigo-200 rounded-[2rem] bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 transition-all group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full -mr-16 -mt-16"></div>

            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 relative z-10">
              {isOcrLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" strokeWidth={3} />
              ) : (
                <Sparkles className="w-8 h-8" strokeWidth={2.5} />
              )}
            </div>

            <div className="text-left relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-black text-slate-900">Scanner avec l'IA</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-200">
                  Gemini Vision
                </span>
              </div>
              <p className="text-sm font-bold text-slate-500">
                Posez votre ticket, l'IA s'occupe du reste.
              </p>
            </div>
          </button>
        </div>

        <form onSubmit={handleAddExpense} className="space-y-8 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Date de l'opération
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
                  <CalendarIcon size={20} strokeWidth={3} />
                </div>
                <input
                  type="date"
                  required
                  className="w-full pl-14 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-900 focus:bg-white outline-none transition-all duration-300 font-black text-slate-900"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Catégorie fiscale
              </label>
              <select
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-slate-900 focus:bg-white transition-all duration-300 appearance-none cursor-pointer font-black text-slate-900"
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              >
                <option value="Achats">Achats Matériel</option>
                <option value="Restaurant">Restaurant / Repas</option>
                <option value="Deplacements">Déplacements</option>
                <option value="Fournitures">Fournitures bureau</option>
                <option value="Services">Services / Logiciels</option>
                <option value="Loyer">Loyer / Charges</option>
                <option value="Assurance">Assurance</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Désignation de la dépense
            </label>
            <input
              type="text"
              required
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-900 focus:bg-white outline-none transition-all duration-300 font-black text-slate-900"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder="Ex: Abonnement Adobe Creative Cloud"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Montant TTC
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
                  <Euro size={20} strokeWidth={3} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full pl-14 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-900 focus:bg-white outline-none transition-all duration-300 font-black text-slate-900"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Dont TVA
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                  <Percent size={18} strokeWidth={3} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-14 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all duration-300 font-black text-indigo-600"
                  value={newExpense.vatAmount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, vatAmount: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Fournisseur associé
            </label>
            <select
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-slate-900 focus:bg-white transition-all duration-300 appearance-none cursor-pointer font-black text-slate-900"
              value={newExpense.supplierId}
              onChange={(e) => setNewExpense({ ...newExpense, supplierId: e.target.value })}
            >
              <option value="">Sélectionner un fournisseur (optionnel)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmCancel}
        title="Annuler l'écriture"
        message="Conformément aux principes comptables d'immuabilité, cette ligne ne sera pas supprimée mais annulée par une écriture inverse (contre-passation)."
        confirmLabel="Confirmer l'annulation"
      />

      {activeTab === 'bilan' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border-2 border-slate-100 relative overflow-hidden group hover:shadow-premium transition-all duration-500">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500 text-emerald-600">
                <TrendingUp size={80} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Recettes Totales
              </p>
              <h3 className="text-3xl font-black text-slate-900 mb-2">
                {totalRevenue.toFixed(2)} €
              </h3>
              <div className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                100% Encaissé
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border-2 border-slate-100 relative overflow-hidden group hover:shadow-premium transition-all duration-500">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500 text-rose-600">
                <TrendingDown size={80} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Dépenses Totales
              </p>
              <h3 className="text-3xl font-black text-slate-900 mb-2">
                {totalExpenses.toFixed(2)} €
              </h3>
              <div className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                Décaissé
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-premium relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500 text-white">
                <DollarSign size={80} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Résultat Brut
              </p>
              <h3 className="text-4xl font-black text-white mb-2">{netResult.toFixed(2)} €</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Avant cotisations
              </p>
              <div className="h-1 w-12 bg-blue-500 rounded-full mt-4"></div>
            </div>

            <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-premium relative overflow-hidden group text-white">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
                <PieChartIcon size={80} />
              </div>
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-4">
                Résultat Net Estimé
              </p>
              <h3 className="text-3xl font-black mb-1">
                {netAfterCharges.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </h3>
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
                Après cotisations (Urssaf + CFP + VL)
              </p>
              <div className="h-1 w-12 bg-white rounded-full mt-4"></div>
            </div>
          </div>

          {/* Module de Gestion de la TVA */}
          {!userProfile.isVatExempt && (
            <div className="bg-white p-10 rounded-[3rem] shadow-soft border-2 border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-indigo-600 text-white rounded-[1.5rem] shadow-lg shadow-indigo-200">
                    <Percent size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      Gestion de la TVA
                    </h3>
                    <p className="text-sm font-bold text-slate-400">
                      Récapitulatif pour la période sélectionnée
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      TVA Collectée
                    </p>
                    <p className="text-xl font-black text-slate-900">{tvaCollectee.toFixed(2)} €</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      TVA Déductible
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      {tvaDeductible.toFixed(2)} €
                    </p>
                  </div>
                  <div className="flex items-center gap-6 px-6 py-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">
                        {tvaBalance >= 0 ? 'TVA à Payer' : 'Crédit de TVA'}
                      </p>
                      <p className="text-2xl font-black">{Math.abs(tvaBalance).toFixed(2)} €</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-soft border-2 border-slate-100">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-soft">
                    <CalendarDays size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      Flux Mensuels
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Revenus vs Dépenses{' '}
                      {period === 'year' || period === 'all'
                        ? selectedDate.getFullYear()
                        : 'Période'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyComparison}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{
                        borderRadius: '24px',
                        border: 'none',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                        padding: '16px',
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar
                      name="Revenus"
                      dataKey="Revenus"
                      fill="#0f172a"
                      radius={[6, 6, 0, 0]}
                      barSize={12}
                    />
                    <Bar
                      name="Dépenses"
                      dataKey="Dépenses"
                      fill="#f43f5e"
                      radius={[6, 6, 0, 0]}
                      barSize={12}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-soft border-2 border-slate-100 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] shadow-soft">
                  <PieChartIcon size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Répartition</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Catégories de frais
                  </p>
                </div>
              </div>

              {expensesByCategory.length > 0 ? (
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {expensesByCategory.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            strokeWidth={0}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-premium border-0">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">
                                  {payload[0].name}
                                </p>
                                <p className="text-xl font-black">
                                  {Number(payload[0].value).toFixed(2)} €
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <div className="p-6 bg-white rounded-full shadow-soft mb-4">
                    <PieChartIcon size={48} className="opacity-20" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest opacity-40">
                    Aucune donnée
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-premium lg:col-span-2">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -mr-32 -mt-32"></div>
              <div className="relative z-10 flex flex-col md:flex-row gap-10">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-white/10 rounded-[1.5rem] border border-white/20 shadow-xl group-hover:rotate-12 transition-transform duration-500">
                      <Gauge size={28} className="text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">
                      Indicateurs de Performance
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-blue-400 text-xl flex-shrink-0">
                        01
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold mb-1">Marge Brute</p>
                        <p className="text-xl font-black">
                          {totalRevenue > 0 ? ((netResult / totalRevenue) * 100).toFixed(1) : '0'}%
                          <span className="text-sm text-blue-400 font-bold uppercase ml-2">
                            du C.A.
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-indigo-400 text-xl flex-shrink-0">
                        02
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold mb-1">Ratio de charges</p>
                        <p className="text-xl font-black">
                          {((totalExpenses / (totalRevenue || 1)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:w-px bg-slate-800"></div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] group hover:bg-blue-500/20 transition-all duration-500">
                    <div className="flex items-center gap-4 mb-3">
                      <Lightbulb size={20} className="text-blue-400" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                        Optimisation Fiscale
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-300 leading-relaxed">
                      En micro-entreprise, vos frais ne sont pas déductibles pour le calcul des
                      cotisations.{' '}
                      <span className="text-white">Maintenez vos dépenses sous 15%</span> de votre
                      CA pour maximiser votre rentabilité.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[3rem] p-10 text-white shadow-premium relative overflow-hidden flex flex-col justify-between">
              <div className="absolute bottom-0 right-0 opacity-10 rotate-12 -mb-10 -mr-10">
                <ArrowRightLeft size={180} />
              </div>
              <div className="relative z-10">
                <h4 className="text-xl font-black mb-2 lowercase tracking-tighter opacity-80 decoration-indigo-300 underline underline-offset-4">
                  Point Mort
                </h4>
                <p className="text-sm font-bold opacity-70 mb-8">
                  Combien devez-vous encaisser pour couvrir vos frais ?
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      Fixe/Mois
                    </span>
                    <span className="text-2xl font-black">{(totalExpenses / 12).toFixed(0)} €</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      Seuil de rentabilité
                    </span>
                    <span className="text-2xl font-black">
                      {(totalExpenses / (1 - currentRate / 100)).toFixed(0)} €
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest mt-8 opacity-40">
                Calcul basé sur charges sociales + frais réels
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rapprochement' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-12 rounded-[3.5rem] text-white shadow-premium relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Sparkles size={120} />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h3 className="text-4xl font-black mb-4">IA Local Lettering Assistant</h3>
              <p className="text-indigo-100 font-bold text-lg leading-relaxed opacity-90">
                Notre intelligence artificielle (Modèle Mistral-7B) analyse vos relevés bancaires en
                temps réel pour suggérer le lettrage avec vos factures.
              </p>
              <div className="flex gap-4 mt-8">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Mistral Engine : Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {/* Flux de banque à rapprocher */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Flux Bancaires (Import)
                </h4>
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors">
                  Importer Relevé .CSV
                </button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    date: '2026-02-15',
                    libelle: 'VIR. SEPA CLIENT DURAND - FAC-2026-001',
                    amount: 1200.0,
                    matched: 'FAC-2026-001',
                  },
                  {
                    id: 2,
                    date: '2026-02-14',
                    libelle: 'PRLV. SAAS ADOBE CLOUD',
                    amount: -65.99,
                    matched: 'Dépense logicielle',
                  },
                  {
                    id: 3,
                    date: '2026-02-12',
                    libelle: 'CHQ. DEJEUNER RESTO LILLE',
                    amount: -15.5,
                    matched: null,
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-6 rounded-[2rem] shadow-soft border-2 border-slate-100 hover:border-slate-300 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {item.date}
                          </span>
                          {item.matched && (
                            <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">
                              Match IA 98%
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-black text-slate-900 mb-1">{item.libelle}</p>
                        <p
                          className={`text-lg font-black ${item.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}
                        >
                          {item.amount > 0 ? '+' : ''}
                          {item.amount.toFixed(2)} €
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        {item.matched ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              Associé à
                            </span>
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                              {item.matched}
                            </span>
                          </div>
                        ) : (
                          <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                            Lettrer Manuellement
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal IA */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-premium flex flex-col h-full border-4 border-slate-800">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                  <Wand2 size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-widest text-sm">
                    Assistant Intelligence Artificielle
                  </h4>
                  <p className="text-[10px] font-bold text-indigo-400">
                    Mistral-7B @ Localhost:11434
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-6 font-mono">
                <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <p className="text-emerald-400 text-xs mb-4 font-bold tracking-tight">
                    &gt; ANALYSE DES LIBELLÉS EN COURS...
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300">
                    J'ai détecté un virement entrant de{' '}
                    <span className="text-white font-bold">1 200,00 €</span> avec le libellé{' '}
                    <span className="text-indigo-400">"DURAND - FAC-2026-001"</span>.
                  </p>
                  <p className="text-sm leading-relaxed mt-4 text-slate-300">
                    Il correspond à 100% à la{' '}
                    <span className="text-white font-bold">Facture FAC-2026-001</span> (Client
                    Durand) du 15/02/2026.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <button className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                      Valider l'Écriture
                    </button>
                    <button className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                      Lien Manuel
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-slate-800/20 rounded-2xl border border-slate-700/30 opacity-50">
                  <p className="text-slate-500 text-[10px] font-bold italic">
                    Historique : "PRLV SAAS ADOBE" lettré avec "Service Logiciel" (Confiance 92%)
                  </p>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-slate-800">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] text-center mb-6">
                  Processus de Rapprochement Sécurisé
                </p>
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="text-xl font-black text-white">12</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      En attentes
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-emerald-400">145</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      Lettrés (IA)
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-indigo-400">99.2%</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      Précision IA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'journal' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
          <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-8">
            <div className="flex-1">
              <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                Journal Général Des Écritures
              </h3>
              <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-3 mb-8">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"></span>
                Standard Plan Comptable Général (PCG) - {journalEntries.length} lignes générées
              </p>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Chercher un compte, libellé ou montant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-slate-900 transition-all font-bold text-slate-900 shadow-soft"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center gap-3 px-8 py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all duration-300 shadow-soft"
              >
                <Plus size={20} strokeWidth={3} />
                Dépense
              </button>
              <button
                onClick={() =>
                  downloadFEC(filteredInvoices, userProfile, clients, filteredExpenses, suppliers)
                }
                className="flex items-center justify-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-black hover:-translate-y-1 transition-all duration-300 shadow-premium"
              >
                <Download size={20} strokeWidth={3} />
                Export FEC
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] shadow-premium border-2 border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Journal
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Date
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Compte
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Libellé Écriture
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                      Débit
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                      Crédit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-50 font-mono">
                  {journalEntries
                    .filter(
                      (e) =>
                        e.compteNum.includes(searchQuery) ||
                        e.libelle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        e.compteLib.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <span
                            className={`px-3 py-1 rounded-lg text-[10px] font-black border ${
                              entry.journal === 'VT'
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                                : entry.journal === 'AC'
                                  ? 'bg-rose-50 border-rose-100 text-rose-600'
                                  : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            }`}
                          >
                            {entry.journal}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-400">
                          {new Date(entry.date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {entry.compteNum}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {entry.compteLib}
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-slate-900 leading-tight">
                            {entry.libelle}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            REF: {entry.reference}
                          </p>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">
                          {entry.debit.gt(0) ? entry.debit.toFixed(2) : ''}
                        </td>
                        <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">
                          {entry.credit.gt(0) ? entry.credit.toFixed(2) : ''}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingManager;
