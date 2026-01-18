'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface UseToastReturn {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

/**
 * Custom hook for managing toast notifications
 * Supports multiple simultaneous toasts with auto-dismiss
 */
export function useToast(defaultDuration = 4000): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    const refs = timeoutRefs.current;
    return () => {
      refs.forEach((timeout) => clearTimeout(timeout));
      refs.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    // Clear timeout if exists
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const finalDuration = duration ?? defaultDuration;

      const newToast: Toast = {
        id,
        message,
        type,
        duration: finalDuration,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after duration
      if (finalDuration > 0) {
        const timeout = setTimeout(() => {
          dismissToast(id);
        }, finalDuration);
        timeoutRefs.current.set(id, timeout);
      }

      return id;
    },
    [defaultDuration, dismissToast]
  );

  const clearAllToasts = useCallback(() => {
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current.clear();
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    dismissToast,
    clearAllToasts,
  };
}

// Convenience hooks for specific toast types
export function useSuccessToast(defaultDuration = 4000) {
  const { showToast, ...rest } = useToast(defaultDuration);
  return {
    ...rest,
    showSuccess: (message: string, duration?: number) => showToast(message, 'success', duration),
    showToast,
  };
}

export function useErrorToast(defaultDuration = 6000) {
  const { showToast, ...rest } = useToast(defaultDuration);
  return {
    ...rest,
    showError: (message: string, duration?: number) => showToast(message, 'error', duration),
    showToast,
  };
}

export default useToast;
