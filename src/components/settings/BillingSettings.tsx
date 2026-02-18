import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Hash, AlignLeft, Clock, Zap } from 'lucide-react';
import { UserProfile } from '../../types';

const BillingSettings: React.FC = () => {
  const { register, watch, setValue } = useFormContext<UserProfile>();

  const invoicePrefix = watch('invoicePrefix') || '';
  const invoiceStartNumber = watch('invoiceStartNumber') || 1;
  const quotePrefix = watch('quotePrefix') || '';
  const quoteStartNumber = watch('quoteStartNumber') || 1;
  const currentLegalMentions = watch('legalMentions') || '';

  const getNextNumber = (prefix: string, start: number) => {
    return `${prefix}${start.toString().padStart(4, '0')}`;
  };

  const addMentionTemplate = (template: string) => {
    const separator = currentLegalMentions ? '\n' : '';
    setValue('legalMentions', `${currentLegalMentions}${separator}${template}`);
  };

  const templates = [
    { label: 'Art. 293 B (TVA)', value: 'TVA non applicable, art. 293 B du CGI' },
    { label: 'Médiation', value: "Médiation de la consommation : [Nom de l'organisme médiateur]" },
    {
      label: 'Pénalités retard',
      value:
        "Pénalités de retard : 3 fois le taux d'intérêt légal. Indemnité forfaitaire pour frais de recouvrement : 40 €.",
    },
    { label: "Pas d'escompte", value: "Pas d'escompte pour paiement anticipé." },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500">
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-amber-500 text-white rounded-[1.5rem] shadow-premium">
            <Hash size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Numérotation & Préfixes
            </h2>
            <p className="text-slate-500 font-medium">Configurez vos séquences de documents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                Factures
              </h3>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-widest">
                Prochain : {getNextNumber(invoicePrefix, invoiceStartNumber)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Préfixe
                </label>
                <input
                  {...register('invoicePrefix')}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-900"
                  placeholder="Ex: F-"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  N° de départ
                </label>
                <input
                  type="number"
                  {...register('invoiceStartNumber', { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                Devis
              </h3>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-widest">
                Prochain : {getNextNumber(quotePrefix, quoteStartNumber)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Préfixe
                </label>
                <input
                  {...register('quotePrefix')}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-900"
                  placeholder="Ex: D-"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  N° de départ
                </label>
                <input
                  type="number"
                  {...register('quoteStartNumber', { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500">
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-premium">
            <AlignLeft size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Mentions & Notes
            </h2>
            <p className="text-slate-500 font-medium">Textes par défaut sur vos documents</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Notes par défaut (Factures)
            </label>
            <textarea
              {...register('defaultInvoiceNotes')}
              rows={3}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900 resize-none"
              placeholder="Ex: Merci pour votre confiance ! Conditions de paiement..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Mentions Légales Obligatoires
              </label>
              <div className="flex gap-2">
                {templates.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => addMentionTemplate(t.value)}
                    className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-tight hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    + {t.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              {...register('legalMentions')}
              rows={3}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900 resize-none text-sm italic"
              placeholder="Ex: TVA non applicable, art. 293 B du CGI..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500">
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-premium">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Délais & Régime
            </h2>
            <p className="text-slate-500 font-medium">Paramètres fiscaux et de paiement</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Délai de paiement par défaut
            </label>
            <div className="relative group">
              <input
                type="number"
                {...register('defaultPaymentDeadline', { valueAsNumber: true })}
                className="w-full pl-6 pr-20 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
              />
              <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                Jours
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Type d&apos;activité
            </label>
            <select
              {...register('activityType')}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
            >
              <option value="services">Prestation de services (BNC/BIC)</option>
              <option value="sales">Vente de marchandises (BIC)</option>
              <option value="mixed">Activité mixte</option>
            </select>
          </div>

          <div className="flex flex-col gap-6 p-6 bg-slate-50 rounded-[2rem] md:col-span-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest ml-1">
              Configuration Fiscale
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-transparent hover:border-slate-900 transition-all cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Exonération de TVA
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Franchise en base (Art. 293B)
                  </span>
                </div>
                <input
                  type="checkbox"
                  {...register('isVatExempt')}
                  className="w-6 h-6 rounded-lg border-2 border-slate-200 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-transparent hover:border-slate-900 transition-all cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Bénéficiaire ACCRE
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Taux de cotisations réduit
                  </span>
                </div>
                <input
                  type="checkbox"
                  {...register('hasAccre')}
                  className="w-6 h-6 rounded-lg border-2 border-slate-200 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-transparent hover:border-slate-900 transition-all cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Versement Libératoire
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Paiement de l&apos;IR avec les cotisations
                  </span>
                </div>
                <input
                  type="checkbox"
                  {...register('hasVersementLiberatoire')}
                  className="w-6 h-6 rounded-lg border-2 border-slate-200 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </label>

              <div className="p-4 bg-white rounded-2xl flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" />
                  <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Fréquence de déclaration
                  </span>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      value="monthly"
                      {...register('contributionQuarter')}
                      className="w-4 h-4 text-slate-900 focus:ring-slate-900 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">
                      Mensuelle
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      value="quarterly"
                      {...register('contributionQuarter')}
                      className="w-4 h-4 text-slate-900 focus:ring-slate-900 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">
                      Trimestrielle
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettings;
