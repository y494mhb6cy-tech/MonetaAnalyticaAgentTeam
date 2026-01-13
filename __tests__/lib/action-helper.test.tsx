/**
 * Unit tests for action helper
 */

import { renderHook, act } from '@testing-library/react';
import { useAction } from '../../lib/action-helper';
import { logEvent } from '../../lib/audit-logger';

// Mock audit logger
jest.mock('../../lib/audit-logger', () => ({
  logEvent: jest.fn(),
}));

// Mock toast
jest.mock('../../components/Toast', () => ({
  showToast: jest.fn(),
}));

describe('useAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute async function successfully', async () => {
    const { result } = renderHook(() =>
      useAction({
        component: 'TestComponent',
        action: 'TestAction',
      })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);

    let executed = false;
    await act(async () => {
      const promise = result.current.execute(async () => {
        executed = true;
        return 'success';
      });
      expect(result.current.loading).toBe(true);
      await promise;
    });

    expect(executed).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(logEvent).toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() =>
      useAction({
        component: 'TestComponent',
        action: 'TestAction',
      })
    );

    await act(async () => {
      try {
        await result.current.execute(async () => {
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected to throw
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Test error');
  });

  it('should clear error', () => {
    const { result } = renderHook(() =>
      useAction({
        component: 'TestComponent',
        action: 'TestAction',
      })
    );

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should reset state', () => {
    const { result } = renderHook(() =>
      useAction({
        component: 'TestComponent',
        action: 'TestAction',
      })
    );

    act(() => {
      result.current.reset();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});
