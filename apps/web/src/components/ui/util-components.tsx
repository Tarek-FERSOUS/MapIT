import React from 'react';

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className="h-8 w-8 animate-spin text-primary-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export function EmptyState({ 
  icon,
  title, 
  description, 
  action,
  className = ''
}: { 
  icon?: React.ReactNode;
  title: string; 
  description?: string; 
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      {icon && (
        <div className="mb-4 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export function ErrorAlert({ 
  title = 'Error', 
  message, 
  onDismiss,
  className = ''
}: { 
  title?: string; 
  message: string; 
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={`p-4 rounded-md bg-red-50 border border-red-200 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">{message}</div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 text-red-400 hover:text-red-500"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function Card({ 
  children, 
  className = '',
  onClick
}: { 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className={`rounded-lg border border-slate-200 bg-white shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
