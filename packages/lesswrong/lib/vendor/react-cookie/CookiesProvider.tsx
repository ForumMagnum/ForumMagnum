'use client';

import * as React from 'react';
import Cookies, { Cookie } from 'universal-cookie';
import { ReactCookieProps } from './types';

import { Provider } from './CookiesContext';

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

export default CookiesProvider;
