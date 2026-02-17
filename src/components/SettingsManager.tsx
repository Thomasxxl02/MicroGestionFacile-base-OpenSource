import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserProfile, UserProfileSchema } from '../types/user.types';
import {
  Building,
  FileText,
  Palette,
  Database,
  Settings,
  Info,
  Save,
  CheckCircle2,
  TrendingUp,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { useUserProfile, useInvoices } from '../hooks/useData';
import BillingSettings from './settings/BillingSettings';
import BrandingSettings from './settings/BrandingSettings';
import DataSettings from './settings/DataSettings';
import PreferencesSettings from './settings/PreferencesSettings';
import CompanySettings from './settings/CompanySettings';
import { db } from '../services/db';

type TabId = 'company' | 'billing' | 'branding' | 'preferences' | 'data';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SettingsManager: React.FC = () => {
  const { profile: userProfile } = useUserProfile();
  const invoices = useInvoices();
  const [activeTab, setActiveTab] = useState<TabId>('company');
  const [isSaving, setIsSaving] = useState(false);

  const setUserProfile = async (newProfile: UserProfile) => {
    await db.userProfile.put({ ...newProfile, id: 'current' });
  };

  // React Hook Form initialization
  const methods = useForm<UserProfile>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(UserProfileSchema) as any,
    defaultValues: userProfile,
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, isValid },
  } = methods;

  // Watch branding fields for real-time preview
  const logo = watch('logo');
  const themeColor = watch('themeColor');
  const companyName = watch('companyName');
  const typography = watch('typography');

  // Sync form with userProfile prop (useful if updated elsewhere)
  useEffect(() => {
    reset(userProfile);
  }, [userProfile, reset]);

  const onSubmit = async (data: UserProfile) => {
    try {
      setIsSaving(true);
      await setUserProfile(data);
      toast.success('Paramètres enregistrés avec succès');
      reset(data); // Clear dirty state
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: Tab[] = [
    {
      id: 'company',
      label: 'Entreprise',
      icon: <Building size={18} />,
      description: 'Informations légales et coordonnées',
    },
    {
      id: 'billing',
      label: 'Facturation',
      icon: <FileText size={18} />,
      description: 'Numérotation et mentions par défaut',
    },
    {
      id: 'branding',
      label: 'Personnalisation',
      icon: <Palette size={18} />,
      description: 'Logo, couleurs et typographie',
    },
    {
      id: 'data',
      label: 'Données',
      icon: <Database size={18} />,
      description: 'Export, import et sauvegarde',
    },
    {
      id: 'preferences',
      label: 'Préférences',
      icon: <Settings size={18} />,
      description: 'Formats, notifications et options',
    },
  ];

  // Calculate statistics for the sidebar
  const stats = {
    totalInvoices: invoices?.length || 0,
    completionRate: (() => {
      const entries = Object.entries(userProfile);
      const filled = entries.filter(([, v]) => v !== undefined && v !== '').length;
      return Math.round((filled / entries.length) * 100);
    })(),
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="min-h-screen pb-20 animate-fade-in max-w-7xl mx-auto"
      >
        {/* Premium Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                  <Settings size={24} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Paramètres</h1>
              </div>
              <p className="text-slate-500 font-medium max-w-md leading-relaxed">
                Configurez votre identité visuelle, vos préférences de facturation et gérez vos
                données en toute sécurité.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {isDirty && (
                <button
                  type="submit"
                  disabled={isSaving || !isValid}
                  className={`
                    flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-premium hover:scale-105 active:scale-95
                    ${isSaving || !isValid ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save size={18} />
                  )}
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              )}
              <div className="hidden sm:flex items-center gap-3 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200"></div>
                <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                  Base de données locale
                </span>
              </div>
            </div>
          </div>

          {/* Premium Tab Navigation */}
          <div className="mt-12 p-2 bg-white/50 backdrop-blur-xl border-2 border-slate-100 rounded-[2.5rem] shadow-soft overflow-x-auto no-scrollbar">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black text-sm transition-all duration-500 whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'bg-slate-900 text-white shadow-premium shadow-slate-200 scale-[1.02]'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent'
                    }
                  `}
                >
                  <div className={`${activeTab === tab.id ? 'text-white' : 'text-slate-300'}`}>
                    {tab.icon}
                  </div>
                  <span className="uppercase tracking-[0.1em]">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* Main Content (Left) */}
          <div className="xl:col-span-8 space-y-10">
            <div className="p-6 bg-blue-50/50 backdrop-blur-md border border-blue-100/50 rounded-[2.5rem] flex items-start gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Info size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-blue-900 uppercase tracking-wider">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </p>
                <p className="text-sm text-blue-700/80 mt-1 font-medium italic">
                  {tabs.find((t) => t.id === activeTab)?.description}
                </p>
              </div>
            </div>

            {activeTab === 'company' && <CompanySettings />}
            {activeTab === 'billing' && <BillingSettings />}
            {activeTab === 'branding' && <BrandingSettings />}
            {activeTab === 'data' && <DataSettings />}
            {activeTab === 'preferences' && <PreferencesSettings />}
          </div>

          {/* Sidebar (Right) */}
          <div className="xl:col-span-4 space-y-8">
            {/* Real-time Branding Preview */}
            <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-soft overflow-hidden sticky top-8 transition-all duration-500 hover:shadow-premium">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">
                  Aperçu Document
                </h3>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-100"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-100"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-100"></div>
                </div>
              </div>

              <div className={`p-8 ${typography === 'serif' ? 'font-serif' : 'font-sans'}`}>
                {/* Visual Preview Container */}
                <div className="aspect-[1/1.414] bg-white shadow-[0_0_40px_rgba(0,0,0,0.03)] rounded-lg p-6 flex flex-col border border-slate-100">
                  <div className="flex justify-between items-start mb-8">
                    {logo ? (
                      <img src={logo} alt="Logo preview" className="h-10 w-auto object-contain" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-200">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <div className="text-right">
                      <div
                        className="h-1.5 w-24 rounded-full mb-1 opacity-20"
                        style={{ backgroundColor: themeColor }}
                      ></div>
                      <div className="h-1 w-16 bg-slate-50 rounded-full ml-auto"></div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                      {companyName || 'VOTRE ENTREPRISE'}
                    </h4>
                    <div className="space-y-1">
                      <div className="h-1 w-full bg-slate-50 rounded-full"></div>
                      <div className="h-1 w-3/4 bg-slate-50 rounded-full"></div>
                    </div>
                  </div>

                  <div className="border-t-2 border-slate-50 pt-6 mt-auto">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="h-1 w-12 bg-slate-50 rounded-full"></div>
                        <div className="h-1 w-20 bg-slate-50 rounded-full"></div>
                      </div>
                      <div
                        className="h-6 w-16 rounded-md opacity-20"
                        style={{ backgroundColor: themeColor }}
                      ></div>
                    </div>
                  </div>
                </div>

                <p className="text-center text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest">
                  Rendu en temps réel
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-premium relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <TrendingUp size={120} />
              </div>

              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 relative">
                État du Profil
              </h3>

              <div className="space-y-8 relative">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-sm font-black uppercase tracking-wider text-slate-300">
                      Complétion
                    </span>
                    <span className="text-3xl font-black">{stats.completionRate}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                      style={{ width: `${stats.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Factures
                    </p>
                    <p className="text-xl font-black">{stats.totalInvoices}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Stockage
                    </p>
                    <p className="text-xl font-black">Local</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex items-center gap-3 text-emerald-400">
                  <CheckCircle2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Données Synchronisées
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default SettingsManager;
