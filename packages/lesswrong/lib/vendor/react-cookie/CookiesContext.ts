import * as React from 'react';
import Cookies, { Cookie } from "universal-cookie";

export interface CookiesStore {
  cookies: Cookies;
  initialCookies: Record<string, Cookie>;
}

const CookiesContext = React.createContext<CookiesStore | null>(null);

export const { Provider, Consumer } = CookiesContext;
export default CookiesContext;
