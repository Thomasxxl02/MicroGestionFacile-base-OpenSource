import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { UserProfile } from './types';
import { Menu, Loader2 } from 'lucide-react';
import { db } from './services/db';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { backupService } from './services/backupService';
import { useUIStore } from './store';
import { useUserProfile } from './hooks/useData';

// Lazy loading managers for better performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const InvoiceManager = lazy(() => import('./components/InvoiceManager'));
const ClientManager = lazy(() => import('./components/ClientManager'));
const SupplierManager = lazy(() => import('./components/SupplierManager'));
const ProductManager = lazy(() => import('./components/ProductManager'));
const AccountingManager = lazy(() => import('./components/AccountingManager'));
const SettingsManager = lazy(() => import('./components/SettingsManager'));
const AIAssistant = lazy(() => import('./components/AIAssistant'));
const SetupWizard = lazy(() => import('./components/setup/SetupWizard'));

const LoadingFallback = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <div className="flex flex-col items-center gap-2 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p>Chargement...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const location = useLocation();
  const { setMobileMenuOpen, isDarkMode } = useUIStore();
  const { profile: userProfile, isLoading: isProfileLoading } = useUserProfile();

  // --- MIGRATION & INITIALIZATION ---
  useEffect(() => {
    const migrate = async () => {
      // Check if migration is needed
      const hasInvoices = await db.invoices.count();
      if (hasInvoices === 0) {
        const localInvoices = localStorage.getItem('autogest_invoices');
        if (localInvoices) await db.invoices.bulkAdd(JSON.parse(localInvoices));

        const localClients = localStorage.getItem('autogest_clients');
        if (localClients) await db.clients.bulkAdd(JSON.parse(localClients));

        const localSuppliers = localStorage.getItem('autogest_suppliers');
        if (localSuppliers) await db.suppliers.bulkAdd(JSON.parse(localSuppliers));

        const localProducts = localStorage.getItem('autogest_products');
        if (localProducts) await db.products.bulkAdd(JSON.parse(localProducts));

        const localExpenses = localStorage.getItem('autogest_expenses');
        if (localExpenses) await db.expenses.bulkAdd(JSON.parse(localExpenses));

        const localProfile = localStorage.getItem('autogest_profile');
        if (localProfile) {
          await db.userProfile.put({ ...JSON.parse(localProfile), id: 'current' });
        }

        console.error('Migration from localStorage to IndexedDB complete.');
        toast.success('Données migrées avec succès vers IndexedDB');
      }

      // Initialize automatic backup service
      backupService.initialize();
    };
    void migrate();
  }, []);

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <LoadingFallback />
      </div>
    );
  }

  const setUserProfile = async (p: UserProfile) => {
    await db.userProfile.put({ ...p, id: 'current' });
  };

  if (!userProfile.isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Suspense fallback={<LoadingFallback />}>
          <SetupWizard initialData={userProfile} onComplete={setUserProfile} />
        </Suspense>
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 transition-colors duration-300 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse-soft"></div>
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse-soft"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      <Sidebar userProfile={userProfile} />

      <main className="flex-1 lg:ml-72 p-6 lg:p-12 xl:p-20 overflow-x-hidden relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center mb-12 sticky top-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl z-30 py-6 border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-premium">
              <span className="font-black text-xs uppercase tracking-tighter">MG</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 leading-none">MICRO GESTION</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-soft border-2 border-slate-100 text-slate-900 active:scale-90 transition-all"
          >
            <Menu size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname.split('/')[1]}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/invoices/*" element={<InvoiceManager />} />
                  <Route path="/clients/*" element={<ClientManager />} />
                  <Route path="/suppliers" element={<SupplierManager />} />
                  <Route path="/products" element={<ProductManager />} />
                  <Route path="/accounting" element={<AccountingManager />} />
                  <Route path="/ai" element={<AIAssistant />} />
                  <Route path="/settings" element={<SettingsManager />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>
      <Toaster position="top-right" richColors closeButton theme={isDarkMode ? 'dark' : 'light'} />
    </div>
  );
};

export default App;
