import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { db } from '../../services/db';
import { Client, Invoice, InvoiceStatus, ClientSchema } from '../../types';
import { validateClient } from '../../services/validationService';
import {
  Plus,
  Search,
  Trash2,
  MapPin,
  Phone,
  Users,
  Edit2,
  Download,
  SortAsc,
  StickyNote,
  Archive,
  RefreshCcw,
  TrendingUp,
  Star,
  ReceiptText,
  UserCircle,
  Building2,
  Mail,
  Zap,
  User,
  ShieldCheck,
  Globe,
  Coins,
  Languages,
  CreditCard,
} from 'lucide-react';
import Header from '../ui/Header';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';

interface ClientListProps {
  clients: Client[];
  invoices: Invoice[];
}

type SortOption = 'name' | 'revenue' | 'activity' | 'date' | 'siret_asc' | 'siret_desc';

const ClientList: React.FC<ClientListProps> = ({ clients, invoices }) => {
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [clientType, setClientType] = useState<'individual' | 'company'>('company');

  const templates = {
    fr_b2b: {
      country: 'FR',
      currency: 'EUR',
      language: 'fr',
      taxType: 'DOMESTIC',
      paymentTerms: 30,
    },
    eu_b2b: {
      country: 'DE',
      currency: 'EUR',
      language: 'en',
      taxType: 'EU_B2B',
      paymentTerms: 30,
    },
    intl_export: {
      country: 'US',
      currency: 'USD',
      language: 'en',
      taxType: 'EXPORT',
      paymentTerms: 0,
    },
  };

  const applyTemplate = (templateKey: keyof typeof templates) => {
    const template = templates[templateKey];
    Object.entries(template).forEach(([key, value]) => {
      setValue(key as keyof Client, value);
    });
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Partial<Client>>({
    resolver: zodResolver(ClientSchema.partial()),
    defaultValues: {
      name: '',
      email: '',
      address: '',
      country: 'FR',
      currency: 'EUR',
      language: 'fr',
      taxType: 'DOMESTIC',
      siret: '',
      tvaNumber: '',
      taxId: '',
      phone: '',
      notes: '',
      paymentTerms: 30,
    },
  });

  // --- STATISTICS HELPERS ---

  const getClientStats = useCallback(
    (clientId: string) => {
      const clientInvoices = invoices.filter((inv) => inv.clientId === clientId);

      // Revenue (Paid invoices - Credit Notes)
      const revenue = clientInvoices
        .filter((inv) => inv.status === InvoiceStatus.PAID)
        .reduce((sum, inv) => {
          if (inv.type === 'credit_note') return sum - inv.total;
          if (!inv.type || inv.type === 'invoice') return sum + inv.total;
          return sum;
        }, 0);

      // Last Activity Date
      const dates = clientInvoices.map((inv) => new Date(inv.date).getTime());
      const lastActivity = dates.length > 0 ? Math.max(...dates) : 0;

      return {
        revenue,
        count: clientInvoices.length,
        lastActivity,
      };
    },
    [invoices]
  );

  const quickStats = useMemo(() => {
    const activeClients = clients.filter((c) => !c.archived);
    const clientStats = activeClients.map((c) => getClientStats(c.id));

    const totalRevenue = clientStats.reduce((sum, s) => sum + s.revenue, 0);
    const averageRevenue = activeClients.length > 0 ? totalRevenue / activeClients.length : 0;

    // Top Client (by revenue)
    let topClient = null;
    let maxRev = -1;
    activeClients.forEach((c) => {
      const rev = getClientStats(c.id).revenue;
      if (rev > maxRev) {
        maxRev = rev;
        topClient = c.name;
      }
    });

    return {
      count: activeClients.length,
      averageRevenue,
      topClient,
      maxRev,
    };
  }, [clients, getClientStats]);

  // --- SORTING & FILTERING ---

  const processedClients = useMemo(() => {
    // 1. Filter by Archive Status
    let result = clients.filter((c) => Boolean(c.archived) === showArchived);

    // 2. Filter by Search (Name, Email, SIRET, Notes)
    const term = searchTerm.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.siret?.includes(term) ||
        c.notes?.toLowerCase().includes(term)
    );

    // 3. Sort
    return result.sort((a, b) => {
      const statsA = getClientStats(a.id);
      const statsB = getClientStats(b.id);

      if (sortBy === 'revenue') return statsB.revenue - statsA.revenue;
      if (sortBy === 'activity') return statsB.lastActivity - statsA.lastActivity;
      if (sortBy === 'date') return parseInt(b.id) - parseInt(a.id); // Descending (Newest first)
      if (sortBy === 'siret_asc') return (a.siret || '').localeCompare(a.siret || '');
      if (sortBy === 'siret_desc') return (b.siret || '').localeCompare(a.siret || '');
      return a.name.localeCompare(b.name);
    });
  }, [clients, searchTerm, sortBy, showArchived, getClientStats]);

  // --- ACTIONS ---

  const openCreate = () => {
    setEditingId(null);
    reset({
      name: '',
      email: '',
      address: '',
      siret: '',
      tvaNumber: '',
      phone: '',
      notes: '',
    });
    setClientType('company');
    setIsPanelOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingId(client.id);
    reset({ ...client });
    setClientType(client.siret ? 'company' : 'individual');
    setIsPanelOpen(true);
  };

  const onSave = useCallback(
    async (data: Partial<Client>, redirectToInvoice = false) => {
      try {
        // 🛡️ Valider le client avant sauvegarde
        if (!data.id) {
          data.id = Date.now().toString();
        }
        const validationResult = await validateClient(data, data.id);
        if (!validationResult.valid) {
          const errors = validationResult.errors
            .slice(0, 3)
            .map((e) => e.message)
            .join(', ');
          toast.error(`❌ Erreur validation client: ${errors}`);
          return;
        }

        if (editingId) {
          await db.clients.update(editingId, data);
          toast.success('✅ Client mis à jour avec succès');
          setIsPanelOpen(false);
        } else {
          const newId = data.id;
          const client: Client = {
            ...(data as Client),
            id: newId,
            archived: false,
          };
          await db.clients.add(client);
          toast.success('✅ Client créé avec succès');
          setIsPanelOpen(false);

          if (redirectToInvoice) {
            navigate(`/invoices/new?clientId=${newId}`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error(`💥 Erreur sauvegarde client: ${message}`);
      }
    },
    [editingId, navigate]
  );

  const toggleArchiveClient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const client = clients.find((c) => c.id === id);
    if (client) {
      await db.clients.update(id, { archived: !client.archived });
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await db.clients.delete(deleteId);
        const clientName = clients.find((c) => c.id === deleteId)?.name || 'Client';
        toast.success(`✅ ${clientName} supprimé avec succès`);
        setDeleteId(null);
        setIsConfirmOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error(`❌ Erreur suppression: ${message}`);
      }
    }
  };

  const handleDeleteClient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const exportCSV = () => {
    const headers = [
      'Nom',
      'Email',
      'Téléphone',
      'SIRET',
      'Adresse',
      'Notes',
      'CA Généré',
      'Dernière Activité',
      'Statut',
    ];
    const rows = processedClients.map((c) => {
      const stats = getClientStats(c.id);
      return [
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone || ''}"`,
        `"${c.siret || ''}"`,
        `"${c.address?.replace(/\n/g, ' ') || ''}"`,
        `"${c.notes?.replace(/\n/g, ' ') || ''}"`,
        stats.revenue.toFixed(2),
        stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : 'Jamais',
        c.archived ? 'Archivé' : 'Actif',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `clients_${showArchived ? 'archives' : 'actifs'}_export_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div data-testid="clients-container" className="space-y-10 animate-fade-in max-w-7xl mx-auto pb-10">
      <Header
        title="Clients"
        description="Gérez votre base client et suivez le chiffre d'affaires généré par chacun."
        icon={Users}
        actions={
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setShowArchived(false)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${!showArchived ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Actifs
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${showArchived ? 'bg-white text-slate-600 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Archivés
              </button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCSV} icon={Download}>
                Export
              </Button>
              <Button onClick={openCreate} icon={Plus}>
                Ajouter
              </Button>
            </div>
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-testid="client-stats">
        <Card className="p-8 border-none shadow-premium bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative group">
          <Users
            className="absolute -right-6 -bottom-6 w-32 h-32 opacity-20 group-hover:scale-110 transition-transform duration-700"
            strokeWidth={1}
          />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">
            Portefeuille
          </p>
          <h3 className="text-4xl font-black tracking-tighter">{quickStats.count} Clients</h3>
          <div className="flex items-center gap-2 mt-4 text-[11px] font-black uppercase tracking-widest opacity-70">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Clients actifs
          </div>
        </Card>

        <Card className="p-8 border-none shadow-premium bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-900/20 text-foreground overflow-hidden relative group">
          <TrendingUp
            className="absolute -right-6 -bottom-6 w-32 h-32 text-muted/20 group-hover:scale-110 transition-transform duration-700"
            strokeWidth={1}
          />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">
            Panier Moyen
          </p>
          <h3 className="text-4xl font-black tracking-tighter text-foreground">
            {quickStats.averageRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} €
          </h3>
          <p className="text-[11px] font-black text-muted-foreground mt-4 uppercase tracking-widest opacity-60">
            Revenu moyen par client
          </p>
        </Card>

        <Card className="p-8 border-none shadow-premium bg-gradient-to-br from-amber-500 to-amber-600 text-white overflow-hidden relative group">
          <Star
            className="absolute -right-6 -bottom-6 w-32 h-32 opacity-20 group-hover:scale-110 transition-transform duration-700"
            strokeWidth={1}
          />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">
            Meilleur Client
          </p>
          <h3 className="text-2xl font-black tracking-tighter truncate max-w-[200px]">
            {quickStats.topClient || 'Aucun'}
          </h3>
          <p className="text-[11px] font-black mt-4 uppercase tracking-widest opacity-80">
            {quickStats.maxRev > 0
              ? `${quickStats.maxRev.toLocaleString()} € générés`
              : 'Pas encore de CA'}
          </p>
        </Card>
      </div>

      <Modal
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={editingId ? 'Modifier le client' : 'Nouveau client'}
        description="Renseignez les informations de votre client pour vos factures."
        size="xl"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 order-2 sm:order-1"
              onClick={() => setIsPanelOpen(false)}
            >
              Annuler
            </Button>
            {!editingId && (
              <Button
                variant="outline"
                className="flex-1 order-3 border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={handleSubmit((data) => onSave(data, true))}
                icon={ReceiptText}
              >
                Sauver & Facturer
              </Button>
            )}
            <Button
              className="flex-1 order-1 sm:order-3"
              onClick={handleSubmit((data) => onSave(data))}
              icon={editingId ? undefined : ShieldCheck}
            >
              {editingId ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <form className="space-y-8 py-2">
          {/* Header Actions: Type & Templates */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all">
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
              <button
                type="button"
                onClick={() => setClientType('company')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  clientType === 'company'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Building2 size={16} />
                Entreprise
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientType('individual');
                  setValue('siret', '');
                  setValue('tvaNumber', '');
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  clientType === 'individual'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <User size={16} />
                Particulier
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Modèles rapides :
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplate('fr_b2b')}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                >
                  🇫🇷 FR B2B
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('eu_b2b')}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                >
                  🇪🇺 UE B2B
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('intl_export')}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                >
                  🌎 INT&apos;L
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Identity Group */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-400 pb-2 border-b border-slate-100">
                <ShieldCheck size={16} />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Identité du client
                </h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
                    <UserCircle size={14} className="text-blue-500" />
                    {clientType === 'company' ? 'Nom de la société' : 'Nom complet'}
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    required
                    className={`w-full p-4 bg-slate-50 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400 ${
                      errors.name
                        ? 'border-red-200 bg-red-50'
                        : 'border-slate-100 focus:border-blue-500 focus:bg-white'
                    }`}
                    placeholder={
                      clientType === 'company' ? 'Ex: MaSuperBoite SAS' : 'Ex: Jean Dupont'
                    }
                  />
                  {errors.name && (
                    <p className="text-[10px] text-red-500 font-bold uppercase ml-1">
                      Le nom est requis
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
                    <Mail size={14} className="text-blue-500" />
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    required
                    className={`w-full p-4 bg-slate-50 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400 ${
                      errors.email
                        ? 'border-red-200 bg-red-50'
                        : 'border-slate-100 focus:border-blue-500 focus:bg-white'
                    }`}
                    placeholder="contact@exemple.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
                    <Phone size={14} className="text-blue-500" />
                    Téléphone
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                    placeholder="06 00 00 00 00"
                  />
                </div>
              </div>
            </div>

            {/* Geographical Group */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-400 pb-2 border-b border-slate-100">
                <Globe size={16} />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Contexte National
                </h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
                    <Globe size={14} className="text-blue-500" />
                    Pays (ISO)
                  </label>
                  <input
                    {...register('country')}
                    type="text"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                    placeholder="FR, DE, US..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
                      <Coins size={14} className="text-blue-500" />
                      Devise
                    </label>
                    <input
                      {...register('currency')}
                      type="text"
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold uppercase"
                      placeholder="EUR, USD..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
                      <Languages size={14} className="text-blue-500" />
                      Langue
                    </label>
                    <input
                      {...register('language')}
                      type="text"
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                      placeholder="fr, en, de..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
                    <MapPin size={14} className="text-blue-500" />
                    Adresse postale
                  </label>
                  <textarea
                    {...register('address')}
                    rows={4}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all resize-none text-slate-600 font-bold leading-relaxed"
                    placeholder="N°, Rue, Code Postal, Ville"
                  />
                </div>
              </div>
            </div>

            {/* Billing Group */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-400 pb-2 border-b border-slate-100">
                <Building2 size={16} />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Données Facturation
                </h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
                    <Zap size={14} className="text-blue-500" />
                    Régime Fiscal
                  </label>
                  <select
                    {...register('taxType')}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer"
                  >
                    <option value="DOMESTIC">National (Avec TVA)</option>
                    <option value="EU_B2B">UE B2B (Auto-liquidation)</option>
                    <option value="EXPORT">Export / Hors UE (HT)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
                    <CreditCard size={14} className="text-blue-500" />
                    Délai Paiement (Jours)
                  </label>
                  <input
                    {...register('paymentTerms', { valueAsNumber: true })}
                    type="number"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                  />
                </div>

                {clientType === 'company' ? (
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
                        <ShieldCheck size={14} className="text-blue-500" />
                        SIRET / Identifiant local
                      </label>
                      <input
                        {...register('siret')}
                        type="text"
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-mono font-bold"
                        placeholder="Ex: 802 123 456 00012"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
                        <Zap size={14} className="text-blue-500" />
                        TVA Intracom. / VAT No.
                      </label>
                      <input
                        {...register('tvaNumber')}
                        type="text"
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-mono font-bold"
                        placeholder="Ex: FR 12 802123456"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex gap-4 mt-4">
                    <User className="text-slate-400 shrink-0" size={20} />
                    <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider">
                      Client Particulier : Identification fiscale simplifiée.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 ml-1">
              <StickyNote size={14} className="text-amber-500" />
              Notes privées & Consignes
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full p-4 bg-amber-50/50 border-2 border-amber-100 rounded-2xl focus:border-amber-400 focus:bg-white outline-none transition-all resize-none text-amber-900 font-bold leading-relaxed"
              placeholder="Ex: Facturation HT (Export US), Contact : Jane Smith..."
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le client"
        message="Êtes-vous sûr de vouloir supprimer ce client DÉFINITIVEMENT ? Cette action est irréversible."
        confirmLabel="Supprimer définitivement"
      />

      <div className="space-y-8">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
              size={20}
              strokeWidth={2.5}
            />
            <input
              type="text"
              placeholder="Rechercher par nom, email, siret..."
              className="w-full pl-16 pr-6 py-5 border-none rounded-[2rem] bg-card dark:bg-card shadow-soft focus:ring-4 focus:ring-primary/10 outline-none transition-all text-foreground font-bold placeholder:font-normal placeholder:opacity-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 bg-card px-8 py-5 rounded-[2rem] shadow-soft border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mr-2">
              <SortAsc size={18} strokeWidth={2.5} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden lg:inline opacity-60">
                Trier par
              </span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-[11px] font-black uppercase tracking-widest text-foreground outline-none cursor-pointer appearance-none"
            >
              <option value="name">Alphabétique (A-Z)</option>
              <option value="revenue">Chiffre d&apos;Affaires</option>
              <option value="activity">Activité Récente</option>
              <option value="date">Dernier ajouté</option>
            </select>
          </div>
        </div>

        {/* List of items */}
        {processedClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processedClients.map((client) => {
              const stats = getClientStats(client.id);

              return (
                <Card
                  key={client.id}
                  hoverable
                  data-testid="client-card"
                  className={`p-10 flex flex-col group relative overflow-hidden h-full ${client.archived ? 'grayscale opacity-75' : ''} border-none shadow-premium bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/40 dark:to-slate-900/10`}
                >
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div
                      className={`
                                    w-20 h-20 rounded-[2rem] flex items-center justify-center border-2 shadow-soft
                                    ${client.archived ? 'bg-muted text-muted-foreground border-border' : 'bg-primary/10 text-primary border-primary/20'}
                                    group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 font-black text-3xl tracking-tight
                                `}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(client)}
                        icon={Edit2}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className={client.archived ? 'text-emerald-500' : 'text-amber-500'}
                        onClick={(e) => toggleArchiveClient(client.id, e)}
                        icon={client.archived ? RefreshCcw : Archive}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={(e) => handleDeleteClient(client.id, e)}
                        icon={Trash2}
                      />
                    </div>
                  </div>

                  <div className="mb-8 relative z-10">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant={client.archived ? 'slate' : 'blue'}>
                        {client.archived ? 'Archivé' : 'Fidèle'}
                      </Badge>
                      {stats.revenue > 1000 && <Badge variant="emerald">Top Client</Badge>}
                    </div>
                    <h4
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="text-2xl font-black text-foreground group-hover:text-primary transition-colors tracking-tighter mb-1 cursor-pointer"
                    >
                      {client.name}
                    </h4>
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest opacity-60">
                      {client.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-muted/50 dark:bg-muted/10 rounded-3xl p-5 border border-transparent group-hover:bg-card group-hover:border-primary/20 transition-all duration-500">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1 opacity-60">
                        C.A. Total
                      </p>
                      <p className="text-xl font-black text-foreground tracking-tight">
                        {stats.revenue.toLocaleString()} €
                      </p>
                    </div>
                    <div className="bg-muted/50 dark:bg-muted/10 rounded-3xl p-5 border border-transparent group-hover:bg-card group-hover:border-primary/20 transition-all duration-500">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1 opacity-60">
                        Dernière Op.
                      </p>
                      <p className="text-sm font-black text-foreground tracking-tight">
                        {stats.lastActivity
                          ? new Date(stats.lastActivity).toLocaleDateString()
                          : 'Aucune'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-4 relative z-10">
                    {client.phone && (
                      <div className="flex items-center gap-4 text-muted-foreground group-hover:text-foreground transition-colors">
                        <Phone size={16} strokeWidth={2.5} className="opacity-40" />
                        <span className="text-[11px] font-black uppercase tracking-widest leading-none">
                          {client.phone}
                        </span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-4 text-muted-foreground group-hover:text-foreground transition-colors">
                        <MapPin size={16} strokeWidth={2.5} className="opacity-40" />
                        <span className="text-[11px] font-black uppercase tracking-widest truncate leading-none">
                          {client.address}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-8 border-t border-border/50 flex gap-3 relative z-10">
                    <button
                      onClick={() => navigate(`/invoices/new?clientId=${client.id}`)}
                      className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-3 group/btn shadow-premium active:scale-95"
                    >
                      <ReceiptText size={18} strokeWidth={2.5} />
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        Facturer
                      </span>
                    </button>
                    <button
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="h-14 w-14 bg-card border border-border rounded-2xl flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all cursor-pointer shadow-soft group/fiche active:scale-95"
                      title="Voir la fiche"
                    >
                      <UserCircle size={24} strokeWidth={2} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            data-testid="clients-empty-state"
            icon={Users}
            title={showArchived ? 'Archive vide' : 'Aucun client trouvé'}
            description={
              showArchived
                ? 'Votre archive est actuellement vide. Vous pouvez archiver des clients pour garder votre liste principale propre.'
                : 'Commencez par ajouter votre premier client pour éditer vos factures et suivre votre activité.'
            }
            actionLabel={showArchived ? undefined : 'Nouveau client'}
            onAction={showArchived ? undefined : openCreate}
          />
        )}
      </div>
    </div>
  );
};

export default ClientList;
