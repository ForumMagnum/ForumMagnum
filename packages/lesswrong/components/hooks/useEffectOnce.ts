import { useEffect } from 'react';

/**
 * Like useEffect, but it runs exactly once (never rerunning even if dependencies change)
 */
export const useEffectOnce = (fn: () => void) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fn, []);
}
