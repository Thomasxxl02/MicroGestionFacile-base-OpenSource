import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate, useSearchParams } from 'react-router-dom';
import { useInvoices, useClients, useProducts, useUserProfile } from '../hooks/useData';
import { Invoice, Client, UserProfile, Product } from '../types';
import { db } from '../services/db';
import Header from './ui/Header';
import Button from './ui/Button';
import ConfirmDialog from './ui/ConfirmDialog';
import { ArrowLeft, Calendar, ArrowRightCircle, Receipt, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { calculateHash } from '../lib/utils';
import { generateFacturX_XML, getNextDocumentNumber } from '../services/businessService';
import { generateImmutablePDF_Server, generatePDF } from '../services/pdfService';
import { useAsync } from '../hooks/useAsync';
import { logger } from '../services/loggerService';
import { validateInvoice } from '../services/validationService';

// Lazy loading sub-components to reduce initial chunk size
const InvoiceList = lazy(() => import('./invoices/InvoiceList'));
const InvoiceForm = lazy(() => import('./invoices/InvoiceForm'));
const InvoicePreviewDocument = lazy(() => import('./invoices/InvoicePreviewDocument'));

const LoadingFallback = () => (
  <div className="flex h-[30vh] w-full items-center justify-center">
    <div className="flex flex-col items-center gap-2 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p>Chargement du module de facturation...</p>
    </div>
  </div>
);

const InvoiceManager: React.FC = () => {
  const invoices = useInvoices();
  const clients = useClients();
  const products = useProducts();
  const { profile: userProfile } = useUserProfile();
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // useAsync for save operations with retry logic (2 retries, 1s delay)
  const { execute: executeSave } = useAsync<void>({
    retryCount: 2,
    retryDelay: 1000,
    showToast: false, // Handle toasts manually
  });

  const handleExportFacturX = (invoice: Invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    const xml = generateFacturX_XML(invoice, userProfile, client);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `factur-x-${invoice.number}.xml`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Le fichier XML Factur-X a été généré.');
  };

  const handleSave = async (data: Partial<Invoice>, clientId: string, isEdit: boolean) => {
    if (!clientId) {
      toast.error('❌ Veuillez sélectionner un client.');
      return;
    }

    // 🛡️ Vérifier que le client existe
    const clientExists = clients.some((c) => c.id === clientId);
    if (!clientExists) {
      toast.error("❌ Le client sélectionné n'existe plus.");
      return;
    }

    try {
      await executeSave(
        async () => {
          if (!isEdit) {
            const docToSave: Invoice = {
              ...data,
              id: Date.now().toString(),
              clientId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              number: '', // Will be set below
              type: data.type || 'invoice',
              date: data.date || new Date().toISOString().split('T')[0],
              dueDate: data.dueDate || new Date().toISOString().split('T')[0],
              items: data.items || [],
              status: data.status || 'draft',
              total: data.total || 0,
            };

            docToSave.number = getNextDocumentNumber(invoices, docToSave.type, userProfile);

            // Integrity hashing before storage
            docToSave.integrityHash = await calculateHash(JSON.stringify(docToSave));

            // 🛡️ Valider la facture avant sauvegarde
            const validationResult = await validateInvoice(docToSave, docToSave.id);
            if (!validationResult.valid) {
              const errors = validationResult.errors
                .slice(0, 3)
                .map((e) => e.message)
                .join(', ');
              toast.error(`❌ Erreur validation facture: ${errors}`);
              throw new Error(`Validation failed: ${errors}`);
            }

            await db.invoices.add(docToSave);
          } else if (data.id) {
            const existing = await db.invoices.get(data.id);
            if (existing?.type === 'invoice' && existing.status !== 'draft') {
              toast.error('❌ Cette facture est émise et ne peut plus être modifiée.');
              throw new Error('Invoice is locked');
            }

            const updatedData = {
              ...data,
              clientId,
              updatedAt: new Date().toISOString(),
            };

            // Re-calculate hash for the updated document
            if (existing) {
              const fullDoc = { ...existing, ...updatedData };
              updatedData.integrityHash = await calculateHash(JSON.stringify(fullDoc));

              // 🛡️ Valider les données mises à jour
              const validationResult = await validateInvoice(fullDoc, fullDoc.id);
              if (!validationResult.valid) {
                const errors = validationResult.errors
                  .slice(0, 3)
                  .map((e) => e.message)
                  .join(', ');
                toast.error(`❌ Erreur validation facture: ${errors}`);
                throw new Error(`Validation failed: ${errors}`);
              }
            }

            await db.invoices.update(data.id, updatedData);
          }
        },
        isEdit ? 'Updating invoice' : 'Creating invoice'
      );

      toast.success(isEdit ? '✅ Modification enregistrée' : '✅ Nouveau document créé');
      logger.info(`Invoice ${isEdit ? 'updated' : 'created'}`, { invoiceId: data.id, clientId });
      navigate('/invoices');
    } catch (error) {
      logger.error(
        'Invoice save failed',
        error instanceof Error ? error : new Error(String(error))
      );
      if (!(error instanceof Error && error.message.includes('Validation failed'))) {
        toast.error('💥 Erreur lors de la sauvegarde.');
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await db.invoices.delete(deleteId);
        const invoice = invoices.find((i) => i.id === deleteId);
        toast.success(`✅ Facture ${invoice?.number || 'n°?'} supprimée`);
        setDeleteId(null);
        setIsConfirmOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error(`❌ Erreur suppression: ${message}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const doc = await db.invoices.get(id);
    if (doc?.type === 'invoice' && doc.status !== 'draft') {
      toast.error('Cette facture est émise et ne peut plus être supprimée.');
      return;
    }
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleDuplicate = async (invoice: Invoice) => {
    const newInvoice = {
      ...invoice,
      id: Date.now().toString(),
      number: `${invoice.number}-COPY`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      status: 'draft' as const,
    };
    await db.invoices.add(newInvoice);
  };

  const handleConvertToInvoice = async (quote: Invoice) => {
    const newInvoice = {
      ...quote,
      id: Date.now().toString(),
      type: 'invoice' as const,
      number: getNextDocumentNumber(invoices, 'invoice', userProfile),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      status: 'draft' as const,
      linkedDocumentId: quote.id,
    };
    await db.invoices.add(newInvoice);
    toast.success(`Devis converti en facture ${newInvoice.number}`);
  };

  const handleCreateCreditNote = async (invoice: Invoice) => {
    const newCreditNote: Invoice = {
      ...invoice,
      id: Date.now().toString(),
      type: 'credit_note' as const,
      number: getNextDocumentNumber(invoices, 'credit_note', userProfile),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft' as const,
      linkedDocumentId: invoice.id,
      // On conserve les items et montants, c'est le type 'credit_note' qui indique que c'est une déduction
      integrityHash: '',
    };
    newCreditNote.integrityHash = await calculateHash(JSON.stringify(newCreditNote));
    await db.invoices.add(newCreditNote);
    toast.success(`Avoir créé pour la facture ${invoice.number}`);
    navigate(`/invoices/${newCreditNote.id}/edit`);
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    const xml =
      invoice.type === 'invoice' ? generateFacturX_XML(invoice, userProfile, client) : undefined;

    // Tentative de génération côté serveur pour l'immutabilité et Factur-X réel
    const success = await generateImmutablePDF_Server({
      number: invoice.number,
      date: invoice.date,
      clientName: client?.name || 'Client',
      items: invoice.items,
      total: invoice.total,
      taxAmount: invoice.taxAmount || 0,
      integrityHash: invoice.integrityHash || 'no-hash',
      facturX_XML: xml,
    });

    // Fallback sur la génération locale si le serveur est indisponible
    if (!success) {
      await generatePDF('invoice-preview', `${invoice.type}-${invoice.number}`, xml);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const doc = await db.invoices.get(id);
    if (doc && doc.status !== 'draft' && status === 'draft') {
      toast.error('Impossible de repasser une facture émise en brouillon.');
      return;
    }
    await db.invoices.update(id, { status, updatedAt: new Date().toISOString() });
    toast.success('Statut mis à jour');
  };

  return (
    <div data-testid="invoices-container" className="min-h-screen bg-[#F8FAFC]">
      <Header title="Facturation & Devis" description="Gérez votre cycle de vente de A à Z" />

      <main className="p-8 pb-24">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route
              path="/"
              element={
                <InvoiceList
                  invoices={invoices}
                  clients={clients}
                  onEdit={(inv) => navigate(`/invoices/${inv.id}/edit`)}
                  onDelete={handleDelete}
                  onPreview={(inv) => navigate(`/invoices/${inv.id}`)}
                  onDuplicate={handleDuplicate}
                  onConvertToInvoice={handleConvertToInvoice}
                  onUpdateStatus={handleUpdateStatus}
                  onExportFacturX={handleExportFacturX}
                  onCreateCreditNote={handleCreateCreditNote}
                  onCreate={() => navigate('/invoices/new')}
                />
              }
            />
            <Route
              path="/new"
              element={
                <NewInvoiceWrapper
                  invoices={invoices}
                  clients={clients}
                  products={products}
                  userProfile={userProfile}
                  onSave={(data, clientId) => handleSave(data, clientId, false)}
                  onCancel={() => navigate('/invoices')}
                />
              }
            />
            <Route
              path="/:id/edit"
              element={
                <EditInvoiceWrapper
                  invoices={invoices}
                  clients={clients}
                  products={products}
                  userProfile={userProfile}
                  onSave={(data, clientId) => handleSave(data, clientId, true)}
                  onCancel={() => navigate('/invoices')}
                />
              }
            />
            <Route
              path="/:id"
              element={
                <PreviewInvoiceWrapper
                  invoices={invoices}
                  clients={clients}
                  userProfile={userProfile}
                  onDownload={handleDownloadPDF}
                  onExportFacturX={handleExportFacturX}
                  onBack={() => navigate('/invoices')}
                  onDuplicate={handleDuplicate}
                  onCreateCreditNote={handleCreateCreditNote}
                />
              }
            />
            <Route path="*" element={<Navigate to="/invoices" replace />} />
          </Routes>
        </Suspense>
      </main>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le document"
        message="Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible."
        confirmLabel="Supprimer"
      />
    </div>
  );
};

interface NewInvoiceWrapperProps {
  invoices: Invoice[];
  clients: Client[];
  products: Product[];
  userProfile: UserProfile;
  onSave: (data: Partial<Invoice>, clientId: string) => void;
  onCancel: () => void;
}

const NewInvoiceWrapper: React.FC<NewInvoiceWrapperProps> = ({
  invoices,
  clients,
  products,
  userProfile,
  onSave,
  onCancel,
}) => {
  const [searchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get('clientId');

  // Use useState with initializer to calculate dates safely (only once)
  const [initialData] = useState<Partial<Invoice>>(() => {
    const now = new Date();
    const deadline =
      userProfile.defaultPaymentDeadline !== undefined ? userProfile.defaultPaymentDeadline : 30;
    const dueDate = new Date();
    dueDate.setDate(now.getDate() + deadline);

    return {
      type: 'invoice',
      number: '',
      date: now.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      items: [],
      status: 'draft',
      discount: 0,
      shipping: 0,
      deposit: 0,
      clientId: clientIdFromUrl || '',
      notes: userProfile.defaultInvoiceNotes || '',
      language: userProfile.defaultLanguage || 'fr',
    };
  });

  return (
    <InvoiceForm
      initialData={initialData}
      clients={clients}
      products={products}
      invoices={invoices}
      userProfile={userProfile}
      onSubmit={onSave}
      onCancel={onCancel}
    />
  );
};

interface EditInvoiceWrapperProps {
  invoices: Invoice[];
  clients: Client[];
  products: Product[];
  userProfile: UserProfile;
  onSave: (data: Partial<Invoice>, clientId: string) => void;
  onCancel: () => void;
}

const EditInvoiceWrapper: React.FC<EditInvoiceWrapperProps> = ({
  invoices,
  clients,
  products,
  userProfile,
  onSave,
  onCancel,
}) => {
  const { id } = useParams<{ id: string }>();
  const invoice = invoices.find((i) => i.id === id);

  if (!invoice) return <Navigate to="/invoices" replace />;

  if (invoice.type === 'invoice' && invoice.status !== 'draft') {
    toast.error('Cette facture est émise et ne peut plus être modifiée.');
    return <Navigate to="/invoices" replace />;
  }

  return (
    <InvoiceForm
      initialData={invoice}
      clients={clients}
      products={products}
      invoices={invoices}
      userProfile={userProfile}
      onSubmit={onSave}
      onCancel={onCancel}
    />
  );
};

interface PreviewInvoiceWrapperProps {
  invoices: Invoice[];
  clients: Client[];
  userProfile: UserProfile;
  onDownload: (invoice: Invoice) => void;
  onExportFacturX: (invoice: Invoice) => void;
  onBack: () => void;
  onDuplicate: (invoice: Invoice) => void;
  onCreateCreditNote: (invoice: Invoice) => void;
}

const PreviewInvoiceWrapper: React.FC<PreviewInvoiceWrapperProps> = ({
  invoices,
  clients,
  userProfile,
  onDownload,
  onExportFacturX,
  onBack,
  onDuplicate,
  onCreateCreditNote,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoice = invoices.find((i) => i.id === id);

  if (!invoice) return <Navigate to="/invoices" replace />;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 no-print">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 text-slate-500 hover:text-slate-900 font-bold transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
            <ArrowLeft size={20} />
          </div>
          <span>Retour aux documents</span>
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => window.print()}
            className="bg-white border-slate-200"
          >
            Imprimer
          </Button>
          {invoice.type === 'invoice' && (
            <Button
              variant="ghost"
              onClick={() => onExportFacturX(invoice)}
              className="bg-white border-slate-200 text-blue-600"
            >
              Export Factur-X
            </Button>
          )}
          <Button variant="primary" onClick={() => onDownload(invoice)} className="shadow-blue-200">
            Télécharger PDF
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-4 md:p-8 overflow-hidden">
        <InvoicePreviewDocument
          invoice={invoice}
          clients={clients}
          userProfile={userProfile}
          invoices={invoices}
          isPreview={false}
          onOpenLinkedDocument={(linkedId) => navigate(`/invoices/${linkedId}`)}
        />
      </div>

      <div className="mt-10 flex justify-center gap-4 no-print">
        {(invoice.type === 'quote' || invoice.status === 'draft') && (
          <Button
            variant="ghost"
            onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
            icon={Calendar}
          >
            Modifier le document
          </Button>
        )}
        {invoice.type === 'invoice' && (invoice.status === 'sent' || invoice.status === 'paid') && (
          <Button
            variant="ghost"
            className="text-rose-500"
            onClick={() => onCreateCreditNote(invoice)}
            icon={Receipt}
          >
            Créer un Avoir
          </Button>
        )}
        <Button variant="ghost" onClick={() => onDuplicate(invoice)} icon={Copy}>
          Dupliquer
        </Button>

        {invoice.type === 'quote' && (
          <Button
            variant="ghost"
            className="text-emerald-600"
            onClick={async () => {
              const count = invoices.filter((i) => i.type === 'invoice').length;
              const startNumber = userProfile.invoiceStartNumber || 1;
              const nextNumber = startNumber + count;
              const prefix = userProfile.invoicePrefix || 'FAC';

              const newInvoice = {
                ...invoice,
                id: Date.now().toString(),
                type: 'invoice' as const,
                number: `${prefix}-${new Date().getFullYear()}-${nextNumber.toString().padStart(4, '0')}`,
                date: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                status: 'draft' as const,
                linkedDocumentId: invoice.id,
              };
              await db.invoices.add(newInvoice);
              navigate(`/invoices/${newInvoice.id}`);
            }}
            icon={ArrowRightCircle}
          >
            Convertir en Facture
          </Button>
        )}
      </div>
    </div>
  );
};

export default InvoiceManager;
