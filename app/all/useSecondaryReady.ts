import { useEffect, useState } from 'react';

// Flips to true on mount, so secondary background fetches only kick off
// after the initial render has flushed.
export function useSecondaryReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return ready;
}
