import { useContext, useLayoutEffect, useState, useRef, useMemo } from 'react';
import { Cookie, CookieSetOptions, CookieGetOptions } from 'universal-cookie';
import CookiesContext from './CookiesContext';
import { isInBrowser } from './utils';
import isEqual from 'lodash/isEqual';

export default function useCookies<T extends string, U = { [K in T]?: any }>(
  dependencies?: T[],
  options?: CookieGetOptions,
): [
  U,
  (name: T, value: Cookie, options?: CookieSetOptions) => void,
  (name: T, options?: CookieSetOptions) => void,
  () => void,
] {
  const cookies = useContext(CookiesContext);
  if (!cookies) {
    throw new Error('Missing <CookiesProvider>');
  }
  const defaultOptions = { doNotUpdate: true };

  const getOptions: CookieGetOptions = { ...defaultOptions, ...options };

  const [allCookies, setCookies] = useState(() => cookies.getAll(getOptions));

  if (isInBrowser()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      function onChange() {
        if (!cookies) {
          throw new Error('Missing <CookiesProvider>');
        }

        const newCookies = cookies.getAll(getOptions);

        if (shouldUpdate(dependencies || null, newCookies, allCookies)) {
          setCookies(newCookies);
        }
      }

      cookies.addChangeListener(onChange);

      return () => {
        cookies.removeChangeListener(onChange);
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cookies, allCookies]);
  }

  const setCookie = useMemo(() => cookies.set.bind(cookies), [cookies]);
  const removeCookie = useMemo(() => cookies.remove.bind(cookies), [cookies]);
  const updateCookies = useMemo(() => cookies.update.bind(cookies), [cookies]);

  return [allCookies, setCookie, removeCookie, updateCookies];
}

function shouldUpdate<U = { [K: string]: any }>(
  dependencies: Array<keyof U> | null,
  newCookies: U,
  oldCookies: U,
) {
  if (!dependencies) {
    return true;
  }

  for (let dependency of dependencies) {
    if (!isEqual(newCookies[dependency], oldCookies[dependency])) {
      return true;
    }
  }

  return false;
}
