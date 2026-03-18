'use client';

import * as React from 'react';
import Cookies, { Cookie } from 'universal-cookie';
import { ReactCookieProps } from './types';

import { Provider } from './CookiesContext';
import { isServer } from '@/lib/executionEnvironment';
import { use } from 'react';

const initialBrowserCookies: Record<string, Cookie> | null = typeof document === 'undefined'
  ? null
  : new Cookies(document.cookie).getAll();

const CookiesProvider: React.FC<ReactCookieProps> = (props) => {
  const cookies = React.useMemo(() => {
    if (props.cookies) {
      return props.cookies;
    } else {
      return new Cookies(undefined);
    }
  }, [props.cookies]);

  const initialCookiesRef = React.useRef<Record<string, Cookie> | null>(null);
  if (!initialCookiesRef.current) {
    initialCookiesRef.current = props.allCookies ?? initialBrowserCookies ?? cookies.getAll();
  }

  const store = React.useMemo(() => ({
    cookies,
    initialCookies: initialCookiesRef.current ?? {},
  }), [cookies]);

  return <Provider value={store}>{props.children}</Provider>;
};

const useGetUniversalCookies = () => {
  if (isServer) {
    const { cookies } = use(import('next/headers'));
    const serverCookies = use(cookies());
    const parsedCookies = serverCookies.getAll();
    return new Cookies(Object.fromEntries(parsedCookies.map((cookie) => [cookie.name, cookie.value])));
  } else {
    const browserCookies = document.cookie;
    return new Cookies(browserCookies);
  }
}

export default CookiesProvider;
