'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { AppProvider } from '../context/AppContext';

/**
 * Toast provider component that manages toast state
 */
function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, dismissToast } = useToast();

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

/**
 * Error fallback component for the Error Boundary
 */
function ErrorFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
      <div className="bg-[#1a1a2e] rounded-xl border border-red-500/30 p-8 max-w-lg w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-400 mb-4">
          The application encountered an unexpected error. Your data has been preserved.
        </p>
        <details className="text-left mb-4">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
            Error details
          </summary>
          <pre className="mt-2 p-3 bg-[#111] rounded text-xs text-red-400 overflow-auto max-h-32">
            {error.message}
          </pre>
        </details>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#111] hover:bg-[#222] text-gray-300 rounded-lg transition-colors border border-gray-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Client-side providers wrapper
 * Provides error boundary, app context, and toast notifications
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ErrorFallback error={error} onReset={reset} />
      )}
      onError={(error, errorInfo) => {
        // Log to console in development
        console.error('Application error:', error, errorInfo);
        // In production, you could send this to an error tracking service
      }}
    >
      <AppProvider>
        <ToastProvider>{children}</ToastProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
