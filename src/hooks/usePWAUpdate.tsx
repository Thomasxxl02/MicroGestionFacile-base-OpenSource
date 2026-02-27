import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

/**
 * Hook pour gérer les mises à jour PWA avec notifications utilisateur
 *
 * Détecte quand une nouvelle version du Service Worker est prête
 * et affiche un toast notifications invitant l'utilisateur à mettre à jour
 *
 * @example
 * ```tsx
 * // Dans App.tsx
 * usePWAUpdate();
 * ```
 */
export const usePWAUpdate = () => {
  const updatePromptShown = useRef(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Afficher la notification de mise à jour disponible
  const showUpdatePrompt = useCallback(() => {
    if (updatePromptShown.current) return;
    updatePromptShown.current = true;

    toast(
      <div className="flex items-center gap-3 w-full">
        <RefreshCw className="h-5 w-5 shrink-0 animate-spin" />
        <div className="flex-1">
          <p className="font-semibold">Mise à jour disponible</p>
          <p className="text-sm opacity-90">Une nouvelle version est prête à être installée</p>
        </div>
        <button
          onClick={() => {
            // Notifier le Service Worker de passer en mode waiting
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'SKIP_WAITING',
              });
            }
            // Recharger la page pour appliquer la mise à jour
            window.location.reload();
          }}
          className="px-4 py-2 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition-colors shrink-0 whitespace-nowrap"
        >
          Mettre à jour
        </button>
      </div>,
      {
        duration: Infinity, // Reste visible jusqu'à action utilisateur
        position: 'top-center',
      }
    );
  }, []);

  // Vérifier les mises à jour disponibles
  const checkForUpdates = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.info('[PWA] Service Worker not yet registered');
        return;
      }

      registrationRef.current = registration;

      // Demander au Service Worker de vérifier les mises à jour
      await registration.update();
      console.info('[PWA] Checked for Service Worker updates');
    } catch (error) {
      console.error('[PWA] Erreur lors de la vérification des mises à jour:', error);
    }
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.info('[PWA] Service Workers non supportés');
      return;
    }

    // Listener pour détecter quand le Service Worker change (mise à jour appliquée)
    const handleControllerChange = () => {
      if (updatePromptShown.current) {
        toast.success('✅ Application mise à jour avec succès', {
          duration: 4000,
          position: 'top-center',
        });
        updatePromptShown.current = false; // Reset pour les futures mises à jour
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Vérifier les mises à jour au démarrage
    void checkForUpdates();

    // Revérifier toutes les 60 minutes
    const interval = setInterval(
      () => {
        void checkForUpdates();
      },
      60 * 60 * 1000
    );

    // Configurer le listener pour detect updatefound
    const setupUpdateListener = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        const handleUpdateFound = () => {
          console.info('[PWA] Nouvelle version détectée');
          const newWorker = registration.installing;
          if (!newWorker) return;

          const handleStateChange = () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('[PWA] Nouvelle version prête');
              showUpdatePrompt();
            }
          };

          newWorker.addEventListener('statechange', handleStateChange);
        };

        registration.addEventListener('updatefound', handleUpdateFound);

        // Retourner une fonction de cleanup
        return () => {
          registration.removeEventListener('updatefound', handleUpdateFound);
        };
      } catch (error) {
        console.error('[PWA] Erreur setup updatefound:', error);
        return () => {};
      }
    };

    // Exécuter la setup et récupérer le cleanup
    let cleanupUpdateListener: (() => void) | null | undefined = null;
    void setupUpdateListener().then((cleanup) => {
      cleanupUpdateListener = cleanup ?? null;
    });

    // Cleanup principal
    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);

      // Cleanup du listener updatefound s'il existe
      if (cleanupUpdateListener) {
        cleanupUpdateListener();
      }
    };
  }, [checkForUpdates, showUpdatePrompt]);
};
