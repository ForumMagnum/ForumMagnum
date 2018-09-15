import React, { Component } from 'react';
import { Components, getSetting, withList } from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import { withRouter } from 'react-router';
import defineComponent from '../../lib/defineComponent';

const CommunityMapWrapper = (props) => {
  const mapsAPIKey = getSetting('googleMaps.apiKey', null);
    return (
      <Components.CommunityMap
        terms={props.groupQueryTerms || {view: "all", filters: props.router.location.query && props.router.location.query.filters || []}}
        loadingElement= {<div style={{ height: `100%` }} />}
        events={props.results}
        containerElement= {<div style={{height: "500px"}} className="community-map"/>}
        mapElement= {<div style={{ height: `100%` }} />}
        googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&v=3.exp&libraries=geometry,drawing,places`}
        center={props.currentUserLocation}
        {...props.mapOptions}
      />
    )
}
const listOptions = {
  collection: Posts,
  queryName: "communityMapEventsQuery",
  fragmentName: "EventsList",
  limit: 500,
}

export default defineComponent({
  name: "CommunityMapWrapper",
  component: CommunityMapWrapper,
  hocs: [ [withList, listOptions], withRouter ]
})
