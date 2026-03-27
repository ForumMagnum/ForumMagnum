'use client';

import * as React from 'react';
import Cookies, { Cookie } from 'universal-cookie';

import { Provider } from './CookiesContext';
import { isServer } from '@/lib/executionEnvironment';
import { use } from 'react';

const CookiesProvider = ({ children }: { children: React.ReactNode }) => {
  const cookies = useGetUniversalCookies();
  const initialCookiesRef = React.useRef<Record<string, Cookie>>(cookies);

  const store = React.useMemo(() => ({
    cookies,
    initialCookies: initialCookiesRef.current ?? {},
  }), [cookies]);

  return <Provider value={store}>{children}</Provider>;
};

const useGetUniversalCookies = () => {
  if (isServer) {
    const { cookies } = use(import('next/headers'));
    const serverCookies = use(cookies());
    const parsedCookies = serverCookies.getAll();
    return new Cookies(Object.fromEntries(parsedCookies.map((cookie) => [cookie.name, cookie.value])));
  } else {
    return new Cookies(document.cookie);
  }
}

export default CookiesProvider;
