import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Building, MapPin, Mail, Phone, Globe, CreditCard, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../../types';

const CompanySettings: React.FC = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<UserProfile>();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
          <Building size={120} />
        </div>

        <div className="flex items-center gap-5 mb-10 relative">
          <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-premium">
            <Building size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Identité de l'Entreprise
            </h2>
            <p className="text-slate-500 font-medium">Informations légales et fiscales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Nom de l'entreprise
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                <Building size={18} />
              </div>
              <input
                {...register('companyName')}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                placeholder="Ex: Ma Micro-Entreprise"
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1 font-bold">{errors.companyName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Numéro SIRET
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                <ShieldCheck size={18} />
              </div>
              <input
                {...register('siret')}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                placeholder="14 chiffres"
              />
              {errors.siret && (
                <p className="text-red-500 text-xs mt-1 font-bold">{errors.siret.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Forme Juridique
            </label>
            <input
              {...register('legalForm')}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
              placeholder="Ex: EI, SASU..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Capital Social (Optionnel)
            </label>
            <input
              type="number"
              {...register('capital', { valueAsNumber: true })}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
              placeholder="Ex: 1000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Ville RCS (Optionnel)
            </label>
            <input
              {...register('registrationCity')}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
              placeholder="Ex: Paris"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Numéro RCS (Optionnel)
            </label>
            <input
              {...register('registrationNumber')}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
              placeholder="Ex: 123 456 789"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Siège Social
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                <MapPin size={18} />
              </div>
              <input
                {...register('address')}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                placeholder="Adresse complète"
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1 font-bold">{errors.address.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Card */}
      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500">
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-premium shadow-blue-100">
            <Mail size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Contact & Web
            </h2>
            <p className="text-slate-500 font-medium">Pour vos échanges avec les clients</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Email Professionnel
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                <Mail size={18} />
              </div>
              <input
                {...register('email')}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                placeholder="contact@entreprise.fr"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 font-bold">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Téléphone
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                <Phone size={18} />
              </div>
              <input
                {...register('phone')}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                placeholder="06 00 00 00 00"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Site Internet
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                <Globe size={18} />
              </div>
              <input
                {...register('website')}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                placeholder="https://www.monsite.fr"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Banking Card */}
      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500">
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-emerald-600 text-white rounded-[1.5rem] shadow-premium shadow-emerald-100">
            <CreditCard size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Coordonnées Bancaires
            </h2>
            <p className="text-slate-500 font-medium">Pour recevoir vos paiements</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              IBAN
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                <CreditCard size={18} />
              </div>
              <input
                {...register('bankAccount')}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 tracking-wider"
                placeholder="FR76 ..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                BIC / SWIFT
              </label>
              <input
                {...register('bic')}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                placeholder="BIC"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                N° TVA Intracommunautaire
              </label>
              <input
                {...register('tvaNumber')}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                placeholder="FR..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
