import React, { lazy, Suspense } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Palette,
  Image as ImageIcon,
  Trash2,
  Type,
  CheckCircle2,
  PenTool,
  Loader2,
} from 'lucide-react';
import { UserProfile, Invoice } from '../../types';
import { getContrastColor } from '../../lib/utils';
import { toast } from 'sonner';

const InvoicePreviewDocument = lazy(() => import('../invoices/InvoicePreviewDocument'));

const COLORS = [
  { name: 'Bleu', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500' },
  { name: 'Vert', value: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Noir', value: '#0f172a', bg: 'bg-slate-900' },
  { name: 'Violet', value: '#8b5cf6', bg: 'bg-violet-500' },
  { name: 'Orange', value: '#f59e0b', bg: 'bg-amber-500' },
];

const MOCK_INVOICE: Invoice = {
  id: 'template',
  number: 'FAC-2026-001',
  date: new Date().toISOString(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  clientId: 'mock-client',
  items: [
    {
      id: '1',
      description: 'Prestation de service (Développement)',
      quantity: 5,
      unitPrice: 600,
      unit: 'jours',
      category: 'SERVICE_BNC',
      taxRate: 20,
    },
    {
      id: '2',
      description: 'Gestion de projet & Expertise Cloud',
      quantity: 1,
      unitPrice: 850,
      unit: 'u',
      category: 'SERVICE_BNC',
      taxRate: 20,
    },
  ],
  status: 'draft',
  type: 'invoice',
  language: 'fr',
  total: 4620, // (5*600 + 850)*1.2
  notes: 'Merci pour votre confiance ! Livraison prévue sous 15 jours.',
};

const BrandingSettings: React.FC = () => {
  const { watch, setValue } = useFormContext<UserProfile>();

  const logo = watch('logo');
  const signature = watch('signature');
  const themeColor = watch('themeColor') || '#3b82f6';
  const typography = watch('typography') || 'sans';
  const companyName = watch('companyName') || 'Mon Entreprise';
  const address = watch('address') || '123 Rue de la Réussite, 75000 Paris';
  const email = watch('email') || 'contact@monentreprise.fr';
  const phone = watch('phone') || '01 23 45 67 89';
  const siret = watch('siret') || '123 456 789 00012';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Le logo est trop lourd (max 1Mo)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('logo', reader.result as string, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setValue('logo', undefined, { shouldDirty: true });
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 512 * 1024) {
        toast.error('La signature est trop lourde (max 512Ko)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('signature', reader.result as string, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSignature = () => {
    setValue('signature', undefined, { shouldDirty: true });
  };

  const previewProfile: UserProfile = {
    ...watch(),
    companyName: companyName,
    address: address,
    email: email,
    phone: phone,
    siret: siret,
    logo: logo,
    signature: signature,
    themeColor: themeColor,
    typography: typography,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-premium">
              <Palette size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Identité Visuelle
              </h2>
              <p className="text-slate-500 font-medium">Logo, couleurs et polices</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Settings Section */}
          <div className="lg:col-span-7 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Logo Upload */}
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Logo de l'entreprise
                </label>
                <div className="relative group">
                  {logo ? (
                    <div className="relative w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center overflow-hidden p-8 group">
                      <img
                        src={logo}
                        alt="Logo"
                        className="max-w-full max-h-full object-contain drop-shadow-md"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                        <button
                          onClick={removeLogo}
                          className="p-3 bg-white text-red-600 rounded-xl hover:scale-110 transition-transform shadow-xl"
                          title="Supprimer le logo"
                        >
                          <Trash2 size={20} />
                        </button>
                        <label className="p-3 bg-white text-slate-900 rounded-xl hover:scale-110 transition-transform shadow-xl cursor-pointer">
                          <ImageIcon size={20} />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all group">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-slate-400 shadow-sm transition-colors">
                        <ImageIcon size={32} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-wider">
                          Uploader un logo
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                          PNG, JPG ou SVG (Max 1Mo)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Signature Upload */}
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Signature autographe
                </label>
                <div className="relative group">
                  {signature ? (
                    <div className="relative w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center overflow-hidden p-8 group">
                      <img
                        src={signature}
                        alt="Signature"
                        className="max-w-full max-h-full object-contain mix-blend-multiply drop-shadow-sm"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                        <button
                          onClick={removeSignature}
                          className="p-3 bg-white text-red-600 rounded-xl hover:scale-110 transition-transform shadow-xl"
                          title="Supprimer la signature"
                        >
                          <Trash2 size={20} />
                        </button>
                        <label className="p-3 bg-white text-slate-900 rounded-xl hover:scale-110 transition-transform shadow-xl cursor-pointer">
                          <PenTool size={20} />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleSignatureUpload}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all group">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-slate-400 shadow-sm transition-colors">
                        <PenTool size={32} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-wider">
                          Image de Signature
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                          Fichier image (Max 512Ko)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Color Palette */}
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Couleur de la marque
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setValue('themeColor', color.value, { shouldDirty: true })}
                      className={`
                        aspect-square rounded-2xl transition-all relative flex items-center justify-center
                        ${color.bg} shadow-sm
                        ${themeColor === color.value ? 'ring-4 ring-slate-100 scale-110 z-10' : 'hover:scale-105'}
                      `}
                      title={color.name}
                    >
                      {themeColor === color.value && (
                        <CheckCircle2
                          size={24}
                          color={getContrastColor(color.value)}
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Typographie
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setValue('typography', 'sans', { shouldDirty: true })}
                    className={`
                      p-4 rounded-2xl border-2 transition-all text-left group
                      ${
                        typography === 'sans'
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                      }
                    `}
                  >
                    <Type size={18} className="mb-2" />
                    <p className="font-bold text-sm uppercase tracking-widest">Moderne Sans</p>
                    <p
                      className={`text-[10px] mt-1 ${typography === 'sans' ? 'text-slate-400' : 'text-slate-300'}`}
                    >
                      Inter / Sans Serif
                    </p>
                  </button>
                  <button
                    onClick={() => setValue('typography', 'serif', { shouldDirty: true })}
                    className={`
                      p-4 rounded-2xl border-2 transition-all text-left font-serif group
                      ${
                        typography === 'serif'
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                      }
                    `}
                  >
                    <Type size={18} className="mb-2" />
                    <p className="font-bold text-sm uppercase tracking-widest">Classique Serif</p>
                    <p
                      className={`text-[10px] mt-1 ${typography === 'serif' ? 'text-slate-400' : 'text-slate-300'}`}
                    >
                      Playfair / Serif
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Preview */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-8">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-4 block">
                Aperçu de vos documents
              </label>
              <div className="bg-slate-500 rounded-[2.5rem] p-1 shadow-2xl overflow-hidden group">
                <div className="origin-top scale-[0.45] w-[210mm] absolute-0 translate-x-[-27.5%] translate-y-[-210mm]">
                  {/* Invisible container to hold the real size content */}
                </div>
                <div className="rounded-[2.2rem] overflow-hidden border-4 border-slate-900/10 pointer-events-none select-none">
                  <div className="transform origin-top scale-[0.45] h-[520px]">
                    <Suspense
                      fallback={
                        <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-slate-400 gap-4">
                          <Loader2 className="w-12 h-12 animate-spin" />
                          <span className="font-bold uppercase tracking-widest text-[10px]">
                            Chargement de l'aperçu...
                          </span>
                        </div>
                      }
                    >
                      <InvoicePreviewDocument
                        invoice={MOCK_INVOICE}
                        isPreview={true}
                        clients={[
                          {
                            id: 'mock-client',
                            name: 'Client Démo S.A.S',
                            email: 'contact@client-demo.fr',
                            address: "45 Avenue de l'Avenir, 69000 Lyon",
                            country: 'FR',
                            currency: 'EUR',
                            language: 'fr',
                            taxType: 'DOMESTIC',
                            paymentTerms: 30,
                          },
                        ]}
                        userProfile={previewProfile}
                        invoices={[]}
                      />
                    </Suspense>
                  </div>
                </div>
                <div className="bg-slate-900 text-white text-center py-4 text-[10px] font-black uppercase tracking-widest">
                  Génération en temps réel
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingSettings;
