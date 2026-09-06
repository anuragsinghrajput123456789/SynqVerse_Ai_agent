import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title = 'Unable to load operational data.',
  message = 'A temporary connection error occurred while retrieving live metrics.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center space-y-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl backdrop-blur-xl ${className}`}>
      <div className="w-11 h-11 rounded-full bg-rose-900/50 flex items-center justify-center text-rose-400 shadow-inner">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
        <p className="text-xs text-rose-200/80 mt-1 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <div className="pt-1">
          <Button variant="secondary" size="sm" onClick={onRetry} icon={<RotateCcw className="w-3.5 h-3.5" />}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
