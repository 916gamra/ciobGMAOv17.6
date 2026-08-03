import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AppError } from '@/core/errors/AppError';

interface FormProps {
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  onError?: (error: Error) => void;
}

export const Form = ({ onSubmit, children, className = '', onError }: FormProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);
      
      await onSubmit(data);
    } catch (err: any) {
      const message = err instanceof AppError ? err.message : (err.message || 'An unexpected error occurred during submission.');
      setError(message);
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-md p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-rose-500">Submission Error</h4>
            <p className="text-sm text-rose-400/90 mt-1">{error}</p>
          </div>
        </div>
      )}
      {children}
    </form>
  );
};
