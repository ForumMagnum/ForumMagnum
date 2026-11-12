import { useForumType } from '@/components/hooks/useForumType';
import React, { createContext, useEffect, useState } from 'react';
import moment from 'moment';
import { visitorGetsDynamicFrontpage } from '../../lib/betas';
import { LAST_VISITED_FRONTPAGE_COOKIE } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';

export const IsReturningVisitorContext = createContext(false);

export const IsReturningVisitorContextProvider = ({children}: {
  children: React.ReactNode
}) => {
  const { forumType } = useForumType();
  const [cookies, setCookie] = useCookiesWithConsent([LAST_VISITED_FRONTPAGE_COOKIE]);
  const [isReturningVisitor] = useState(() => !!cookies[LAST_VISITED_FRONTPAGE_COOKIE]);

  useEffect(() => {
    if (visitorGetsDynamicFrontpage(null, forumType)) {
      setCookie(LAST_VISITED_FRONTPAGE_COOKIE, new Date().toISOString(), { path: "/", expires: moment().add(1, 'year').toDate() });
    }
  }, [setCookie, forumType])

  return <IsReturningVisitorContext.Provider value={isReturningVisitor}>
    {children}
  </IsReturningVisitorContext.Provider>
}
