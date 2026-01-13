/**
 * Audit Logger - Tracks user actions and system events for observability
 * 
 * Stores events in localStorage for persistence. In production, this could
 * be extended to send to a server or analytics service.
 */

export type AuditEventType = 
  | 'click' 
  | 'submit' 
  | 'navigate' 
  | 'api_call' 
  | 'error'
  | 'state_change'
  | 'filter_change';

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: AuditEventType;
  component: string;
  action: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  success?: boolean;
  error?: string;
}

const STORAGE_KEY = 'maos_audit_log_v1';
const MAX_EVENTS = 1000; // Keep last 1000 events

/**
 * Generate a unique ID for an event
 */
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all audit events from storage
 */
function getEvents(): AuditEvent[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as AuditEvent[];
  } catch (error) {
    console.error('Failed to read audit log:', error);
    return [];
  }
}

/**
 * Save events to storage, keeping only the most recent MAX_EVENTS
 */
function saveEvents(events: AuditEvent[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // Keep only the most recent events
    const recent = events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch (error) {
    console.error('Failed to save audit log:', error);
  }
}

/**
 * Log an audit event
 */
export function logEvent(
  type: AuditEventType,
  component: string,
  action: string,
  metadata?: Record<string, unknown>,
  success?: boolean,
  error?: string
): void {
  const event: AuditEvent = {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    type,
    component,
    action,
    metadata,
    success,
    error,
  };

  const events = getEvents();
  events.push(event);
  saveEvents(events);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Audit]', event);
  }
}

/**
 * Get recent events (last N events)
 */
export function getRecentEvents(limit: number = 50): AuditEvent[] {
  const events = getEvents();
  return events.slice(-limit).reverse(); // Most recent first
}

/**
 * Clear all audit events
 */
export function clearAuditLog(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear audit log:', error);
  }
}

/**
 * Get events filtered by type
 */
export function getEventsByType(type: AuditEventType, limit?: number): AuditEvent[] {
  const events = getEvents();
  const filtered = events.filter(e => e.type === type);
  const sorted = filtered.slice(-(limit || filtered.length)).reverse();
  return sorted;
}

/**
 * Get events for a specific component
 */
export function getEventsByComponent(component: string, limit?: number): AuditEvent[] {
  const events = getEvents();
  const filtered = events.filter(e => e.component === component);
  const sorted = filtered.slice(-(limit || filtered.length)).reverse();
  return sorted;
}
