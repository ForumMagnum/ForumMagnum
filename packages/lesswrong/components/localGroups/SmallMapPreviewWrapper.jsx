import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import { Components, registerComponent, getSetting} from 'meteor/vulcan:core';

/*
  Wrapper around SmallMapPreview to ensure the defaultProps are accessibel to the HoCs
*/

const SmallMapPreviewWrapper = (props) => {
  const mapsAPIKey = getSetting('googleMaps.apiKey', null);
  let document = props.post || props.group;
  let location = document.googleLocation && document.googleLocation.geometry && document.googleLocation.geometry.location || {lat: 37.871853, lng: -122.258423};
  return <div className="small-map-preview-wrapper">
    <Components.SmallMapPreview
      {...props}
      center={location}
      googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&v=3.exp&libraries=geometry,drawing,places`}
    />
  </div>
}

SmallMapPreviewWrapper.defaultProps = {
  loadingElement: <div style={{ height: `100%` }} />,
  containerElement: <div style={{ height: `300px` }} />,
  mapElement: <div style={{ height: `100%` }} />,
  zoom: 11,
  initialOpenWindows: []
}

registerComponent("SmallMapPreviewWrapper", SmallMapPreviewWrapper)
