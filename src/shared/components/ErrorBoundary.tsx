import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createLogger } from '@/core/logging/Logger';
import { ErrorHandler } from '@/core/errors/ErrorHandler';
import { AlertTriangle, RefreshCcw, FileText } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  componentName?: string;
  portalId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorDetails: any | null;
}

const logger = createLogger('ErrorBoundary');

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorDetails: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorDetails: null };
  }

  public handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorDetails: null
    });
  };

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const contextName = this.props.portalId || this.props.componentName || 'UnknownComponent';
    
    // Convert to structured AppError
    const structuredError = ErrorHandler.handle(error);
    
    // Log the error centrally
    logger.fatal(`Uncaught React rendering error in ${contextName}`, structuredError, { 
      componentStack: errorInfo.componentStack 
    });

    this.setState({
      error: structuredError,
      errorDetails: errorInfo.componentStack
    });
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return <>{this.props.fallback(this.state.error || new Error('Unknown Error'), this.handleReset)}</>;
        }
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="min-h-full w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#050505]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <GlassCard className="max-w-2xl w-full border-rose-500/30 relative z-10 flex flex-col items-center text-center p-8 lg:p-12 shadow-2xl">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-3">System Malfunction Detected</h1>
            
            <p className="text-slate-300 mb-8 max-w-lg leading-relaxed">
              A critical rendering fault occurred within the <strong className="text-white">{this.props.portalId || this.props.componentName || 'Subsystem'}</strong> module. The error signature has been logged for engineering review.
            </p>

            <div className="w-full bg-[#0a0a0f]/50 rounded-xl p-5 mb-8 border border-rose-500/20 overflow-x-auto text-left backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3 text-rose-400 font-semibold border-b border-rose-500/20 pb-2">
                <FileText className="w-4 h-4" />
                <span>Error Diagnostics</span>
              </div>
              <code className="text-sm text-rose-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                {this.state.error?.message || 'Unknown Exception Sequence'}
              </code>
              {this.state.errorDetails && (
                <details className="mt-4">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">View Stack Trace</summary>
                  <pre className="mt-2 text-[10px] text-slate-600 font-mono whitespace-pre-wrap">
                    {this.state.errorDetails}
                  </pre>
                </details>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="titan-button titan-button-primary w-full max-w-xs shadow-lg shadow-blue-500/20"
            >
              <RefreshCcw className="w-4 h-4" /> Reboot Subsystem
            </button>
          </GlassCard>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
