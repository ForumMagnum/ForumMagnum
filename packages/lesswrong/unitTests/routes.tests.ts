import { Routes } from '../lib/vulcan-lib/routes';

describe("routes table", () => {
  it("doesn't have enableResourcePrefetch on routes with URL parameters or redirect", () => {
    for (const routeName of Object.keys(Routes)) {
      const route = Routes[routeName];
      if (route.enableResourcePrefetch) {
        if (route.redirect) {
          throw new Error(`Route ${route.name} has enableResourcePrefetch set but is a server-side redirect`);
        }
        if (route.path.indexOf(':')>=0) {
          throw new Error(`Route ${route.name} has enableResourcePrefetch set but has a URL parameter.`); 
        }
      }
    }
  });
});
