import { useCookies } from "react-cookie";
import { CookieSetOptions } from "universal-cookie/cjs/types";
import { isCookieAllowed } from "../../lib/cookies/utils";

export function useCookiesWithConsent(dependencies?: string[]): [
  {
    [name: string]: any;
  },
  (name: string, value: any, options?: CookieSetOptions) => void,
  (name: string, options?: CookieSetOptions) => void
] {
  const [cookies, setCookieBase, removeCookieBase] = useCookies(dependencies);

  const setCookie = (name: string, value: string, options?: CookieSetOptions) => {
    if (!isCookieAllowed(name)) {
      // eslint-disable-next-line no-console
      console.warn(`Consent has not been granted for cookie "${name}" to be set`)
      return
    };

    setCookieBase(name, value, options);
  };

  return [cookies, setCookie, removeCookieBase];
}
