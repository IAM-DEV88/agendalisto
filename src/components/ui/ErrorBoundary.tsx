import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Error capturado:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'Ocurrió un error inesperado';

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-200">
          <div className="max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center ring-1 ring-red-200 dark:ring-red-800">
              <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
            </div>

            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
              Algo salió mal
            </h1>

            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
              Se produjo un error inesperado en esta sección. Por favor, intenta de nuevo.
            </p>

            <p className="text-xs text-gray-400 dark:text-gray-500 mb-8 font-mono bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 truncate max-w-full">
              {errorMessage}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>

              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <Home className="w-4 h-4" />
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
