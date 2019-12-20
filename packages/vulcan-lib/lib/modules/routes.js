import { Components } from './components';
import { Picker } from 'meteor/meteorhacks:picker'
import cookieParser from 'cookie-parser'


export const Routes = {}; // will be populated on startup (see vulcan:routing)
export const RoutesTable = {}; // storage for infos about routes themselves

/*
 A route is defined in the list like:
 RoutesTable.foobar = {
 name: 'foobar',
 path: '/xyz',
 component: 'FooBar'
 componentName: 'FooBar' // optional
 }

 if there there is value for parentRouteName it will look for the route and add the new route as a child of it
 */
export const addRoute = (routeOrRouteArray) => {

  // be sure to have an array of routes to manipulate
  const addedRoutes = Array.isArray(routeOrRouteArray) ? routeOrRouteArray : [routeOrRouteArray];

  // modify the routes table with the new routes
  addedRoutes.map(({name, path, ...properties}) => {

    // check if there is already a route registered to this path
    const routeWithSamePath = _.findWhere(RoutesTable, { path });

    if (routeWithSamePath) {
      // Don't allow shadowing/replacing routes
      throw new Error(`Conflicting routes with name ${name}`);
    }

    // register the new route
    RoutesTable[name] = {
      name,
      path,
      ...properties
    };

  });
};

export const extendRoute = (routeName, routeProps) => {

  const route = _.findWhere(RoutesTable, {name: routeName});

  if (route) {
    RoutesTable[route.name] = {
      ...route,
      ...routeProps
    };
  }
};

if (Picker) Picker.middleware(cookieParser())
/// Add a route which renders by putting things into the http response body
/// directly, rather than using all the Meteor/Apollo/etc stuff.
export const addStaticRoute = (url, handler) => {
  Picker.route(url, handler);
}


/**
 A route is defined in the list like: (same as above)
 RoutesTable.foobar = {
 name: 'foobar',
 path: '/xyz',
 component: 'FooBar'
 componentName: 'FooBar' // optional
 }

 NOTE: This is implemented on single level deep ONLY for now
 **/


export const getRoute = name => {
  const routeDef = RoutesTable[name];
  return routeDef;
};

/**
 * Populate the lookup table for routes to be callable
 * ℹ️ Called once on app startup
 **/
export const populateRoutesApp = () => {
  // loop over each component in the list
  Object.keys(RoutesTable).map(name => {
    // populate an entry in the lookup table
    Routes[name] = getRoute(name);

    // uncomment for debug
    // console.log('init route:', name);
  });
};

