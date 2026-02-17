import React, { useState, useCallback, lazy, Suspense } from 'react';
import {
  ArrowLeft,
  FileText,
  Search,
  Package,
  ShoppingBag,
  Wand2,
  Trash2,
  Plus,
  Calculator,
  Truck,
  Eye,
  UserPlus,
  PlusCircle,
  Copy,
  Layers,
  Settings2,
  Percent,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { Invoice, InvoiceItem, Client, UserProfile, DocumentType, Product } from '../../types';
import { suggestInvoiceDescription } from '../../services/geminiService';
import { useInvoiceCalculations } from '../../hooks/useInvoiceCalculations';
import { db } from '../../services/db';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { toast } from 'sonner';

const InvoicePreviewDocument = lazy(() => import('./InvoicePreviewDocument'));

interface InvoiceFormProps {
  initialData: Partial<Invoice>;
  clients: Client[];
  products: Product[];
  invoices: Invoice[];
  userProfile: UserProfile;
  onSubmit: (data: Partial<Invoice>, clientId: string) => void;
  onCancel: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  initialData,
  clients,
  products,
  invoices,
  userProfile,
  onSubmit,
  onCancel,
}) => {
  const [docData, setDocData] = useState<Partial<Invoice>>(initialData);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialData.clientId || '');
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // Quick states for on-the-fly creation
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickProductName, setQuickProductName] = useState('');

  const { subtotal, taxAmount, total, balanceDue } = useInvoiceCalculations({
    items: docData.items || [],
    discount: docData.discount,
    shipping: docData.shipping,
    deposit: docData.deposit,
  });

  const addItem = () => {
    const items = docData.items || [];
    setDocData({
      ...docData,
      items: [
        ...items,
        {
          id: Date.now().toString(),
          description: '',
          quantity: 1,
          unit: 'unité',
          unitPrice: 0,
          taxRate: userProfile.isVatExempt ? 0 : 20,
          discount: 0,
          category: userProfile.activityType === 'sales' ? 'MARCHANDISE' : 'SERVICE_BIC',
        },
      ],
    });
  };

  const addSection = () => {
    const items = docData.items || [];
    setDocData({
      ...docData,
      items: [
        ...items,
        {
          id: Date.now().toString(),
          description: 'Nouvelle Section',
          quantity: 1,
          unit: '',
          unitPrice: 0,
          isSection: true,
          category: 'SERVICE_BIC',
        },
      ],
    });
  };

  const cloneItem = (item: InvoiceItem) => {
    const items = docData.items || [];
    setDocData({
      ...docData,
      items: [
        ...items,
        {
          ...item,
          id: Date.now().toString(),
        },
      ],
    });
  };

  const addProductItem = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const items = docData.items || [];
      setDocData({
        ...docData,
        items: [
          ...items,
          {
            id: crypto.randomUUID(),
            productId: product.id,
            description: product.name,
            quantity: 1,
            unit: product.unit || 'unité',
            unitPrice: product.price,
            taxRate: userProfile.isVatExempt ? 0 : 20,
            discount: 0,
            category:
              product.taxCategory || (product.type === 'product' ? 'MARCHANDISE' : 'SERVICE_BIC'),
          },
        ],
      });
    },
    [products, docData, userProfile.isVatExempt]
  );

  const handleQuickClientCreate = useCallback(async () => {
    if (!quickClientName) return;
    const client: Client = {
      id: crypto.randomUUID(),
      name: quickClientName,
      email: '',
      address: '',
      country: 'FR',
      currency: 'EUR',
      language: 'fr',
      taxType: 'DOMESTIC',
      paymentTerms: 30,
    };
    await db.clients.add(client);
    setSelectedClientId(client.id);
    setIsQuickClientOpen(false);
    setQuickClientName('');
  }, [quickClientName, setSelectedClientId]);

  const handleQuickProductCreate = useCallback(async () => {
    if (!quickProductName) return;
    const product: Product = {
      id: crypto.randomUUID(),
      name: quickProductName,
      description: '',
      price: 0,
      taxRate: 20,
      legalWarranty: '2 ans',
      origin: 'France',
      unit: 'unité',
      type: 'service',
      taxCategory: 'SERVICE_BIC',
    };
    await db.products.add(product);
    addProductItem(product.id);
    setIsQuickProductOpen(false);
    setQuickProductName('');
  }, [quickProductName, addProductItem]);

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number | undefined) => {
    const items =
      docData.items?.map((item) => (item.id === id ? { ...item, [field]: value } : item)) || [];
    setDocData({ ...docData, items });
  };

  const removeItem = (id: string) => {
    const items = docData.items?.filter((item) => item.id !== id) || [];
    setDocData({ ...docData, items });
  };

  const handleGenerateDescription = async (itemId: string, currentDesc: string) => {
    if (!selectedClientId) {
      toast.error("Veuillez sélectionner un client d'abord.");
      return;
    }
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;

    setIsGeneratingDesc(true);
    const suggestion = await suggestInvoiceDescription(
      client.name,
      currentDesc || 'Service général',
      userProfile.geminiKey
    );
    setIsGeneratingDesc(false);

    updateItem(itemId, 'description', suggestion);
  };

  const previewInvoice: Invoice = {
    ...docData,
    id: docData.id || 'preview',
    number: docData.number || 'DOC-PREVIEW',
    date: docData.date || new Date().toISOString().split('T')[0],
    dueDate: docData.dueDate || new Date().toISOString().split('T')[0],
    items: docData.items || [],
    clientId: selectedClientId,
    status: docData.status || 'draft',
    subtotal: subtotal,
    taxAmount: taxAmount,
    total: total,
    deposit: docData.deposit || 0,
    shipping: docData.shipping || 0,
    discount: docData.discount || 0,
  } as Invoice;

  const steps = [
    { id: 1, title: 'Client & Dates', icon: FileText },
    { id: 2, title: 'Prestations', icon: Package },
    { id: 3, title: 'Options & Totaux', icon: Calculator },
  ];

  return (
    <div className="max-w-[1600px] mx-auto animate-fade-in pb-20">
      {/* Header & Type Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <button
          onClick={onCancel}
          className="group flex items-center gap-3 text-slate-500 hover:text-slate-900 font-bold transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
            <ArrowLeft size={20} />
          </div>
          <span>Annuler</span>
        </button>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          {(['invoice', 'quote', 'order', 'credit_note'] as DocumentType[]).map((t) => (
            <button
              key={t}
              onClick={() => setDocData({ ...docData, type: t })}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${docData.type === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              {t === 'invoice'
                ? 'Facture'
                : t === 'quote'
                  ? 'Devis'
                  : t === 'order'
                    ? 'Commande'
                    : 'Avoir'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-10 items-start">
        {/* Main Form Area */}
        <div className="flex-1 w-full space-y-8">
          {/* Stepper */}
          <div className="bg-card dark:bg-card p-6 rounded-[2.5rem] border border-border shadow-soft flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 -z-0"></div>
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-soft ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-premium scale-110'
                        : isCompleted
                          ? 'bg-emerald-500 text-white shadow-premium'
                          : 'bg-card border-2 border-border text-muted-foreground opacity-60 hover:opacity-100'
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={24} strokeWidth={3} />
                    ) : (
                      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    )}
                  </button>
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isActive ? 'text-primary' : 'text-muted-foreground opacity-60'}`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step 1: Client & Dates */}
          {currentStep === 1 && (
            <Card className="p-10 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 shadow-premium border-none">
              <div className="flex items-center gap-6 border-b border-border pb-10">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center shadow-soft">
                  <FileText size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-foreground tracking-tighter">
                    Client & Dates
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium opacity-60">
                    Identifiez votre client et définissez les échéances.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2 flex items-center justify-between gap-2 opacity-60">
                    <span className="flex items-center gap-2">
                      <Search size={14} className="text-primary" /> Client
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsQuickClientOpen(true)}
                      className="text-primary hover:text-primary/80 flex items-center gap-2 transition-all font-black text-[9px] uppercase tracking-widest"
                    >
                      <UserPlus size={12} /> Nouveau
                    </button>
                  </label>
                  <select
                    required
                    className="w-full p-5 bg-muted/30 border-none rounded-[1.5rem] text-base font-black outline-none focus:ring-4 focus:ring-primary/10 focus:bg-card transition-all appearance-none cursor-pointer"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                  >
                    <option value="">Choisir un client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2 opacity-60">
                    Date d'émission
                  </label>
                  <input
                    type="date"
                    className="w-full p-5 bg-muted/30 border-none rounded-[1.5rem] text-base font-black outline-none focus:ring-4 focus:ring-primary/10 focus:bg-card transition-all"
                    value={docData.date}
                    onChange={(e) => setDocData({ ...docData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2 opacity-60">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    className="w-full p-5 bg-muted/30 border-none rounded-[1.5rem] text-base font-black outline-none focus:ring-4 focus:ring-primary/10 focus:bg-card transition-all"
                    value={docData.dueDate}
                    onChange={(e) => setDocData({ ...docData, dueDate: e.target.value })}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2 opacity-60">
                    Date de prestation
                  </label>
                  <input
                    type="date"
                    className="w-full p-5 bg-muted/30 border-none rounded-[1.5rem] text-base font-black outline-none focus:ring-4 focus:ring-primary/10 focus:bg-card transition-all"
                    value={docData.serviceDate || ''}
                    onChange={(e) => setDocData({ ...docData, serviceDate: e.target.value })}
                  />
                </div>

                <div className="space-y-4 md:col-span-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2 opacity-60">
                    Référence Projet
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Refonte Site Web 2024..."
                    className="w-full p-5 bg-muted/30 border-none rounded-[1.5rem] text-base font-black outline-none focus:ring-4 focus:ring-primary/10 focus:bg-card transition-all placeholder:font-normal placeholder:opacity-30"
                    value={docData.reference || ''}
                    onChange={(e) => setDocData({ ...docData, reference: e.target.value })}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Articles & Services */}
          {currentStep === 2 && (
            <Card className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 shadow-premium border-none">
              <div className="flex justify-between items-center border-b border-border pb-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-[2rem] flex items-center justify-center shadow-soft">
                    <Package size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-foreground tracking-tighter">
                      Articles & Services
                    </h3>
                    <p className="text-muted-foreground text-sm font-medium opacity-60">
                      Détaillez les produits et services vendus.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={addSection}
                    icon={Layers}
                    className="text-muted-foreground"
                  >
                    Section
                  </Button>
                  <Button
                    variant="primary"
                    onClick={addItem}
                    icon={Plus}
                    className="shadow-premium"
                  >
                    Nouvelle Ligne
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {docData.items?.map((item) => (
                  <div
                    key={item.id}
                    className={`group relative p-6 rounded-3xl border-2 transition-all ${
                      item.isSection
                        ? 'bg-slate-900 border-slate-900'
                        : 'bg-slate-50/50 border-slate-100 hover:border-blue-200 hover:bg-white'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      {item.isSection ? (
                        <div className="md:col-span-12 space-y-2">
                          <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">
                            Titre de la Section
                          </label>
                          <input
                            type="text"
                            className="w-full p-4 bg-slate-800 border-2 border-slate-700 rounded-2xl text-lg font-black text-white outline-none focus:border-blue-500 transition-all"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Ex: Main d'oeuvre, Matériel..."
                          />
                        </div>
                      ) : (
                        <>
                          <div
                            className={`md:col-span-12 ${userProfile.activityType === 'mixed' ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-2`}
                          >
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                              Désignation
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all pr-12"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                placeholder="Saisissez ou choisissez un produit..."
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <button
                                  onClick={() =>
                                    handleGenerateDescription(item.id, item.description)
                                  }
                                  className={`p-2 rounded-xl transition-all ${isGeneratingDesc ? 'text-blue-200' : 'text-blue-500 hover:bg-blue-50'}`}
                                  title="Améliorer avec l'IA"
                                  disabled={isGeneratingDesc}
                                >
                                  <Wand2
                                    size={18}
                                    className={isGeneratingDesc ? 'animate-spin' : ''}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>

                          {userProfile.activityType === 'mixed' && (
                            <div className="md:col-span-4 lg:col-span-1 space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Activité
                              </label>
                              <select
                                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                                value={item.category || 'SERVICE_BIC'}
                                onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                              >
                                <option value="MARCHANDISE">Vente</option>
                                <option value="SERVICE_BIC">Service BIC</option>
                                <option value="SERVICE_BNC">Service BNC</option>
                              </select>
                            </div>
                          )}

                          <div className="md:col-span-2 lg:col-span-1 space-y-2 text-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">
                              Qté
                            </label>
                            <input
                              type="number"
                              className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all text-center"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, 'quantity', parseFloat(e.target.value))
                              }
                            />
                          </div>

                          <div className="md:col-span-2 lg:col-span-1 space-y-2 text-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">
                              Unité
                            </label>
                            <input
                              type="text"
                              className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all text-center"
                              value={item.unit || ''}
                              placeholder="unité"
                              onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                            />
                          </div>

                          <div className="md:col-span-3 lg:col-span-2 space-y-2 text-right">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-right block">
                              P.U. HT
                            </label>
                            <input
                              type="number"
                              className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all text-right"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(item.id, 'unitPrice', parseFloat(e.target.value))
                              }
                            />
                          </div>

                          <div className="md:col-span-2 lg:col-span-1 space-y-2 text-right">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-right block">
                              Rem %
                            </label>
                            <input
                              type="number"
                              className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all text-right"
                              value={item.discount || 0}
                              onChange={(e) =>
                                updateItem(item.id, 'discount', parseFloat(e.target.value))
                              }
                            />
                          </div>

                          <div className="md:col-span-2 lg:col-span-1 space-y-2 text-right">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-right block">
                              TVA %
                            </label>
                            <select
                              className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none text-right"
                              value={item.taxRate || 0}
                              onChange={(e) =>
                                updateItem(item.id, 'taxRate', parseFloat(e.target.value))
                              }
                            >
                              <option value="0">0%</option>
                              <option value="5.5">5.5%</option>
                              <option value="10">10%</option>
                              <option value="20">20%</option>
                            </select>
                          </div>

                          <div className="md:col-span-3 lg:col-span-3 space-y-2 text-right">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-right block">
                              Total TTC
                            </label>
                            <div className="w-full p-4 bg-slate-100/50 rounded-2xl text-sm font-black text-slate-900 text-right">
                              {(
                                item.quantity *
                                item.unitPrice *
                                (1 - (item.discount || 0) / 100) *
                                (1 + (item.taxRate || 0) / 100)
                              ).toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                              })}{' '}
                              €
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="absolute -right-3 -top-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 shadow-lg shadow-red-200"
                      >
                        <Trash2 size={14} />
                      </button>
                      {!item.isSection && (
                        <button
                          onClick={() => cloneItem(item)}
                          className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:scale-110 shadow-lg shadow-blue-200"
                          title="Dupliquer la ligne"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {(!docData.items || docData.items.length === 0) && (
                  <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                      <ShoppingBag size={32} />
                    </div>
                    <p className="text-slate-400 font-bold">Votre document est vide.</p>
                    <button
                      onClick={addItem}
                      className="mt-4 text-blue-600 font-black uppercase tracking-widest text-xs hover:text-blue-700 transition-colors"
                    >
                      Ajouter un premier article
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addProductItem(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-[2] p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:border-blue-500 hover:text-blue-600 transition-all appearance-none cursor-pointer outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      + Ajouter depuis le catalogue
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.price.toLocaleString()}€
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsQuickProductOpen(true)}
                    className="flex-1 p-4 bg-blue-50 text-blue-600 border-2 border-dashed border-blue-100 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <PlusCircle size={20} />
                    Nouveau produit
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Options & Totals */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-8 space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <FileText size={14} className="text-blue-500" />
                    Notes & Mentions
                  </label>
                  <textarea
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:border-blue-500 outline-none transition-all resize-none font-medium text-slate-700"
                    rows={4}
                    placeholder="Ex: TVA non applicable..."
                    value={docData.notes || ''}
                    onChange={(e) => setDocData({ ...docData, notes: e.target.value })}
                  />
                </Card>
                <Card className="p-8 space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Settings2 size={14} className="text-amber-500" />
                    Notes Internes
                  </label>
                  <textarea
                    className="w-full p-4 bg-amber-50/30 border-2 border-amber-100 rounded-2xl text-sm focus:border-amber-500 outline-none transition-all resize-none font-medium text-slate-700"
                    rows={4}
                    placeholder="Privé..."
                    value={docData.internalNotes || ''}
                    onChange={(e) => setDocData({ ...docData, internalNotes: e.target.value })}
                  />
                </Card>
              </div>

              <Card className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Langue
                    </label>
                    <select
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                      value={docData.language || 'fr'}
                      onChange={(e) =>
                        setDocData({ ...docData, language: e.target.value as 'fr' | 'en' })
                      }
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Règlement
                    </label>
                    <select
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                      value={docData.paymentMethod || ''}
                      onChange={(e) => setDocData({ ...docData, paymentMethod: e.target.value })}
                    >
                      <option value="">Mode...</option>
                      <option value="Virement">Virement</option>
                      <option value="Chèque">Chèque</option>
                      <option value="Espèces">Espèces</option>
                      <option value="CB">CB</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Conditions
                    </label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all"
                      value={docData.paymentTerms || ''}
                      onChange={(e) => setDocData({ ...docData, paymentTerms: e.target.value })}
                      placeholder="Ex: Paiement à réception"
                    />
                  </div>
                </div>
              </Card>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() =>
                    onSubmit({ ...docData, total, subtotal, taxAmount }, selectedClientId)
                  }
                  className="px-12 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 font-black uppercase tracking-widest shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                >
                  Enregistrer le document
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-10 border-t border-slate-100">
            <button
              onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 font-black uppercase tracking-widest text-xs transition-all ${
                currentStep === 1 ? 'opacity-0' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            <div className="flex gap-2">
              {steps.map((s) => (
                <div
                  key={s.id}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentStep === s.id ? 'w-8 bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => currentStep < 3 && setCurrentStep(currentStep + 1)}
              disabled={currentStep === 3}
              className={`flex items-center gap-2 font-black uppercase tracking-widest text-xs transition-all ${
                currentStep === 3 ? 'opacity-0' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Live Preview & Recap Sidebar */}
        <aside className="w-full xl:w-[450px] shrink-0 space-y-8 lg:sticky lg:top-10">
          {/* Totals Summary Card */}
          <div className="bg-slate-950 dark:bg-card text-white rounded-[3rem] p-10 shadow-premium overflow-hidden relative group border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] group-hover:bg-primary/30 transition-all duration-1000"></div>

            <div className="relative z-10 space-y-10">
              <div className="flex justify-between items-center border-b border-white/10 pb-8">
                <h3 className="text-xl font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                  <Calculator size={24} strokeWidth={2.5} /> Récapitulatif
                </h3>
                <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full text-slate-300 uppercase tracking-tighter">
                  {docData.type || 'Facture'}
                </span>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Total HT
                  </span>
                  <span className="text-lg font-black tracking-tight">{subtotal.toFixed(2)} €</span>
                </div>

                <div className="flex justify-between items-center group/item">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                    <Percent size={14} className="text-emerald-400" /> Remise (%)
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-right text-white outline-none focus:ring-2 focus:ring-primary/50 font-black text-xs transition-all"
                      value={docData.discount || ''}
                      onChange={(e) =>
                        setDocData({ ...docData, discount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center group/item">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                    <Truck size={14} className="text-blue-400" /> Livraison
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-right text-white outline-none focus:ring-2 focus:ring-primary/50 font-black text-xs transition-all"
                      value={docData.shipping || ''}
                      onChange={(e) =>
                        setDocData({ ...docData, shipping: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10 space-y-8">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                      Total TVA
                    </span>
                    <span className="text-lg font-black tracking-tight text-white/80">
                      {taxAmount.toFixed(2)} €
                    </span>
                  </div>

                  <div className="flex justify-between items-end bg-white/5 p-6 rounded-[2rem] border border-white/5">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
                        Total TTC
                      </p>
                      <p className="text-4xl font-black text-white tracking-tighter">
                        {total.toFixed(2)} €
                      </p>
                    </div>
                    {docData.deposit ? (
                      <div className="text-right">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-1">
                          Solde
                        </p>
                        <p className="text-2xl font-black text-slate-300 tracking-tighter italic">
                          {balanceDue.toFixed(2)} €
                        </p>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-primary/20 text-primary rounded-3xl flex items-center justify-center shadow-soft ring-4 ring-primary/10">
                        <Calculator size={32} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Live Preview Container */}
          <div className="bg-card dark:bg-card rounded-[3rem] border border-border shadow-soft overflow-hidden flex flex-col h-[600px] group/preview">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                <Eye size={16} className="text-primary" />
                Aperçu Direct
              </span>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-border transition-all group-hover/preview:bg-primary/40 duration-500"></div>
                <div className="w-2 h-2 rounded-full bg-border transition-all group-hover/preview:bg-primary/40 duration-500 delay-100"></div>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-muted p-6 scrollbar-hide">
              <div
                className="bg-white shadow-premium origin-top mx-auto rounded-xl"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  transform: 'scale(0.38)',
                  marginBottom: '-180mm',
                }}
              >
                <Suspense
                  fallback={
                    <div className="flex h-60 items-center justify-center">
                      <Loader2 className="animate-spin text-blue-500" />
                    </div>
                  }
                >
                  <InvoicePreviewDocument
                    invoice={previewInvoice}
                    clients={clients}
                    userProfile={userProfile}
                    invoices={invoices}
                    isPreview={true}
                  />
                </Suspense>
              </div>
            </div>
            <div className="p-6 text-center bg-muted/30 border-t border-border">
              <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest italic leading-relaxed">
                Représentation visuelle du document final.
                <br />
                Les polices et le rendu PDF exact peuvent varier.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Modals remain the same */}
      <Modal
        isOpen={isQuickClientOpen}
        onClose={() => setIsQuickClientOpen(false)}
        title="Nouveau Client Rapide"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Nom / Entreprise
            </label>
            <input
              autoFocus
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500"
              value={quickClientName}
              onChange={(e) => setQuickClientName(e.target.value)}
              placeholder="Ex: Jean Dupont ou SARL Innov"
              onKeyDown={(e) => e.key === 'Enter' && handleQuickClientCreate()}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsQuickClientOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleQuickClientCreate}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isQuickProductOpen}
        onClose={() => setIsQuickProductOpen(false)}
        title="Création Rapide de Produit"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Désignation
            </label>
            <input
              autoFocus
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500"
              value={quickProductName}
              onChange={(e) => setQuickProductName(e.target.value)}
              placeholder="Ex: Consultation expert"
              onKeyDown={(e) => e.key === 'Enter' && handleQuickProductCreate()}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsQuickProductOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleQuickProductCreate}>
              Créer et ajouter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InvoiceForm;
