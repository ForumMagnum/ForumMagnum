import React from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  previewWrapper: {
    paddingTop: 5,
    marginBottom: 20,
  }
});

/*
  Wrapper around SmallMapPreview to ensure the defaultProps are accessibel to the HoCs
*/

const SmallMapPreviewWrapper = (props) => {
  const mapsAPIKey = getSetting('googleMaps.apiKey', null);
  let document = props.post || props.group;
  const googleLocation = document.googleLocation;
  const defaultLocation = {lat: 37.871853, lng: -122.258423};
  let location = (googleLocation && googleLocation.geometry && googleLocation.geometry.location) || defaultLocation;
  return <div className={props.classes.previewWrapper}>
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

registerComponent("SmallMapPreviewWrapper", SmallMapPreviewWrapper,
  withStyles(styles, {name: "SmallMapPreviewWrapper"}))
