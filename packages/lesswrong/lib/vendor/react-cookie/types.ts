import Cookies, { Cookie, CookieSetOptions } from 'universal-cookie';

export type ReactCookieProps = {
  cookies?: Cookies;
  defaultSetOptions?: CookieSetOptions;
  allCookies?: { [name: string]: Cookie };
  children?: any;
  ref?: React.RefObject<{}>;
};
