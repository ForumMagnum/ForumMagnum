import React, { useContext } from "react";

export const UserAgentContext = React.createContext<string>("Unknown");

/**
 * Returns the user-agent string of the client. Because of caching, users of
 * this hook should only do things with it if `userAgentIsSpecial` returns
 * true.
 */
export const useUserAgent = (): string => {
  return useContext(UserAgentContext);
}

/**
 * Returns whether the given user-agent string gets a different SSR in some way,
 * which means that some sorts of caching should be disabled.
 */
export const userAgentIsSpecial = (userAgent: string) => {
  // Skip the page-cache if the user-agent is Slackbot's link-preview fetcher
  // because we need to render that page with a different value for the
  // twitter:card meta tag (see also: HeadTags.tsx, Head.tsx).
  if (userAgent.startsWith("Slackbot-LinkExpanding")) {
    return true;
  }
}

