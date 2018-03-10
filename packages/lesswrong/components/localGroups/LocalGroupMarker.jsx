/* global google */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Marker, InfoWindow } from "react-google-maps"
import { Link } from 'react-router';

class LocalGroupMarker extends PureComponent {
  render() {
    const { group, handleMarkerClick, handleInfoWindowClose, infoOpen, location } = this.props;
    const { geometry: {location: {lat, lng}}} = location;

    var circleIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#588f27',
        fillOpacity: 0.9,
        scale: 7,
        strokeWeight: 0,
    };


    return(
      <Marker
        onClick={() => handleMarkerClick(group._id)}
        key={group._id}
        icon={circleIcon}
        position={{lat:lat, lng:lng}}
      >
        {infoOpen &&
          <InfoWindow
            onCloseClick={() => handleInfoWindowClose(group._id)}
          >
            <div style={{maxWidth: "250px"}}>
              <h5> Local Group: {group.name} </h5>
              <Components.DraftJSRenderer content={group.description} />
              <Link to={'/groups/'+group._id}> Full link </Link>
            </div>
          </InfoWindow>
        }
      </Marker>
    )
  }
}

LocalGroupMarker.propTypes = {
  group: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
}

registerComponent("LocalGroupMarker", LocalGroupMarker);
