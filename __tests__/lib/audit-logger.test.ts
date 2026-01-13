/**
 * Unit tests for audit logger
 */

import {
  logEvent,
  getRecentEvents,
  clearAuditLog,
  getEventsByType,
  getEventsByComponent,
} from '../../lib/audit-logger';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('audit-logger', () => {
  beforeEach(() => {
    clearAuditLog();
  });

  it('should log events', () => {
    logEvent('click', 'TestComponent', 'TestAction', { test: 'data' });

    const events = getRecentEvents(10);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('click');
    expect(events[0].component).toBe('TestComponent');
    expect(events[0].action).toBe('TestAction');
    expect(events[0].metadata?.test).toBe('data');
  });

  it('should get recent events', () => {
    logEvent('click', 'Component1', 'Action1');
    logEvent('click', 'Component2', 'Action2');
    logEvent('submit', 'Component3', 'Action3');

    const events = getRecentEvents(2);
    expect(events.length).toBe(2);
    expect(events[0].component).toBe('Component3'); // Most recent first
    expect(events[1].component).toBe('Component2');
  });

  it('should filter events by type', () => {
    logEvent('click', 'Component1', 'Action1');
    logEvent('submit', 'Component2', 'Action2');
    logEvent('click', 'Component3', 'Action3');

    const clickEvents = getEventsByType('click');
    expect(clickEvents.length).toBe(2);
    expect(clickEvents.every((e) => e.type === 'click')).toBe(true);
  });

  it('should filter events by component', () => {
    logEvent('click', 'Component1', 'Action1');
    logEvent('click', 'Component2', 'Action2');
    logEvent('click', 'Component1', 'Action3');

    const component1Events = getEventsByComponent('Component1');
    expect(component1Events.length).toBe(2);
    expect(component1Events.every((e) => e.component === 'Component1')).toBe(true);
  });

  it('should clear audit log', () => {
    logEvent('click', 'Component1', 'Action1');
    expect(getRecentEvents(10).length).toBe(1);

    clearAuditLog();
    expect(getRecentEvents(10).length).toBe(0);
  });

  it('should include success status', () => {
    logEvent('api_call', 'Component1', 'Action1', {}, true);
    const events = getRecentEvents(1);
    expect(events[0].success).toBe(true);
  });

  it('should include error information', () => {
    logEvent('error', 'Component1', 'Action1', {}, false, 'Test error');
    const events = getRecentEvents(1);
    expect(events[0].success).toBe(false);
    expect(events[0].error).toBe('Test error');
  });
});
