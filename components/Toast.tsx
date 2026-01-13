/**
 * Simple Toast Notification Component
 * Provides success/error feedback for user actions
 */

"use client";

import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);

    // Auto-dismiss after duration
    const duration = toast.duration ?? 3000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(toast.id), 300); // Wait for fade-out
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm
        ${colors[toast.type]}
        transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="p-1 hover:opacity-70 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Listen for toast events
    const handleToast = (event: CustomEvent<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        id: `${Date.now()}-${Math.random()}`,
        ...event.detail,
      };
      setToasts((prev) => [...prev, toast]);
    };

    window.addEventListener('show-toast', handleToast as EventListener);
    return () => window.removeEventListener('show-toast', handleToast as EventListener);
  }, []);

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}

/**
 * Show a toast notification
 */
export function showToast(message: string, type: ToastType = 'info', duration?: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  const event = new CustomEvent('show-toast', {
    detail: { message, type, duration },
  });
  window.dispatchEvent(event);
}
