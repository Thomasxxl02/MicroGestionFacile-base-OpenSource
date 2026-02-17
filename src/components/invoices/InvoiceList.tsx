import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Calendar,
  Eye,
  Trash2,
  Copy,
  ArrowRightCircle,
  FileText,
  FileCheck,
  ShoppingBag,
  Receipt,
  FileCode,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { List, RowComponentProps } from 'react-window';
import { Invoice, Client, DocumentType } from '../../types';
import { getInvoicesPaginated } from '../../services/db';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

interface InvoiceListProps {
  invoices: Invoice[]; // Still used for stats locally
  clients: Client[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onPreview: (invoice: Invoice) => void;
  onDuplicate: (invoice: Invoice) => void;
  onConvertToInvoice: (quote: Invoice) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onExportFacturX?: (invoice: Invoice) => void;
  onCreateCreditNote?: (invoice: Invoice) => void;
  onCreate: () => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  clients,
  onEdit,
  onDelete,
  onPreview,
  onDuplicate,
  onConvertToInvoice,
  onUpdateStatus,
  onExportFacturX,
  onCreateCreditNote,
  onCreate,
}) => {
  const [activeTab, setActiveTab] = useState<DocumentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [paginatedData, setPaginatedData] = useState<{ items: Invoice[]; total: number }>({
    items: [],
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch paginated data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getInvoicesPaginated({
          page: currentPage,
          pageSize,
          type: activeTab,
          status: statusFilter,
          searchQuery,
        });
        setPaginatedData(result);
      } catch (error) {
        console.error('Error fetching paginated invoices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [currentPage, pageSize, activeTab, statusFilter, searchQuery]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab, statusFilter, searchQuery]);

  // Row height for virtualization
  const ROW_HEIGHT = 100;
  const LIST_HEIGHT = 600;

  const stats = useMemo(() => {
    const relevantInvoices = invoices.filter((i) => i.type === 'invoice');
    const totalRevenue = relevantInvoices
      .filter((i) => i.status === 'paid')
      .reduce((acc, curr) => acc + curr.total, 0);
    const totalPending = relevantInvoices
      .filter((i) => i.status === 'sent')
      .reduce((acc, curr) => acc + curr.total, 0);
    const totalDrafts = relevantInvoices
      .filter((i) => i.status === 'draft')
      .reduce((acc, curr) => acc + curr.total, 0);

    return { totalRevenue, totalPending, totalDrafts };
  }, [invoices]);

  const filteredDocs = paginatedData.items;
  const totalItems = paginatedData.total;
  const totalPages = Math.ceil(totalItems / pageSize);

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText size={18} className="text-blue-500" />;
      case 'quote':
        return <FileCheck size={18} className="text-violet-500" />;
      case 'order':
        return <ShoppingBag size={18} className="text-indigo-500" />;
      case 'credit_note':
        return <Receipt size={18} className="text-rose-500" />;
      default:
        return <FileText size={18} />;
    }
  };

  const Row = ({ index, style }: RowComponentProps) => {
    const doc = filteredDocs[index];
    const client = clients.find((c) => c.id === doc.clientId);

    return (
      <div
        style={style}
        className="group hover:bg-muted/50 dark:hover:bg-muted/10 transition-all duration-300 border-b border-border flex items-center"
      >
        <div className="px-8 py-2 flex-1 min-w-[200px]">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-card dark:bg-card border border-border flex items-center justify-center shadow-soft group-hover:scale-110 group-hover:border-primary/20 dark:group-hover:border-primary/40 transition-all duration-500">
              {getDocIcon(doc.type)}
            </div>
            <div>
              <p
                className="text-sm font-black text-foreground tracking-tight group-hover:text-primary transition-colors cursor-pointer flex items-center gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(doc.number);
                }}
                title="Copier le numéro"
              >
                {doc.number}
                <Copy size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />
              </p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5 opacity-60">
                {doc.type === 'invoice'
                  ? 'Facture'
                  : doc.type === 'quote'
                    ? 'Devis'
                    : doc.type === 'order'
                      ? 'Commande'
                      : 'Avoir'}
              </p>
            </div>
          </div>
        </div>
        <div className="px-8 py-2 w-64 shrink-0">
          <p className="text-sm font-bold text-foreground truncate opacity-80">
            {client?.name || 'Client inconnu'}
          </p>
        </div>
        <div className="px-8 py-2 w-48 shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground opacity-60">
            <Calendar size={14} strokeWidth={2.5} />
            <span className="text-[11px] font-black uppercase tracking-widest">
              {new Date(doc.date).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="px-8 py-2 w-48 shrink-0">
          <div className="flex flex-col gap-1">
            <p className="text-base font-black text-foreground">{doc.total.toLocaleString()} €</p>
            {doc.status !== 'paid' && new Date(doc.dueDate) < new Date() && (
              <span className="text-[9px] font-black text-destructive uppercase tracking-widest bg-destructive/10 px-2 py-0.5 rounded-full self-start border border-destructive/20">
                Retard
              </span>
            )}
          </div>
        </div>
        <div className="px-8 py-2 w-48 shrink-0">
          <select
            className={`text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded-xl border border-border cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 transition-all
              ${
                doc.status === 'paid'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : doc.status === 'sent'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : 'bg-muted text-muted-foreground border-border'
              }`}
            value={doc.status}
            onChange={(e) => onUpdateStatus(doc.id, e.target.value)}
          >
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyé</option>
            <option value="paid">Payé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
        <div className="px-8 py-2 w-64 shrink-0 text-right">
          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
            <Button variant="ghost" size="icon" onClick={() => onPreview(doc)} icon={Eye} />
            {doc.type === 'invoice' && onExportFacturX && (
              <Button
                variant="ghost"
                size="icon"
                className="text-primary"
                onClick={() => onExportFacturX(doc)}
                icon={FileCode}
                title="Export Factur-X (XML)"
              />
            )}
            {doc.type === 'invoice' &&
              (doc.status === 'sent' || doc.status === 'paid') &&
              onCreateCreditNote && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-rose-500"
                  onClick={() => onCreateCreditNote(doc)}
                  icon={Receipt}
                  title="Créer un Avoir"
                />
              )}
            {doc.status === 'draft' || doc.type === 'quote' ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(doc)}
                  icon={Calendar}
                  title="Modifier"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDuplicate(doc)}
                  icon={Copy}
                  title="Dupliquer"
                />
                {doc.type === 'quote' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-emerald-600"
                    onClick={() => onConvertToInvoice(doc)}
                    icon={ArrowRightCircle}
                    title="Convertir en Facture"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(doc.id)}
                  icon={Trash2}
                  title="Supprimer"
                />
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDuplicate(doc)}
                icon={Copy}
                title="Dupliquer"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Statistiques Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 border-none shadow-premium bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-900/20 flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center shadow-soft">
            <Receipt size={32} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">
              Encaissé (Factures)
            </p>
            <p className="text-3xl font-black text-foreground tracking-tighter">
              {stats.totalRevenue.toLocaleString()} €
            </p>
          </div>
        </Card>

        <Card className="p-8 border-none shadow-premium bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-900/20 flex items-center gap-6">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center shadow-soft">
            <ArrowRightCircle size={32} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">
              En attente
            </p>
            <p className="text-3xl font-black text-foreground tracking-tighter">
              {stats.totalPending.toLocaleString()} €
            </p>
          </div>
        </Card>

        <Card className="p-8 border-none shadow-premium bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-900/20 flex items-center gap-6">
          <div className="w-16 h-16 bg-muted text-muted-foreground rounded-3xl flex items-center justify-center shadow-soft">
            <FileText size={32} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">
              Brouillons
            </p>
            <p className="text-3xl font-black text-foreground tracking-tighter">
              {stats.totalDrafts.toLocaleString()} €
            </p>
          </div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-[2.5rem] border border-border shadow-soft">
        <div className="flex bg-muted p-1.5 rounded-2xl">
          {(['all', 'invoice', 'quote', 'order', 'credit_note'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-primary-foreground dark:text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary dark:bg-primary/80 rounded-xl shadow-premium"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <span className="relative z-10 transition-colors duration-300">
                {tab === 'all'
                  ? 'Tous'
                  : tab === 'invoice'
                    ? 'Factures'
                    : tab === 'quote'
                      ? 'Devis'
                      : tab === 'order'
                        ? 'Commandes'
                        : 'Avoirs'}
              </span>
            </button>
          ))}
        </div>
        <Button
          onClick={onCreate}
          icon={Plus}
          variant="primary"
          className="w-full md:w-auto shadow-premium"
        >
          Nouveau Document
        </Button>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 mt-8">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="relative w-full md:w-96 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Rechercher un document ou un client..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 ring-blue-500/20 transition-all dark:text-white dark:placeholder-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-white p-1.5 rounded-xl border-2 border-slate-100">
              {['all', 'draft', 'sent', 'paid'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  {s === 'all'
                    ? 'Statut : Tous'
                    : s === 'draft'
                      ? 'Brouillons'
                      : s === 'sent'
                        ? 'Envoyés'
                        : 'Payés'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredDocs.length > 0 ? (
            <div className="min-w-[1200px]">
              {/* Header */}
              <div className="bg-slate-50/50 flex border-b border-slate-100">
                <div className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex-1">
                  Document
                </div>
                <div className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-64 shrink-0">
                  Client
                </div>
                <div className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-48 shrink-0">
                  Date
                </div>
                <div className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-48 shrink-0">
                  Montant
                </div>
                <div className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-48 shrink-0">
                  Statut
                </div>
                <div className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-64 shrink-0">
                  Actions
                </div>
              </div>

              {/* Virtualized List */}
              <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
                <List
                  style={{
                    height: Math.min(LIST_HEIGHT, filteredDocs.length * ROW_HEIGHT),
                    width: '100%',
                  }}
                  rowCount={filteredDocs.length}
                  rowHeight={ROW_HEIGHT}
                  rowComponent={Row}
                  rowProps={{}}
                />
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500">
                    Affichage de{' '}
                    <span className="text-slate-900 dark:text-white">
                      {currentPage * pageSize + 1}
                    </span>{' '}
                    à{' '}
                    <span className="text-slate-900 dark:text-white">
                      {Math.min((currentPage + 1) * pageSize, totalItems)}
                    </span>{' '}
                    sur <span className="text-slate-900 dark:text-white">{totalItems}</span>{' '}
                    documents
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0 || isLoading}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <ChevronLeft size={20} className="dark:text-white" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Logic to show pages around current page if many pages
                        let pageNum = i;
                        if (totalPages > 5) {
                          if (currentPage > 2) {
                            pageNum = currentPage - 2 + i;
                            if (pageNum >= totalPages) pageNum = totalPages - 5 + i;
                          }
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                              currentPage === pageNum
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage === totalPages - 1 || isLoading}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <ChevronRight size={20} className="dark:text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Aucun document"
              description="Vous n'avez pas encore créé de facture ou de devis. C'est le moment idéal pour lancer votre premier document professionnel."
              actionLabel="Créer un document"
              onAction={onCreate}
              className="border-none rounded-none py-20"
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default InvoiceList;
