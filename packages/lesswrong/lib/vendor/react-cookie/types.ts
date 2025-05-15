import Cookies, { Cookie } from 'universal-cookie';

export type ReactCookieProps = {
  cookies?: Cookies;
  allCookies?: { [name: string]: Cookie };
  children?: any;
  ref?: React.RefObject<{}>;
};
