/**
 * Action Helper - Consistent pattern for async operations with loading, error, and audit logging
 * 
 * Provides a React hook and utility functions for handling async actions with:
 * - Loading state management
 * - Error handling and reporting
 * - Success feedback
 * - Audit logging
 * - Retry-safe behavior
 */

"use client";

import { useState, useCallback, useRef } from 'react';
import { logEvent, type AuditEventType } from './audit-logger';
import { showToast } from '../components/Toast';

export interface ActionOptions {
  /** Component name for audit logging */
  component: string;
  /** Action name for audit logging */
  action: string;
  /** Show success message (default: true) */
  showSuccess?: boolean;
  /** Success message text */
  successMessage?: string;
  /** Show error message (default: true) */
  showError?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Custom success handler */
  onSuccess?: (result: unknown) => void;
  /** Audit event type (default: 'api_call') */
  auditType?: AuditEventType;
  /** Additional metadata for audit log */
  metadata?: Record<string, unknown>;
}

export interface UseActionReturn<T> {
  /** Execute the action */
  execute: (fn: () => Promise<T>) => Promise<T | undefined>;
  /** Current loading state */
  loading: boolean;
  /** Current error, if any */
  error: Error | null;
  /** Clear the error */
  clearError: () => void;
  /** Reset loading and error states */
  reset: () => void;
}

/**
 * React hook for handling async actions
 */
export function useAction<T = unknown>(options: ActionOptions): UseActionReturn<T> {
  const {
    component,
    action,
    showSuccess = true,
    successMessage,
    showError = true,
    onError,
    onSuccess,
    auditType = 'api_call',
    metadata = {},
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | undefined> => {
      // Cancel any previous operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setLoading(true);
      setError(null);

      // Log action start
      logEvent(auditType, component, action, { ...metadata, status: 'started' });

      try {
        const result = await fn();

        // Check if operation was aborted
        if (abortController.signal.aborted) {
          return undefined;
        }

        // Log success
        logEvent(auditType, component, action, { ...metadata, status: 'success' }, true);

        // Show success message
        if (showSuccess) {
          if (typeof window !== 'undefined') {
            showToast(successMessage || `${action} completed successfully`, 'success');
          }
        }

        // Call success handler
        if (onSuccess) {
          onSuccess(result);
        }

        setLoading(false);
        return result;
      } catch (err) {
        // Check if operation was aborted
        if (abortController.signal.aborted) {
          return undefined;
        }

        const error = err instanceof Error ? err : new Error(String(err));

        // Log error
        logEvent(
          auditType,
          component,
          action,
          { ...metadata, status: 'error', errorMessage: error.message },
          false,
          error.message
        );

        setError(error);
        setLoading(false);

        // Show error message
        if (showError) {
          if (typeof window !== 'undefined') {
            showToast(`${action} failed: ${error.message}`, 'error');
          }
        }

        // Call error handler
        if (onError) {
          onError(error);
        } else {
          // Default error handling - rethrow if no custom handler
          throw error;
        }

        return undefined;
      }
    },
    [component, action, showSuccess, successMessage, showError, onError, onSuccess, auditType, metadata]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { execute, loading, error, clearError, reset };
}

/**
 * Standalone function for executing actions outside React components
 */
export async function executeAction<T>(
  fn: () => Promise<T>,
  options: ActionOptions
): Promise<T | undefined> {
  const {
    component,
    action,
    showSuccess = true,
    successMessage,
    showError = true,
    onError,
    onSuccess,
    auditType = 'api_call',
    metadata = {},
  } = options;

  // Log action start
  logEvent(auditType, component, action, { ...metadata, status: 'started' });

  try {
    const result = await fn();

    // Log success
    logEvent(auditType, component, action, { ...metadata, status: 'success' }, true);

    // Show success message
    if (showSuccess && typeof window !== 'undefined') {
      showToast(successMessage || `${action} completed successfully`, 'success');
    }

    // Call success handler
    if (onSuccess) {
      onSuccess(result);
    }

    return result;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));

    // Log error
    logEvent(
      auditType,
      component,
      action,
      { ...metadata, status: 'error', errorMessage: error.message },
      false,
      error.message
    );

    // Show error message
    if (showError && typeof window !== 'undefined') {
      showToast(`${action} failed: ${error.message}`, 'error');
    }

    // Call error handler
    if (onError) {
      onError(error);
      return undefined;
    } else {
      throw error;
    }
  }
}

/**
 * Helper to log UI interactions (clicks, navigation, etc.)
 */
export function logInteraction(
  component: string,
  action: string,
  metadata?: Record<string, unknown>
): void {
  logEvent('click', component, action, metadata, true);
}

/**
 * Helper to log navigation events
 */
export function logNavigation(
  from: string,
  to: string,
  metadata?: Record<string, unknown>
): void {
  logEvent('navigate', 'Router', `Navigate: ${from} → ${to}`, { from, to, ...metadata }, true);
}
