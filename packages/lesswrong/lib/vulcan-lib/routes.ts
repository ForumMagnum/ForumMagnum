import * as _ from 'underscore';

export const Routes = {}; // populated by calls to addRoute

/*
 A route is defined in the list like:
 Routes.foobar = {
 name: 'foobar',
 path: '/xyz',
 component: 'FooBar'
 componentName: 'FooBar' // optional
 }
 */
export const addRoute = (routeOrRouteArray) => {

  // be sure to have an array of routes to manipulate
  const addedRoutes = Array.isArray(routeOrRouteArray) ? routeOrRouteArray : [routeOrRouteArray];

  // modify the routes table with the new routes
  addedRoutes.forEach(({name, path, ...properties}) => {

    // check if there is already a route registered to this path
    const routeWithSamePath = _.findWhere(Routes, { path });

    if (routeWithSamePath) {
      // Don't allow shadowing/replacing routes
      throw new Error(`Conflicting routes with name ${name}`);
    }

    // register the new route
    Routes[name] = {
      name,
      path,
      ...properties
    };

  });
};
