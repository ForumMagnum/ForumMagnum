import React from 'react';
import { Components, registerComponent, getSetting, withList} from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { withRouter } from 'react-router';

const CommunityMapWrapper = ({router, groupQueryTerms, results, currentUserLocation, mapOptions}) => {
  const mapsAPIKey = getSetting('googleMaps.apiKey', null);
  
  return (
    <Components.CommunityMap
      terms={groupQueryTerms || {view: "all", filters: (router.location.query && router.location.query.filters) || []}}
      loadingElement= {<div style={{ height: `100%` }} />}
      events={results}
      containerElement= {<div style={{height: "500px"}} className="community-map"/>}
      mapElement= {<div style={{ height: `100%` }} />}
      googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&v=3.exp&libraries=geometry,drawing,places`}
      center={currentUserLocation}
      {...mapOptions}
    />
  )
}
const listOptions = {
  collection: Posts,
  queryName: "communityMapEventsQuery",
  fragmentName: "PostsList",
  limit: 500,
}

registerComponent("CommunityMapWrapper", CommunityMapWrapper, [withList, listOptions], withRouter)
