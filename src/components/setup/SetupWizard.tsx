import React, { useState } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Percent,
} from 'lucide-react';
import { UserProfile, UserProfileSchema } from '../../types/user.types';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface SetupWizardProps {
  onComplete: (data: UserProfile) => void;
  initialData: UserProfile;
}

const steps = [
  { id: 'welcome', title: 'Bienvenue', icon: Sparkles },
  { id: 'identity', title: 'Entreprise', icon: Building },
  { id: 'location', title: 'Adresse', icon: MapPin },
  { id: 'fiscal', title: 'Fiscalité', icon: Percent },
  { id: 'review', title: 'Finalisation', icon: CheckCircle2 },
];

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, initialData }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const methods = useForm<UserProfile>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(UserProfileSchema) as any,
    defaultValues: {
      ...initialData,
      isConfigured: false,
    },
    mode: 'onChange',
  });

  const { handleSubmit, trigger, control } = methods;

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isStepValid = await trigger(fieldsToValidate as any);

    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const getFieldsForStep = (stepIndex: number): string[] => {
    switch (stepIndex) {
      case 1:
        return ['companyName', 'siret'];
      case 2:
        return ['address'];
      case 3:
        return ['isVatExempt', 'activityType'];
      default:
        return [];
    }
  };

  const onSubmit = (data: UserProfile) => {
    onComplete({ ...data, isConfigured: true });
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const companyName = useWatch({ control, name: 'companyName' });
  const isVatExempt = useWatch({ control, name: 'isVatExempt' });

  return (
    <div
      data-testid="setup-wizard"
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8 px-4">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStep;
              return (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-white text-slate-300 border-2 border-slate-100'
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    className={`text-[10px] mt-2 font-black uppercase tracking-widest ${
                      isActive ? 'text-primary' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="relative h-1 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <FormProvider {...methods}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <form onSubmit={handleSubmit(onSubmit as any)}>
            <AnimatePresence mode="wait" custom={currentStep}>
              <motion.div
                key={currentStep}
                custom={currentStep}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
              >
                <Card className="shadow-premium-xl border-none">
                  {currentStep === 0 && (
                    <div className="text-center py-6">
                      <div className="w-24 h-24 bg-white shadow-premium-xl rounded-[2rem] flex items-center justify-center mx-auto mb-8 p-5 border border-slate-100">
                        <img
                          src="/logo.svg"
                          alt="Micro Gestion Facile Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">
                        Micro Gestion Facile
                      </h1>
                      <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto font-medium">
                        Configurons ensemble votre espace de travail pour que vous puissiez
                        commencer à gérer votre activité sereinement.
                      </p>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl">
                          <Building size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">
                          Identité de l&apos;entreprise
                        </h2>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Nom Commercial
                          </label>
                          <input
                            {...methods.register('companyName')}
                            placeholder="Ex: Jean Dupont Consulting"
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                          />
                          {methods.formState.errors.companyName && (
                            <p className="text-red-500 text-xs font-bold">
                              {methods.formState.errors.companyName.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Numéro SIRET
                          </label>
                          <input
                            {...methods.register('siret')}
                            placeholder="14 chiffres (ex: 123 456 789 00012)"
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                          />
                          {methods.formState.errors.siret && (
                            <p className="text-red-500 text-xs font-bold">
                              {methods.formState.errors.siret.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl">
                          <MapPin size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">Où êtes-vous situé ?</h2>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                          Adresse complète
                        </label>
                        <textarea
                          {...methods.register('address')}
                          placeholder="Numéro, rue, code postal, ville"
                          rows={3}
                          className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 resize-none"
                        />
                        {methods.formState.errors.address && (
                          <p className="text-red-500 text-xs font-bold">
                            {methods.formState.errors.address.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl">
                          <Percent size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">Fiscalité & TVA</h2>
                      </div>

                      <div className="space-y-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-primary/20 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-slate-900">Franchise en base de TVA</h3>
                            <input
                              type="checkbox"
                              {...methods.register('isVatExempt')}
                              className="w-6 h-6 rounded-lg text-primary focus:ring-primary border-slate-300"
                            />
                          </div>
                          <p className="text-sm text-slate-500 font-medium">
                            Cochez cette case si vous bénéficiez de la franchise en base de TVA (pas
                            de TVA collectée, mention &quot;TVA non applicable&quot; sur les
                            factures).
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Type d&apos;activité principal
                          </label>
                          <select
                            {...methods.register('activityType')}
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 appearance-none"
                          >
                            <option value="services">Prestation de services</option>
                            <option value="sales">Vente de marchandises</option>
                            <option value="mixed">Activité mixte</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div className="text-center py-4">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">Tout est prêt !</h2>
                        <p className="text-slate-500 font-medium mt-2">
                          Vérifiez vos informations avant de commencer.
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                        <div className="flex justify-between border-b border-slate-200 pb-3">
                          <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">
                            Entreprise
                          </span>
                          <span className="text-slate-900 font-bold">{companyName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-3">
                          <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">
                            Régime TVA
                          </span>
                          <span className="text-slate-900 font-bold">
                            {isVatExempt ? 'Franchise (Exonéré)' : 'Assujetti à la TVA'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center font-medium">
                          Vous pourrez modifier ces informations à tout moment dans les paramètres.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between gap-4 mt-10">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={prevStep}
                      className={currentStep === 0 ? 'invisible' : ''}
                      icon={ArrowLeft}
                    >
                      Retour
                    </Button>

                    {currentStep === steps.length - 1 ? (
                      <Button type="submit" variant="gradient" className="px-8">
                        C&apos;est parti !
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={nextStep}
                        icon={ArrowRight}
                        className="flex-row-reverse gap-3 px-8"
                      >
                        Continuer
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default SetupWizard;
