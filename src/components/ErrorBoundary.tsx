import * as React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorDetails = null;
      try {
        // Check if it's a JSON string from our Firestore error handler
        if (this.state.error?.message.startsWith('{')) {
          errorDetails = JSON.parse(this.state.error.message);
        }
      } catch (e) {
        // Not a JSON string
      }

      return (
        <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-brand-gray border border-brand-gray-light rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-brand-text mb-2">Ops! Algo deu errado</h1>
            <p className="text-brand-text-muted mb-6">
              Ocorreu um erro inesperado. Nossa equipe técnica já foi notificada.
            </p>

            {errorDetails ? (
              <div className="bg-black/40 rounded-lg p-4 mb-6 text-left overflow-auto max-h-48">
                <p className="text-xs font-mono text-red-400 mb-2">Erro de Permissão Firestore:</p>
                <pre className="text-[10px] font-mono text-brand-text-muted whitespace-pre-wrap">
                  {JSON.stringify(errorDetails, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-black/40 rounded-lg p-4 mb-6 text-left overflow-auto max-h-48">
                <p className="text-xs font-mono text-red-400 mb-2">Detalhes do Erro:</p>
                <p className="text-[10px] font-mono text-brand-text-muted break-words">
                  {this.state.error?.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-dark text-brand-black font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
