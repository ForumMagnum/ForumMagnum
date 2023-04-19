import { useCookies } from "react-cookie";
import { CookieSetOptions } from "universal-cookie/cjs/types";
import { isCookieAllowed } from "../../lib/cookies/utils";
import { useCallback } from "react";

export function useCookiesWithConsent(dependencies?: string[]): [
  {
    [name: string]: any;
  },
  (name: string, value: any, options?: CookieSetOptions) => void,
  (name: string, options?: CookieSetOptions) => void
] {
  const [cookies, setCookieBase, removeCookieBase] = useCookies(dependencies);

  const setCookie = useCallback((name: string, value: string, options?: CookieSetOptions) => {
    if (!isCookieAllowed(name)) {
      // eslint-disable-next-line no-console
      console.warn(`Consent has not been granted for cookie "${name}" to be set`)
      return
    };

    setCookieBase(name, value, options);
  }, [setCookieBase]);

  return [cookies, setCookie, removeCookieBase];
}
