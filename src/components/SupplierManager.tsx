import React, { useState, useMemo } from 'react';
import { Supplier } from '../types';
import { Decimal } from 'decimal.js';
import {
  Plus,
  Search,
  Trash2,
  Mail,
  MapPin,
  Truck,
  Wallet,
  Download,
  SortAsc,
  StickyNote,
  Filter,
  ExternalLink,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  FileSearch,
} from 'lucide-react';
import Header from './ui/Header';
import Button from './ui/Button';
import Modal from './ui/Modal';
import ConfirmDialog from './ui/ConfirmDialog';
import EmptyState from './ui/EmptyState';
import { toast } from 'sonner';
import { securityService } from '../services/securityService';
import { db } from '../services/db';
import { useSuppliers, useExpenses } from '../hooks/useData';

type SortOption = 'name' | 'spending' | 'category';

const SupplierManager: React.FC = () => {
  const suppliers = useSuppliers();
  const expenses = useExpenses();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [revealedSensitives, setRevealedSensitives] = useState<
    Record<string, { iban: string; bic: string }>
  >({});

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    email: '',
    address: '',
    phone: '',
    siret: '',
    category: '',
    notes: '',
    iban: '',
    bic: '',
    vatNumber: '',
    origin: 'FR',
    country: 'FR',
    accountingCode: '',
    paymentTerms: '',
    currency: 'EUR',
    status: 'PENDING',
  });

  // --- STATS HELPERS ---

  const getSupplierStats = React.useCallback(
    (supplierId: string) => {
      const supplierExpenses = expenses.filter((exp) => exp.supplierId === supplierId);
      const totalSpent = supplierExpenses.reduce(
        (sum, exp) => sum.plus(new Decimal(exp.amount)),
        new Decimal(0)
      );

      const lastExpenseDate =
        supplierExpenses.length > 0
          ? supplierExpenses.sort((a, b) => b.date.localeCompare(a.date))[0].date
          : null;

      return {
        totalSpent: totalSpent.toNumber(),
        count: supplierExpenses.length,
        lastExpenseDate,
      };
    },
    [expenses]
  );

  // --- SORTING & FILTERING ---

  // Extraire les catégories uniques pour le filtre
  const categories = useMemo(() => {
    const cats = new Set(suppliers.map((s) => s.category).filter(Boolean));
    return Array.from(cats);
  }, [suppliers]);

  const processedSuppliers = useMemo(() => {
    let result = suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedCategory) {
      result = result.filter((s) => s.category === selectedCategory);
    }

    return result.sort((a, b) => {
      if (sortBy === 'spending') {
        return getSupplierStats(b.id).totalSpent - getSupplierStats(a.id).totalSpent;
      }
      if (sortBy === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      }
      return a.name.localeCompare(b.name);
    });
  }, [suppliers, searchTerm, sortBy, selectedCategory, getSupplierStats]);

  // --- ACTIONS ---

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      address: '',
      phone: '',
      siret: '',
      category: '',
      notes: '',
      iban: '',
      bic: '',
      vatNumber: '',
      origin: 'FR',
      country: 'FR',
      accountingCode: '',
      paymentTerms: '',
      currency: 'EUR',
      status: 'PENDING',
    });
    setIsPanelOpen(true);
  };

  const openEdit = async (supplier: Supplier) => {
    setEditingId(supplier.id);

    // On déchiffre les données sensibles pour l'édition et on log l'accès
    const iban = supplier.iban
      ? await securityService.decrypt(supplier.iban, {
          action: 'EDIT_MODAL_ACCESS',
          resourceType: 'SUPPLIER',
          resourceId: supplier.id,
        })
      : '';
    const bic = supplier.bic ? await securityService.decrypt(supplier.bic) : '';

    setFormData({ ...supplier, iban, bic });
    setIsPanelOpen(true);
  };

  const mockWebhookNotify = (supplierName: string, hasNewIban: boolean) => {
    if (hasNewIban) {
      console.error(
        `[WEBHOOK] Nouveau RIB ajouté pour ${supplierName}. Notification Discord envoyée.`
      );
      toast.info('Notification de sécurité envoyée (Discord/Telegram)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    // Détection changement IBAN pour webhook
    const existingSupplier = suppliers.find((s) => s.id === editingId);
    const hasNewIban =
      formData.iban &&
      (!existingSupplier ||
        formData.iban !== (await securityService.decrypt(existingSupplier.iban!)));

    // Chiffrement des données sensibles avant stockage
    const encryptedIban = formData.iban ? await securityService.encrypt(formData.iban) : '';
    const encryptedBic = formData.bic ? await securityService.encrypt(formData.bic) : '';

    const finalData = {
      ...formData,
      iban: encryptedIban,
      bic: encryptedBic,
    } as Supplier;

    if (editingId) {
      await db.suppliers.update(editingId, finalData);
      toast.success('Fournisseur mis à jour');
    } else {
      const supplier: Supplier = {
        ...finalData,
        id: crypto.randomUUID(),
        status: 'PENDING', // Initialisé à PENDING pour validation workflow
      };
      await db.suppliers.add(supplier);
      toast.success('Fournisseur ajouté (en attente de validation)');
    }

    if (hasNewIban) {
      mockWebhookNotify(formData.name, true);
    }

    setIsPanelOpen(false);
  };

  const toggleRevealSensitive = async (
    supplierId: string,
    encryptedIban?: string,
    encryptedBic?: string
  ) => {
    if (revealedSensitives[supplierId]) {
      const newRevealed = { ...revealedSensitives };
      delete newRevealed[supplierId];
      setRevealedSensitives(newRevealed);
    } else {
      const iban = encryptedIban
        ? await securityService.decrypt(encryptedIban, {
            action: 'REVEAL_SENSITIVE_DATA',
            resourceType: 'SUPPLIER',
            resourceId: supplierId,
          })
        : '';
      const bic = encryptedBic ? await securityService.decrypt(encryptedBic) : '';
      setRevealedSensitives({ ...revealedSensitives, [supplierId]: { iban, bic } });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALIDATED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
            VALIDE
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
            REJETÉ
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
            EN ATTENTE
          </span>
        );
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await db.suppliers.delete(deleteId);
      setDeleteId(null);
      setIsConfirmOpen(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const exportCSV = () => {
    const headers = [
      'Nom',
      'Catégorie',
      'SIRET',
      'Email',
      'Téléphone',
      'Adresse',
      'Notes',
      'Total Dépensé',
    ];
    const rows = suppliers.map((s) => {
      const stats = getSupplierStats(s.id);
      return [
        `"${s.name}"`,
        `"${s.category || ''}"`,
        `"${s.siret || ''}"`,
        `"${s.email || ''}"`,
        `"${s.phone || ''}"`,
        `"${s.address?.replace(/\n/g, ' ') || ''}"`,
        `"${s.notes?.replace(/\n/g, ' ') || ''}"`,
        stats.totalSpent.toFixed(2),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `fournisseurs_export_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto pb-10">
      <Header
        title="Fournisseurs"
        description="Gérez votre réseau de partenaires et surveillez vos flux de dépenses"
        icon={Truck}
        actions={
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={exportCSV}
              className="hidden sm:flex group h-12 rounded-2xl px-6 font-black uppercase text-[11px] tracking-widest border-2 hover:bg-slate-50 transition-all active:scale-95"
            >
              <Download
                className="mr-2 group-hover:-translate-y-1 transition-transform"
                size={14}
                strokeWidth={3}
              />
              Exporter CSV
            </Button>
            <Button
              onClick={openCreate}
              className="bg-primary hover:bg-primary/90 text-white h-12 rounded-2xl px-8 font-black uppercase text-[11px] tracking-widest shadow-premium transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={16} strokeWidth={3} />
              Nouveau Fournisseur
            </Button>
          </div>
        }
      />

      {/* --- RECAP CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card p-10 rounded-[3rem] border border-border shadow-premium group hover:border-primary/20 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex flex-col gap-6 relative z-10">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
              <Truck size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                Total Partenaires
              </p>
              <h3 className="text-4xl font-black mt-1 tracking-tighter">{suppliers.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-card p-10 rounded-[3rem] border border-border shadow-premium group hover:border-indigo-500/20 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex flex-col gap-6 relative z-10">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:rotate-12 transition-transform">
              <Wallet size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                Dépenses Totales
              </p>
              <h3 className="text-4xl font-black mt-1 tracking-tighter text-indigo-600">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(
                  expenses
                    .reduce((sum, exp) => sum.plus(new Decimal(exp.amount)), new Decimal(0))
                    .toNumber()
                )}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-card p-10 rounded-[3rem] border border-border shadow-premium group hover:border-emerald-500/20 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex flex-col gap-6 relative z-10">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:rotate-12 transition-transform">
              <FileSearch size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                En attente validation
              </p>
              <h3 className="text-4xl font-black mt-1 tracking-tighter text-emerald-600">
                {suppliers.filter((s) => s.status === 'PENDING').length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <div className="bg-slate-900 dark:bg-card p-6 rounded-[3rem] border border-slate-800 dark:border-border shadow-premium mt-12">
        <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center">
          <div className="relative flex-1 group">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors"
              size={20}
              strokeWidth={3}
            />
            <input
              type="text"
              placeholder="Rechercher un fournisseur, un SIRET ou un RIB..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-slate-800/50 dark:bg-muted/10 border-none rounded-2xl text-white dark:text-foreground placeholder:text-slate-500 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.2em] focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="relative group">
              <Filter
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors"
                size={16}
                strokeWidth={3}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none pl-12 pr-12 py-5 bg-slate-800/50 dark:bg-muted/10 border-none rounded-2xl text-white dark:text-foreground font-black uppercase text-[10px] tracking-widest focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer min-w-[200px]"
              >
                <option value="">Toutes catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <SortAsc
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors"
                size={16}
                strokeWidth={3}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none pl-12 pr-12 py-5 bg-slate-800/50 dark:bg-muted/10 border-none rounded-2xl text-white dark:text-foreground font-black uppercase text-[10px] tracking-widest focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer min-w-[200px]"
              >
                <option value="name">Trier par Nom</option>
                <option value="spending">Trier par Dépenses</option>
                <option value="category">Trier par Catégorie</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={editingId ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        description="Saisissez les coordonnées de votre partenaire."
        footer={
          <>
            <Button
              variant="outline"
              className="flex-1 h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest"
              onClick={() => setIsPanelOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 h-14 bg-primary text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-premium"
              onClick={handleSubmit}
            >
              {editingId ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 uppercase tracking-wider ml-1">
              Nom / Société
            </label>
            <input
              type="text"
              required
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Fournisseur SARL"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider ml-1">
                Catégorie / Code Compta
              </label>
              <input
                type="text"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: 651 - Logiciels/SaaS"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider ml-1">
                Devise de facturation
              </label>
              <select
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium appearance-none"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider ml-1">
                Pays
              </label>
              <input
                type="text"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Ex: FR, VN, IE..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider ml-1">
                Délai de paiement
              </label>
              <input
                type="text"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                placeholder="Ex: Prélèvement, 30 jours..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider ml-1 flex items-center gap-2">
                SIRET / Tax ID {formData.origin === 'FR' ? '(Sirene)' : '(VIES/Local)'}
              </label>
              <input
                type="text"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                value={formData.siret || ''}
                onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                placeholder={formData.origin === 'FR' ? '424 761 419 00045' : 'Tax ID local'}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider ml-1">
                Numéro de TVA Intracom.
              </label>
              <input
                type="text"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
                value={formData.vatNumber || ''}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                placeholder="FR 22 424761419"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 space-y-6">
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Lock size={14} /> Coordonnées Bancaires (Chiffrées)
            </h5>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                  IBAN
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all text-sm font-mono"
                  value={formData.iban || ''}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  placeholder="FR76..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                  BIC / SWIFT
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all text-sm font-mono"
                  value={formData.bic || ''}
                  onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
                  placeholder="BCDEFRYY"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider ml-1">
                Email
              </label>
              <input
                type="email"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@fournisseur.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 uppercase tracking-wider ml-1">
                Téléphone
              </label>
              <input
                type="tel"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 uppercase tracking-wider ml-1">
              Adresse
            </label>
            <textarea
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all resize-none text-slate-600 font-medium leading-relaxed"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 uppercase tracking-wider ml-1 flex items-center gap-2">
              <StickyNote size={14} className="text-slate-400" /> Notes privées (Ref client, SAV...)
            </label>
            <textarea
              className="w-full p-4 bg-amber-50/50 border-2 border-amber-100 rounded-2xl focus:border-amber-400 focus:bg-white outline-none transition-all resize-none text-amber-900 font-medium leading-relaxed text-sm"
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="N° Client : 123456, Contact SAV : Marie..."
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le fournisseur"
        message="Êtes-vous sûr de vouloir supprimer ce fournisseur ?"
        confirmLabel="Supprimer"
      />

      {/* List */}
      <div className="mt-12">
        {/* --- FILTERS --- */}
        <div className="bg-slate-900 dark:bg-card p-6 rounded-[3rem] border border-slate-800 dark:border-border shadow-premium mb-12">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <Search
                className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors"
                size={20}
                strokeWidth={3}
              />
              <input
                type="text"
                placeholder="Rechercher un fournisseur, un SIRET ou un RIB..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-slate-800/50 dark:bg-muted/10 border-none rounded-2xl text-white dark:text-foreground placeholder:text-slate-500 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.2em] focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="relative group">
                <Filter
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors"
                  size={16}
                  strokeWidth={3}
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none pl-12 pr-12 py-5 bg-slate-800/50 dark:bg-muted/10 border-none rounded-2xl text-white dark:text-foreground font-black uppercase text-[10px] tracking-widest focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer min-w-[200px]"
                >
                  <option value="">Toutes catégories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative group">
                <SortAsc
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors"
                  size={16}
                  strokeWidth={3}
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none pl-12 pr-12 py-5 bg-slate-800/50 dark:bg-muted/10 border-none rounded-2xl text-white dark:text-foreground font-black uppercase text-[10px] tracking-widest focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer min-w-[200px]"
                >
                  <option value="name">Trier par Nom</option>
                  <option value="spending">Trier par Dépenses</option>
                  <option value="category">Trier par Catégorie</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* --- GRID --- */}
        {processedSuppliers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8 pb-20 mt-12">
            {processedSuppliers.map((supplier) => {
              const stats = getSupplierStats(supplier.id);
              const revealed = revealedSensitives[supplier.id];
              return (
                <div
                  key={supplier.id}
                  onClick={() => openEdit(supplier)}
                  className="bg-card rounded-[3rem] border border-border shadow-premium overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-primary/30 group cursor-pointer flex flex-col h-full transform hover:-translate-y-2"
                >
                  <div className="p-10 flex-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-700"></div>

                    <div className="flex justify-between items-start mb-10">
                      <div className="flex gap-6 items-start">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-[1.5rem] flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-soft border border-primary/10">
                          <Truck size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-black tracking-tighter group-hover:text-primary transition-colors">
                              {supplier.name}
                            </h3>
                            {getStatusBadge(supplier.status || 'PENDING')}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest">
                            <span className="bg-muted px-2 py-0.5 rounded-lg border border-border">
                              {supplier.category || 'Sans catégorie'}
                            </span>
                            <span>SIRET: {supplier.siret || '--'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                        <button
                          onClick={(e) => handleDelete(supplier.id, e)}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-soft"
                        >
                          <Trash2 size={16} strokeWidth={3} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="bg-muted/30 p-8 rounded-[2rem] border border-border transition-all hover:bg-white hover:border-primary/20 hover:shadow-soft">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                          Dépenses cumulées
                        </p>
                        <p className="text-3xl font-black tracking-tighter">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(stats.totalSpent)}
                        </p>
                        <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                          <Calendar size={12} strokeWidth={3} />
                          Dernière:{' '}
                          {stats.lastExpenseDate
                            ? new Date(stats.lastExpenseDate).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-muted/30 p-8 rounded-[2rem] border border-border transition-all hover:bg-white hover:border-primary/20 hover:shadow-soft">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                          Transactions
                        </p>
                        <p className="text-3xl font-black tracking-tighter">{stats.count}</p>
                        <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                          <ExternalLink size={12} strokeWidth={3} />
                          Voir l'historique
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-8 border-t border-border">
                      <div className="flex items-center gap-4 text-[13px] group/item">
                        <Mail
                          className="text-primary opacity-40 group-hover/item:opacity-100 transition-opacity"
                          size={18}
                          strokeWidth={2.5}
                        />
                        <span className="font-bold truncate max-w-[200px]">
                          {supplier.email || "Pas d'email"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[13px] group/item">
                        <MapPin
                          className="text-primary opacity-40 group-hover/item:opacity-100 transition-opacity"
                          size={18}
                          strokeWidth={2.5}
                        />
                        <span className="font-bold truncate">
                          {supplier.address || "Pas d'adresse"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SENSITIVE DATA FOOTER */}
                  <div className="bg-slate-900 px-10 py-6 flex items-center justify-between group-hover:bg-primary transition-all duration-500">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="p-2.5 bg-white/10 rounded-xl text-white">
                        <Lock size={14} strokeWidth={3} />
                      </div>
                      <div className="text-white overflow-hidden">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
                          RIB - SÉCURISÉ (AES-256)
                        </p>
                        <div className="font-mono text-[11px] font-bold truncate tracking-widest">
                          {revealed ? (
                            <span className="animate-fade-in">{revealed.iban}</span>
                          ) : (
                            <span className="opacity-40 tracking-normal">
                              •••• •••• •••• •••• •••• ••
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRevealSensitive(supplier.id, supplier.iban, supplier.bic);
                      }}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-[1.2rem] text-white transition-all active:scale-95"
                    >
                      {revealed ? (
                        <EyeOff size={16} strokeWidth={3} />
                      ) : (
                        <Eye size={16} strokeWidth={3} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Truck}
            title="Aucun fournisseur trouvé"
            description="Ajustez vos filtres ou effectuez une nouvelle recherche pour trouver vos partenaires."
            actionLabel="Réinitialiser"
            onAction={() => setSearchTerm('')}
          />
        )}

        {processedSuppliers.length === 0 && (
          <EmptyState
            icon={Truck}
            title="Aucun fournisseur"
            description="Référencez les fournisseurs chez qui vous effectuez des dépenses pour mieux catégoriser vos frais et optimiser votre comptabilité."
            actionLabel="Ajouter un fournisseur"
            onAction={openCreate}
          />
        )}
      </div>
    </div>
  );
};

export default SupplierManager;
