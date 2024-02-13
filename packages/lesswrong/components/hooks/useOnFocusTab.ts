import { useEffect } from 'react';

export function useOnFocusTab(fn: (ev: FocusEvent) => void) {
  useEffect(() => {
    window.addEventListener('focus', fn);
    return () => {
      window.removeEventListener('focus', fn);
    };
  }, [fn]);
}
