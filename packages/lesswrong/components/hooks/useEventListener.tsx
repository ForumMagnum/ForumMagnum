import { useEffect, useRef } from 'react';
import { isClient } from '../../lib/executionEnvironment';

export function useEventListener<K extends keyof WindowEventMap, H extends (ev: WindowEventMap[K]) => any>(eventName: K, handler: H){
  // Create a ref that stores handler
  const savedHandler = useRef<H | null>(null);

  // Update ref.current value if handler changes.
  // This allows our effect below to always get latest handler ...
  // ... without us needing to pass it in effect deps array ...
  // ... and potentially cause effect to re-run every render.
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(
    () => {
      if (isClient) {

        // eslint-disable-next-line no-console
        if (!window.addEventListener) console.log("Error: eventListener not available");

        // Create event listener that calls handler function stored in ref
        const eventListener = (event: WindowEventMap[K]) => savedHandler.current?.(event);

        // Add event listener
        window.addEventListener(eventName, eventListener);

        // Remove event listener on cleanup
        return () => {
          window.removeEventListener(eventName, eventListener);
        };
      }
    },
    [eventName] // Re-run if eventName or element changes
  );
}
