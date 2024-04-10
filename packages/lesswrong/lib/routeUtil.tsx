import { isServer, getServerPort } from './executionEnvironment';
import qs from 'qs';
import React, { useCallback, useContext } from 'react';
import { LocationContext, ServerRequestStatusContext, SubscribeLocationContext, ServerRequestStatusContextType, NavigationContext } from './vulcan-core/appContext';
import type { RouterLocation } from './vulcan-lib/routes';
import * as _ from 'underscore';
import { ForumOptions, forumSelect } from './forumTypeUtils';
import type { LocationDescriptor } from 'history';
import {siteUrlSetting} from './instanceSettings'

// React Hook which returns the page location (parsed URL and route).
// Return value contains:
// {
//   currentRoute
//     The object that was passed to addRoute.
//   RouteComponent
//     The component used to render this route.
//   location
//     The react-router location. Inconsistent between client and SSR.
//   pathname
//     All of the URL after the domain. ie if the URL is
//     "http://lesswrong.com/foo?x=1&y=abc" then pathname is "/foo?x=1&y=abc". <-- this documentatino might be false! pathname does not return this, and oli says it shouldn't
//   hash
//     The within-page location part of a URL. Ie if the URL is
//     "http://lesswrong.com/foo#abc", the hash is "#abc".
//   params
//     Parsed components of the route path. Eg if the route path is
//     "/posts/:_id/:slug?" this might be {_id:"123", slug:"abc"}.
//   query
//     Parsed object for the portion of the URL after the ?, eg if the URL is
//     "http://lesswrong.com/foo?x=1&y=abc" this will be {x:"1",y:"abc"}. If
//     the URL does not contain a ?, this is the empty object.
// }
// Does not trigger rerenders on navigation events. If you want your component
// to rerender on navigations, use useSubscribedLocation instead.
export const useLocation = (): RouterLocation => {
  return useContext(LocationContext)!;
}

// React Hook which returns the server-side server request status, used to set 404s or redirects
// The relevant handling happens in the renderPage function
// This hook only works on the server and will throw an error when called on the client
export const useServerRequestStatus = (): ServerRequestStatusContextType|null => {
  return useContext(ServerRequestStatusContext)
}

// React Hook which returns the page location, formatted as in useLocation, and
// triggers a rerender whenever navigation occurs.
export const useSubscribedLocation = (): RouterLocation => {
  return useContext(SubscribeLocationContext)!;
}

export type NavigateFunction = ReturnType<typeof useNavigate>
/**
 * React Hook which returns an acessor-object for page navigation. Contains one
 * field, `history`. See https://github.com/ReactTraining/history for
 * documentation on it.
 * Use of this hook will never trigger rerenders.
 */
export const useNavigate = () => {
  const { history } = useContext(NavigationContext)!;
  return useCallback((locationDescriptor: LocationDescriptor, options?: {replace?: boolean}) => {
    if (options?.replace) {
      history.replace(locationDescriptor);
    } else {
      history.push(locationDescriptor);
    }
  }, [history]);
}

// HoC which adds a `location` property to an object, which contains the page
// location (parsed URL and route). See `useLocation`.
export const withLocation = (WrappedComponent: any) => {
  return (props: AnyBecauseTodo) => (
    <LocationContext.Consumer>
      {location =>
        <WrappedComponent
          {...props}
          location={location}
        />
      }
    </LocationContext.Consumer>
  );
}

export const getUrlClass = (): typeof URL => {
  if (isServer) {
    return require('url').URL
  } else {
    return URL
  }
}

// Given a URL which might or might not have query parameters, return a URL in
// which any query parameters found in queryParameterBlacklist are removed.
export const removeUrlParameters = (url: string, queryParameterBlacklist: string[]): string => {
  if (url.indexOf("?") < 0) return url;
  const [baseUrl, queryAndHash] = url.split("?");
  const [query, hash] = queryAndHash.split("#");
  
  const parsedQuery = qs.parse(query);
  let filteredQuery: AnyBecauseTodo = {};
  for (let key of _.keys(parsedQuery)) {
    if (_.indexOf(queryParameterBlacklist, key) < 0) {
      filteredQuery[key] = parsedQuery[key];
    }
  }
  
  return baseUrl + (Object.keys(filteredQuery).length>0 ? '?'+qs.stringify(filteredQuery) : '') + (hash ? '#'+hash : '');
}

interface DomainList {
  onsiteDomains: string[]
  mirrorDomains: string[]
}

const LwAfDomainWhitelist: DomainList = {
  onsiteDomains: [
    "lesswrong.com",
    "lesserwrong.com",
    "lessestwrong.com",
    "alignmentforum.org",
    "alignment-forum.com",
    `localhost:${getServerPort()}`,
  ],
  mirrorDomains: [
    "greaterwrong.com",
  ],
}

const URLClass = getUrlClass()
const forumDomainWhitelist: ForumOptions<DomainList> = {
  LessWrong: LwAfDomainWhitelist,
  AlignmentForum: LwAfDomainWhitelist,
  EAForum: {
    onsiteDomains: [
      'forum.effectivealtruism.org',
      'forum-staging.effectivealtruism.org',
      `localhost:${getServerPort()}`,
    ],
    mirrorDomains: ['ea.greaterwrong.com'],
  },
  default: {
    onsiteDomains: [
      new URLClass(siteUrlSetting.get()).host,
      `localhost:${getServerPort()}`,
    ],
    mirrorDomains: [],
  }
}

const domainWhitelist: DomainList = forumSelect(forumDomainWhitelist)

export const classifyHost = (host: string): "onsite"|"offsite"|"mirrorOfUs" => {
  let urlType: "onsite"|"offsite"|"mirrorOfUs" = "offsite";
  
  // Returns true if two domains are either the same, or differ only by addition or removal of a "www."
  function isSameDomainModuloWWW(a: string, b: string) {
    return a===b || "www."+a===b || a==="www."+b;
  }

  domainWhitelist.onsiteDomains.forEach((domain) => {
    if (isSameDomainModuloWWW(host, domain))
      urlType = "onsite";
  })
  domainWhitelist.mirrorDomains.forEach((domain) => {
    if (isSameDomainModuloWWW(host, domain))
      urlType = "mirrorOfUs";
  })

  return urlType;
}

// Returns whether a string could, conservatively, possibly be a database ID.
// Used for disambiguating hashes, which in some URL formats could either point
// to an anchor within a post, or a comment on that post.
// A string could possibly be an ID if is in the range of meteor's `Random.id`.
export const looksLikeDbIdString = (str: string): boolean => {
  return /^[a-zA-Z0-9]{17}$/.test(str);
}
