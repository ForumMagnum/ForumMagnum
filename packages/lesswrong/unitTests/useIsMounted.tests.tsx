/** @jest-environment jsdom */
import React from 'react';
import { renderHook } from '@testing-library/react';
import { useIsMounted } from '@/components/hooks/useIsMounted';

function StrictMode({ children }: React.PropsWithChildren) {
  return <React.StrictMode>{children}</React.StrictMode>;
}

it('survives StrictMode effect replay while keeping an old component unmounted after replacement', () => {
  const first = renderHook(useIsMounted, { wrapper: StrictMode });
  const firstIsMounted = first.result.current.getIsMounted;
  expect(firstIsMounted()).toBe(true);
  first.unmount();
  expect(firstIsMounted()).toBe(false);

  const replacement = renderHook(useIsMounted, { wrapper: StrictMode });
  expect(replacement.result.current.getIsMounted()).toBe(true);
  expect(firstIsMounted()).toBe(false);
  replacement.unmount();
});
