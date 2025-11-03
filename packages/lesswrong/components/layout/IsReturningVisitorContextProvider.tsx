import React, { createContext, useEffect, useState } from 'react';
import moment from 'moment';
import { visitorGetsDynamicFrontpage } from '../../lib/betas';
import { LAST_VISITED_FRONTPAGE_COOKIE } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';

export const IsReturningVisitorContext = createContext(false);

export const IsReturningVisitorContextProvider = ({children}: {
  children: React.ReactNode
}) => {
  const [cookies, setCookie] = useCookiesWithConsent([LAST_VISITED_FRONTPAGE_COOKIE]);
  const [isReturningVisitor] = useState(() => !!cookies[LAST_VISITED_FRONTPAGE_COOKIE]);

  useEffect(() => {
    if (visitorGetsDynamicFrontpage(null)) {
      setCookie(LAST_VISITED_FRONTPAGE_COOKIE, new Date().toISOString(), { path: "/", expires: moment().add(1, 'year').toDate() });
    }
  }, [setCookie])

  return <IsReturningVisitorContext.Provider value={isReturningVisitor}>
    {children}
  </IsReturningVisitorContext.Provider>
}
