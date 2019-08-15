import React from 'react';
import { useContext } from 'react';
import qs from 'qs';
import { NavigationContext, LocationContext, SubscribeLocationContext, ServerRequestStatusContext } from 'meteor/vulcan:core';

// Given the props of a component which has withRouter, return the parsed query
// from the URL.
export function parseQuery(location) {
  let query = location?.search;
  if (!query) return {};
  
  // The unparsed query string looks like ?foo=bar&numericOption=5&flag but the
  // 'qs' parser wants it without the leading question mark, so strip the
  // question mark.
  if (query.startsWith('?'))
    query = query.substr(1);
    
  return qs.parse(query);
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
export const useLocation = () => {
  return useContext(LocationContext);
}

// React Hook which returns the server-side server request status, used to set 404s or redirects
// The relevant handling happens in the renderPage function
// This hook only works on the server and will throw an error when called on the client

export const useServerRequestStatus = () => {
  return useContext(ServerRequestStatusContext)
}

// React Hook which returns the page location, formatted as in useLocation, and
// triggers a rerender whenever navigation occurs.
export const useSubscribedLocation = () => {
  return useContext(SubscribeLocationContext);
}

// React Hook which returns an acessor-object for page navigation. Contains one
// field, `history`. See https://github.com/ReactTraining/history for
// documentation on it.
// Use of this hook will never trigger rerenders.
export const useNavigation = () => {
  return useContext(NavigationContext);
}

// HoC which adds a `location` property to an object, which contains the page
// location (parsed URL and route). See `useLocation`.
export const withLocation = (WrappedComponent) => {
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
export const withNavigation = (WrappedComponent) => {
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
