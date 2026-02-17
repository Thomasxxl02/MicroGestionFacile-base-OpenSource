import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client, Invoice, InvoiceStatus } from '../../types';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  ReceiptText,
  TrendingUp,
  History,
  FileSpreadsheet,
  StickyNote,
  ExternalLink,
  Plus,
  Globe,
  Zap,
  CreditCard,
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface ClientDetailsProps {
  clients: Client[];
  invoices: Invoice[];
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ clients, invoices }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const client = useMemo(() => clients.find((c) => c.id === id), [clients, id]);

  const clientInvoices = useMemo(
    () =>
      invoices
        .filter((inv) => inv.clientId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [invoices, id]
  );

  const stats = useMemo(() => {
    const revenue = clientInvoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => {
        if (inv.type === 'credit_note') return sum - inv.total;
        if (!inv.type || inv.type === 'invoice') return sum + inv.total;
        return sum;
      }, 0);

    const pending = clientInvoices
      .filter((inv) => inv.status === InvoiceStatus.SENT)
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      revenue,
      pending,
      count: clientInvoices.length,
      paidCount: clientInvoices.filter((inv) => inv.status === InvoiceStatus.PAID).length,
    };
  }, [clientInvoices]);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-500">
        <p className="text-xl font-bold mb-4">Client introuvable</p>
        <Button onClick={() => navigate('/clients')} icon={ArrowLeft}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clients')}
          className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-slate-900">{client.name}</h1>
            {client.archived && <Badge variant="slate">Archivé</Badge>}
          </div>
          <p className="text-slate-500 font-medium">Fiche client détaillée</p>
        </div>

        <div className="ml-auto flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/invoices/new?clientId=${client.id}`)}
            icon={Plus}
          >
            Nouvelle Facture
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Client Info */}
        <div className="space-y-8">
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-center mb-8">
              <div className="w-24 h-24 rounded-[2rem] bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-3xl font-black text-blue-600 shadow-inner">
                {client.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                    Email
                  </p>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
                  >
                    {client.email}
                  </a>
                </div>
              </div>

              {client.phone && (
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                      Téléphone
                    </p>
                    <p className="text-sm font-bold text-slate-800">{client.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Globe size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                    Pays / Devise
                  </p>
                  <p className="text-sm font-bold text-slate-800 uppercase">
                    {client.country || 'FR'} · {client.currency || 'EUR'}
                  </p>
                </div>
              </div>

              {client.address && (
                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                      Adresse
                    </p>
                    <p className="text-sm font-bold text-slate-800 whitespace-pre-wrap">
                      {client.address}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Zap size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Régime Fiscal
                    </span>
                  </div>
                  <Badge variant={client.taxType === 'DOMESTIC' ? 'blue' : 'amber'}>
                    {client.taxType === 'DOMESTIC'
                      ? 'National'
                      : client.taxType === 'EU_B2B'
                        ? 'UE B2B'
                        : 'Export'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CreditCard size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Délai</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {client.paymentTerms || 30} jours
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Building2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">SIRET</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                    {client.siret || 'N/A'}
                  </span>
                </div>
                {client.tvaNumber && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileSpreadsheet size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        TVA Intracom.
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                      {client.tvaNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {client.notes && (
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-amber-50/30">
              <div className="flex items-center gap-2 mb-4 text-amber-600">
                <StickyNote size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">Notes internes</h3>
              </div>
              <p className="text-sm text-amber-900/70 font-medium leading-relaxed italic">
                "{client.notes}"
              </p>
            </Card>
          )}
        </div>

        {/* Right Column: Invoices & Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border-none shadow-lg bg-emerald-600 text-white overflow-hidden relative group">
              <TrendingUp className="absolute -right-4 -bottom-4 w-20 h-20 text-emerald-500/20 group-hover:scale-110 transition-transform duration-500" />
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">
                C.A. Encaissé
              </p>
              <h3 className="text-2xl font-black">{stats.revenue.toLocaleString()} €</h3>
            </Card>

            <Card className="p-6 border-none shadow-lg bg-blue-600 text-white overflow-hidden relative group">
              <ReceiptText className="absolute -right-4 -bottom-4 w-20 h-20 text-blue-500/20 group-hover:scale-110 transition-transform duration-500" />
              <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">
                En attente
              </p>
              <h3 className="text-2xl font-black">{stats.pending.toLocaleString()} €</h3>
            </Card>

            <Card className="p-6 border-none shadow-lg bg-indigo-600 text-white overflow-hidden relative group">
              <Building2 className="absolute -right-4 -bottom-4 w-20 h-20 text-indigo-500/20 group-hover:scale-110 transition-transform duration-500" />
              <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">
                Panier Moyen
              </p>
              <h3 className="text-2xl font-black">
                {(stats.paidCount > 0 ? stats.revenue / stats.paidCount : 0).toLocaleString()} €
              </h3>
            </Card>

            <Card className="p-6 border-none shadow-lg bg-slate-900 text-white overflow-hidden relative group">
              <History className="absolute -right-4 -bottom-4 w-20 h-20 text-slate-800/40 group-hover:scale-110 transition-transform duration-500" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                Documents
              </p>
              <h3 className="text-2xl font-black">{stats.count} Total</h3>
            </Card>
          </div>

          <Card className="p-0 border-none shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <ReceiptText size={16} className="text-blue-500" />
                Historique des Documents
              </h3>
              <Badge variant="blue">{clientInvoices.length} docs</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Numéro
                    </th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Date
                    </th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Type
                    </th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Montant
                    </th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Statut
                    </th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {clientInvoices.length > 0 ? (
                    clientInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-4 text-sm font-bold text-slate-900">{inv.number}</td>
                        <td className="px-8 py-4 text-sm text-slate-500">
                          {new Date(inv.date).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-4">
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest ${inv.type === 'quote' ? 'text-emerald-600' : 'text-blue-600'}`}
                          >
                            {inv.type === 'quote'
                              ? 'Devis'
                              : inv.type === 'credit_note'
                                ? 'Avoir'
                                : 'Facture'}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-sm font-black text-slate-900">
                          {inv.total.toLocaleString()} €
                        </td>
                        <td className="px-8 py-4">
                          <Badge
                            variant={
                              inv.status === InvoiceStatus.PAID
                                ? 'emerald'
                                : inv.status === InvoiceStatus.DRAFT
                                  ? 'slate'
                                  : 'blue'
                            }
                          >
                            {inv.status === InvoiceStatus.PAID
                              ? 'Payé'
                              : inv.status === InvoiceStatus.DRAFT
                                ? 'Brouillon'
                                : 'Envoyé'}
                          </Badge>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm"
                          >
                            <ExternalLink size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-medium">
                        Aucun document trouvé pour ce client.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
