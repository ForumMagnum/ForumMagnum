import { isServer } from './executionEnvironment';
import qs from 'qs';
import React, { useContext } from 'react';
import { LocationContext, NavigationContext, ServerRequestStatusContext, SubscribeLocationContext, ServerRequestStatusContextType } from './vulcan-core/appContext';
import type { RouterLocation } from './vulcan-lib/routes';
import * as _ from 'underscore';
import { ForumOptions, forumSelect } from './forumTypeUtils';

// Given the props of a component which has withRouter, return the parsed query
// from the URL.
export function parseQuery(location): Record<string,string> {
  let query = location?.search;
  if (!query) return {};
  
  // The unparsed query string looks like ?foo=bar&numericOption=5&flag but the
  // 'qs' parser wants it without the leading question mark, so strip the
  // question mark.
  if (query.startsWith('?'))
    query = query.substr(1);
    
  return qs.parse(query) as Record<string,string>;
}

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
//     "http://lesswrong.com/foo?x=1&y=abc" then pathname is "/foo?x=1&y=abc".
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

// React Hook which returns an acessor-object for page navigation. Contains one
// field, `history`. See https://github.com/ReactTraining/history for
// documentation on it.
// Use of this hook will never trigger rerenders.
export const useNavigation = (): any => {
  return useContext(NavigationContext);
}

// HoC which adds a `location` property to an object, which contains the page
// location (parsed URL and route). See `useLocation`.
export const withLocation = (WrappedComponent: any) => {
  return (props) => (
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

// HoC which adds a `history` property to an object, which is a history obejct
// as doumented on https://github.com/ReactTraining/history .
// This HoC will never trigger rerenders.
export const withNavigation = (WrappedComponent: any) => {
  return (props) => (
    <NavigationContext.Consumer>
      {navigation =>
        <WrappedComponent
          {...props}
          history={navigation.history}
        />
      }
    </NavigationContext.Consumer>
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
  let filteredQuery = {};
  for (let key of _.keys(parsedQuery)) {
    if (_.indexOf(queryParameterBlacklist, key) < 0) {
      filteredQuery[key] = parsedQuery[key];
    }
  }
  
  return baseUrl + (Object.keys(filteredQuery).length>0 ? '?'+qs.stringify(filteredQuery) : '') + (hash ? '#'+hash : '');
}

const LwAfDomainWhitelist: Array<string> = [
  "lesswrong.com",
  "lesserwrong.com",
  "lessestwrong.com",
  "alignmentforum.org",
  "alignment-forum.com",
  "greaterwrong.com",
  "localhost:3000",
  "localhost:8300"
]

const forumDomainWhitelist: ForumOptions<Array<string>> = {
  LessWrong: LwAfDomainWhitelist,
  AlignmentForum: LwAfDomainWhitelist,
  EAForum: [
    'forum.effectivealtruism.org',
    'forum-staging.effectivealtruism.org',
    'ea.greaterwrong.com',
    'localhost:3000',
    'localhost:8300'
  ],
  default: [
    'localhost:3000',
    'localhost:8300',
  ],
}

const domainWhitelist: Array<string> = forumSelect(forumDomainWhitelist)

export const hostIsOnsite = (host: string): boolean => {
  let isOnsite = false

  domainWhitelist.forEach((domain) => {
    if (host === domain) isOnsite = true;
    // If the domain differs only by the addition or removal of a "www."
    // subdomain, count it as the same.
    if ("www."+host === domain) isOnsite = true;
    if (host === "www."+domain) isOnsite = true;
  })

  return isOnsite
}

// Returns whether a string could, conservatively, possibly be a database ID.
// Used for disambiguating hashes, which in some URL formats could either point
// to an anchor within a post, or a comment on that post.
// A string could possibly be an ID if is in the range of meteor's `Random.id`.
export const looksLikeDbIdString = (str: string): boolean => {
  return /^[a-zA-Z0-9]{17}$/.test(str);
}
