import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { LocationContext } from '../../lib/vulcan-core/appContext';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { getRouteByName, RouterLocation } from "../../lib/vulcan-lib/routes";

const styles = (theme: ThemeType): JssStyles => ({
})

const PreloadScaffoldPage = ({classes}: {
  classes: ClassesType,
}) => {
  const location = useLocation();
  const routeName = location.query.route ?? null;
  const route = routeName ? getRouteByName(routeName) : null;
  
  if (!route || !route.componentName)
    return <div id="preload-scaffold-page"/>

  const RouteComponent: any = Components[route.componentName];
  const locationContext: RouterLocation = {
    currentRoute: route, RouteComponent,
    location,
    pathname: location.pathname,
    url: location.pathname,
    params: {}, hash: "", query: {},
  };

  return <div id="preload-scaffold-page">
    <LocationContext.Provider value={locationContext}>
      <RouteComponent/>
    </LocationContext.Provider>
  </div>
}

const PreloadScaffoldPageComponent = registerComponent('PreloadScaffoldPage', PreloadScaffoldPage, {styles});

declare global {
  interface ComponentTypes {
    PreloadScaffoldPage: typeof PreloadScaffoldPageComponent
  }
}

