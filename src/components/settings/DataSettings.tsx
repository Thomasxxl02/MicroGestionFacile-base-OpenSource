import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { exportDatabase, importDatabase, clearDatabase } from '../../services/db';
import { UserProfile } from '../../types';
import { toast } from 'sonner';

const DataSettings: React.FC = () => {
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const { register, watch } = useFormContext<UserProfile>();
  const lastAutoBackup = watch('lastAutoBackupDate');

  const handleExportData = async () => {
    try {
      const dataStr = await exportDatabase();
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `micro-gestion-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Données exportées avec succès');
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 5000);
    } catch (error) {
      toast.error("Erreur lors de l'export des données");
      console.error(error);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = event.target?.result as string;

        if (!confirm("⚠️ L'importation écrasera toutes vos données actuelles. Continuer ?")) {
          return;
        }

        await importDatabase(jsonData);
        toast.success('Données importées avec succès !');
        window.location.reload();
      } catch (error) {
        toast.error("Erreur lors de l'importation. Vérifiez le format du fichier.");
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (
      !confirm(
        '⚠️ ATTENTION : Cette action supprimera TOUTES vos données de manière irréversible. Continuer ?'
      )
    ) {
      return;
    }
    if (!confirm('Êtes-vous absolument certain ? Cette action ne peut pas être annulée !')) {
      return;
    }

    try {
      await clearDatabase();
      toast.success('Toutes les données ont été supprimées.');
      window.location.reload();
    } catch (error) {
      toast.error('Erreur lors de la suppression des données.');
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500">
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-emerald-500 text-white rounded-[1.5rem] shadow-premium">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Gestion des Données
            </h2>
            <p className="text-slate-500 font-medium">Sauvegarde, export et import local</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={handleExportData}
            className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] hover:border-slate-900 hover:bg-white transition-all group text-left"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white shadow-sm transition-all mb-6">
              <Download size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Exporter les données
            </h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Téléchargez une sauvegarde complète de vos données au format JSON.
            </p>
          </button>

          <label className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] hover:border-slate-900 hover:bg-white transition-all group text-left cursor-pointer">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white shadow-sm transition-all mb-6">
              <Upload size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Importer les données
            </h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Restaurez vos données à partir d'un fichier de sauvegarde JSON.
            </p>
            <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
          </label>
        </div>

        {showExportSuccess && (
          <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4 animate-in fade-in zoom-in">
            <div className="p-2 bg-emerald-500 text-white rounded-full">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-emerald-900 font-black uppercase tracking-tight">
                Export Réussi !
              </p>
              <p className="text-emerald-700 text-sm">
                Votre fichier de sauvegarde a été téléchargé.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-soft hover:shadow-premium transition-all duration-500">
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-indigo-500 text-white rounded-[1.5rem] shadow-premium">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Sauvegardes Automatiques
            </h2>
            <p className="text-slate-500 font-medium">Sécurité et sérénité de vos données</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <p className="text-slate-600 font-bold text-sm leading-relaxed">
                Activez l'exportation automatique de vos données pour éviter toute perte
                accidentelle. Le système déclenchera un téléchargement de votre base de données à la
                fréquence choisie.
              </p>
              {lastAutoBackup && (
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest w-fit">
                  <CheckCircle2 size={12} />
                  Dernière sauvegarde : {new Date(lastAutoBackup).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="w-full md:w-64 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Fréquence
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                  <Calendar size={16} />
                </div>
                <select
                  {...register('backupFrequency')}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                >
                  <option value="none">Désactivé</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 rounded-[2.5rem] p-10 border-2 border-red-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.05] rotate-12 pointer-events-none">
          <Trash2 size={120} />
        </div>
        <div className="flex items-center gap-5 mb-6 relative">
          <div className="p-4 bg-red-600 text-white rounded-[1.5rem] shadow-premium shadow-red-200">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-red-900 uppercase tracking-tight">
              Zone de Danger
            </h2>
            <p className="text-red-700 font-medium">Actions irréversibles</p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-red-100 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-md">
              <h3 className="text-lg font-black text-red-900 uppercase tracking-tight leading-none mb-2">
                Réinitialisation Complète
              </h3>
              <p className="text-red-700/80 text-sm font-medium">
                Cette action effacera toutes les factures, clients, produits et paramètres. Nous
                vous conseillons de faire un export avant.
              </p>
            </div>
            <button
              onClick={handleResetData}
              className="px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-red-700 transition-all flex items-center gap-3 shadow-premium shadow-red-200"
            >
              <Trash2 size={18} />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSettings;
