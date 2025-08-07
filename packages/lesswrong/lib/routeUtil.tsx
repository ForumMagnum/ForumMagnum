import { isServer } from './executionEnvironment';
import qs from 'qs';
import React, { useCallback, useContext } from 'react';
import { LocationContext, ServerRequestStatusContext, SubscribeLocationContext, ServerRequestStatusContextType, NavigationContext } from './vulcan-core/appContext';
import type { RouterLocation, SegmentedUrl } from './vulcan-lib/routes';
import { ForumOptions, forumSelect } from './forumTypeUtils';
import { createPath, type LocationDescriptor, parsePath } from 'history';
import {siteUrlSetting} from './instanceSettings'
import { getUrlClass } from '@/server/utils/getUrlClass';

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

function getUpdatedLocationDescriptor(currentLocation: SegmentedUrl, locationDescriptor: LocationDescriptor) {
  if (typeof locationDescriptor === 'object') {
    return { ...currentLocation, ...locationDescriptor };
  }

  const parsedLocationDescriptor = parsePath(locationDescriptor);
  const { pathname, search, hash } = parsedLocationDescriptor;
  if (hash && !pathname && !search) {
    return { ...currentLocation, hash };
  } 
  return { ...currentLocation, ...parsedLocationDescriptor };
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
  const { location } = useLocation();
  return useCallback((locationDescriptor: LocationDescriptor | -1 | 1, options?: {replace?: boolean, openInNewTab?: boolean, skipRouter?: boolean}) => {
    if (locationDescriptor === -1) {
      history.back();
    } else if (locationDescriptor === 1) {
      history.forward();
    } else {
      const updatedLocationDescriptor = getUpdatedLocationDescriptor(location, locationDescriptor);
      const normalizedLocation = createPath(updatedLocationDescriptor);

      if (options?.openInNewTab) {
        window.open(normalizedLocation, '_blank')?.focus();
      } else if (options?.replace) {
        history.replace(normalizedLocation);
      } else {
        // The behavior of Next's router.push when handling hash changes
        // while on the same route is either broken or deranged, so we
        // need to do something rather more complicated.
        if (options?.skipRouter) {
          // Problem!  window.history.pushState doesn't update the value
          // that comes out of `useLocation` for hash updates, so we 
          // need to manually fire a `hashchange` event and listen for it
          // in ClientAppGenerator.
          window.history.pushState(null, '', normalizedLocation);

          const hashChanged = updatedLocationDescriptor.hash !== location.hash;

          if (hashChanged) {
            const base = new URL(window.location.href).origin;
            const oldURL = new URL(createPath(location), base).toString();
            const newURL = new URL(normalizedLocation, base).toString();
            const hashChangeEvent = new HashChangeEvent('hashchange', { oldURL, newURL });
            window.dispatchEvent(hashChangeEvent);
          }
        } else {
          history.push(normalizedLocation);
        }
      }
    }
  }, [history, location]);
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

// Given a URL which might or might not have query parameters, return a URL in
// which any query parameters found in queryParameterBlacklist are removed.
export const removeUrlParameters = (url: string, queryParameterBlacklist: string[]): string => {
  if (url.indexOf("?") < 0) return url;
  const [baseUrl, queryAndHash] = url.split("?");
  const [query, hash] = queryAndHash.split("#");
  
  const parsedQuery = qs.parse(query);
  let filteredQuery: AnyBecauseTodo = {};
  for (let key of Object.keys(parsedQuery)) {
    if (!queryParameterBlacklist.includes(key)) {
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
    "baserates.org",
    "alignmentforum.org",
    "alignment-forum.com",
    // TODO: fix this to not use `getCommandLineArguments` anymore
    // `localhost:${getCommandLineArguments().localhostUrlPort}`,
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
      // TODO: fix this to not use `getCommandLineArguments` anymore
      // `localhost:${getCommandLineArguments().localhostUrlPort}`,
    ],
    mirrorDomains: ['ea.greaterwrong.com'],
  },
  default: {
    onsiteDomains: [
      new URLClass(siteUrlSetting.get()).host,
      // TODO: fix this to not use `getCommandLineArguments` anymore
      // `localhost:${getCommandLineArguments().localhostUrlPort}`,
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
