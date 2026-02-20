'use client';

import { useCallback, useContext, useMemo, useRef, useSyncExternalStore } from 'react';
import { Cookie, CookieSetOptions, CookieGetOptions } from 'universal-cookie';
import CookiesContext from './CookiesContext';
import isEqual from 'lodash/isEqual';

export default function useCookies<T extends string, U extends Record<string, unknown> = { [K in T]?: any }>(
  dependencies?: T[],
  options?: CookieGetOptions,
): [
  U,
  (name: T, value: Cookie, options?: CookieSetOptions) => void,
  (name: T, options?: CookieSetOptions) => void,
] {
  const store = useContext(CookiesContext);
  if (!store) {
    throw new Error('Missing <CookiesProvider>');
  }

  const { cookies, initialCookies } = store;
  const defaultOptions = { doNotUpdate: true };
  const dependencySet = useMemo(() => dependencies ? new Set(dependencies) : null, [dependencies]);
  const getOptions = { ...defaultOptions, ...options };

  const getAllCookies = useCallback(
    () => cookies.getAll(getOptions) as U,
    [cookies, getOptions],
  );

  const initialSnapshotRef = useRef<U>(initialCookies as U);
  const previousCookiesRef = useRef<U>(initialSnapshotRef.current);
  const cachedSnapshotRef = useRef<U>(initialSnapshotRef.current);

  const getSnapshot = useCallback(() => {
    const nextCookies = getAllCookies();
    if (!shouldUpdate(dependencies || null, nextCookies, previousCookiesRef.current)) {
      return cachedSnapshotRef.current;
    }

    previousCookiesRef.current = nextCookies;
    cachedSnapshotRef.current = nextCookies;
    return nextCookies;
  }, [dependencies, getAllCookies]);

  const subscribe = useCallback((onStoreChange: () => void) => {
    const onChange = ({ name }: { name?: string }) => {
      if (!dependencySet || !name || dependencySet.has(name as T)) {
        onStoreChange();
      }
    };

    cookies.addChangeListener(onChange);
    return () => {
      cookies.removeChangeListener(onChange);
    };
  }, [cookies, dependencySet]);

  const allCookies = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => initialSnapshotRef.current,
  );
  const setCookie = useCallback(cookies.set.bind(cookies), [cookies]);
  const removeCookie = useCallback(cookies.remove.bind(cookies), [cookies]);

  return [allCookies, setCookie, removeCookie];
}

function shouldUpdate(
  dependencies: string[] | null,
  newCookies: Record<string, unknown>,
  oldCookies: Record<string, unknown>,
) {
  if (!dependencies) {
    return true;
  }

  for (const dependency of dependencies) {
    if (!isEqual(newCookies[dependency], oldCookies[dependency])) {
      return true;
    }
  }

  return false;
}
