import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { logger } from '../services/loggerService';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorCount: 1 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('React Error Boundary Caught', error, {
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    this.setState((prev) => ({
      errorCount: prev.errorCount + 1,
    }));
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorCount: 0 });
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 dark:from-slate-900 dark:to-red-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">
              Oups ! Une erreur s&apos;est produite
            </h1>
            <p className="text-center text-slate-600 dark:text-slate-300 mb-4">
              L&apos;application a rencontré un problème inattendu. Les données sont sécurisées
              localement.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 rounded text-xs font-mono text-red-800 dark:text-red-200 max-h-32 overflow-auto">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Recharger l&apos;application
            </button>

            {this.state.errorCount > 3 && (
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3">
                Erreur répétitives détectées. Essayez de vider le cache du navigateur.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
