import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Like useState<boolean>, but debounces transitions to `false` by `delayMs`.
 * Transitions to `true` are instant and cancel any pending `false` timer.
 *
 * Used for connection indicators: the initial WebSocket handshake
 * (disconnected → connecting → connected) and brief reconnection blips
 * shouldn't flash a "disconnected" state.
 */
export function useDebouncedFalse(initialValue: boolean, delayMs: number): [boolean, (value: boolean) => void] {
  const [value, setValueRaw] = useState(initialValue);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const setValue = useCallback((next: boolean) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (next) {
      setValueRaw(true);
    } else {
      timerRef.current = setTimeout(() => {
        setValueRaw(false);
      }, delayMs);
    }
  }, [delayMs]);
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  return [value, setValue];
}
