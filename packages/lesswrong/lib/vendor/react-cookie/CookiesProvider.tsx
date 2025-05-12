import * as React from 'react';
import Cookies from 'universal-cookie';
import { ReactCookieProps } from './types';

import { Provider } from './CookiesContext';

const CookiesProvider: React.FC<ReactCookieProps> = (props) => {
  const cookies = React.useMemo(() => {
    if (props.cookies) {
      return props.cookies;
    } else {
      return new Cookies(undefined);
    }
  }, [props.cookies]);

  return <Provider value={cookies}>{props.children}</Provider>;
};

export default CookiesProvider;
