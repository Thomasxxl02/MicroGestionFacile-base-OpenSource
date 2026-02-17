import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { UserProfile } from '../types';

export const useInvoices = () => useLiveQuery(() => db.invoices.toArray()) || [];
export const useClients = () => useLiveQuery(() => db.clients.toArray()) || [];
export const useSuppliers = () => useLiveQuery(() => db.suppliers.toArray()) || [];
export const useProducts = () => useLiveQuery(() => db.products.toArray()) || [];
export const useExpenses = () => useLiveQuery(() => db.expenses.toArray()) || [];
export const useUserProfile = () => {
  const profile = useLiveQuery(() => db.userProfile.get('current'));

  const defaultProfile: UserProfile = {
    companyName: 'Ma Micro-Entreprise',
    siret: '123 456 789 00012',
    address: '123 Avenue de la République, 75001 Paris',
    email: 'contact@mon-entreprise.fr',
    phone: '01 02 03 04 05',
    bankAccount: 'FR76 1234 5678 9012 3456 7890 123',
    activityType: 'services',
    isVatExempt: true,
    hasAccre: false,
    hasVersementLiberatoire: false,
    contributionQuarter: 'monthly',
    isConfigured: false,
    backupFrequency: 'none',
    defaultCurrency: 'EUR',
  };

  return {
    profile: profile || defaultProfile,
    isLoading: profile === undefined,
  };
};
