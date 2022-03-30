import { Components, registerComponent, } from '../../lib/vulcan-lib';
import React from 'react';


const GroupsMap = () => {
  return <Components.CommunityMapWrapper mapOptions={{zoom: 1}} hideLegend />
}

const GroupsMapComponent = registerComponent('GroupsMap', GroupsMap);

declare global {
  interface ComponentTypes {
    GroupsMap: typeof GroupsMapComponent
  }
}
