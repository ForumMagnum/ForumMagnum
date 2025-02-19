import { useEffect, useRef } from 'react';
import { useStabilizedCallback } from './useDebouncedCallback';

/**
 * Define a function that runs when any of a list of dependencies has changed.
 * This is conceptually similar to useEffect, but it doesnt run on first mount,
 * only on subsequent renders after a change.
 */
export function useOnPropsChanged(fn: () => void, deps: any[]) {
  const hasMounted = useRef(false);
  const stabilizedFn = useStabilizedCallback(fn);

  useEffect(() => {
    if (hasMounted.current) {
      stabilizedFn({});
    } else {
      hasMounted.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
