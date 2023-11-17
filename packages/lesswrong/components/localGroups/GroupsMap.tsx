import { Components, registerComponent, } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

/**
 * This component is for a standalone route that displays a map of all groups.
 * Use the "zoom", "lat" and "lng" query params to set the initial map view.
 */
const GroupsMap = () => {
  const { query } = useLocation()
  
  let center = {}
  if (query.lat && parseInt(query.lat) && query.lng && parseInt(query.lng)) {
    center = {center: {lat: parseInt(query.lat), lng: parseInt(query.lng)}}
  }
  
  return <Components.CommunityMap
    groupTerms={{view: "all"}}
    zoom={parseInt(query?.zoom) || 1}
    initialOpenWindows={[]}
    showGroupsByDefault
    hideLegend
    {...center}
  />
}

const GroupsMapComponent = registerComponent('GroupsMap', GroupsMap);

declare global {
  interface ComponentTypes {
    GroupsMap: typeof GroupsMapComponent
  }
}
