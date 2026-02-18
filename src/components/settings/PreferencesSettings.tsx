import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Settings, Globe, Coins } from 'lucide-react';
import { UserProfile } from '../../types';
import AISettings from './AISettings';

const PreferencesSettings: React.FC = () => {
  const { register } = useFormContext<UserProfile>();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Préférences générales */}
      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500">
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-premium">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Préférences Générales
            </h2>
            <p className="text-slate-500 font-medium">Langue et devise par défaut</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Langue par défaut
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                <Globe size={18} />
              </div>
              <select
                {...register('defaultLanguage')}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
              >
                <option value="fr">Français (France)</option>
                <option value="en">English (UK/International)</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-400 font-medium ml-1">
              Affecte la langue des documents et de l&apos;interface.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Devise par défaut
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                <Coins size={18} />
              </div>
              <select
                {...register('defaultCurrency')}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
              >
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
                <option value="GBP">Livre Sterling (£)</option>
                <option value="CHF">Franc Suisse (CHF)</option>
                <option value="CAD">Dollar Canadien ($)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section IA & Assistants */}
      <AISettings />
    </div>
  );
};

export default PreferencesSettings;
