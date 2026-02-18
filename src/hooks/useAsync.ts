import { useCallback, useState } from 'react';
import { logger } from '../services/loggerService';
import { toast } from 'sonner';

interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Hook pour gérer les opérations asynchrones avec gestion d'erreurs centralisée
 * Inclut retry logic, logging, et feedback utilisateur
 */
export const useAsync = <T>(options: UseAsyncOptions<T> = {}) => {
  const { onSuccess, onError, showToast = true, retryCount = 0, retryDelay = 1000 } = options;

  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (asyncFn: () => Promise<T>, operationName: string): Promise<T | null> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          setState({ data: null, isLoading: true, error: null });

          const result = await asyncFn();

          setState({ data: result, isLoading: false, error: null });
          logger.info(`✅ ${operationName} réussi`);

          if (showToast) {
            toast.success(`${operationName} réussi`);
          }

          onSuccess?.(result);
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));

          if (attempt < retryCount) {
            logger.warn(
              `⚠️ ${operationName} échoué (tentative ${attempt + 1}/${retryCount}), nouvelle tentative dans ${retryDelay}ms`,
              { error: lastError.message }
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }

      // Toutes les tentatives échouées
      setState({ data: null, isLoading: false, error: lastError });
      logger.error(
        `❌ ${operationName} échoué après ${retryCount + 1} tentative(s)`,
        lastError || new Error('Unknown error'),
        {
          operationName,
        }
      );

      if (showToast) {
        toast.error(`Erreur : ${lastError?.message}`);
      }

      onError?.(lastError!);
      return null;
    },
    [onSuccess, onError, showToast, retryCount, retryDelay]
  );

  return { ...state, execute };
};
